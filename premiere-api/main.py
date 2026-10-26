import secrets
from datetime import datetime, timedelta, timezone

from fastapi import Cookie, Depends, FastAPI, HTTPException, Response
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models import AuditLog, LoginSession, Movie, Premiere, Purchase, User
from security import hash_password, verify_password

app = FastAPI(title="Same-Day Home Premiere API")

SESSION_DAYS = 7
MAX_ATTEMPTS = 5
LOCK_MINUTES = 15
PREMIERE_WINDOW_DAYS = 7


@app.get("/api/health")
def health():
    return {"status": "ok"}


class SignupIn(BaseModel):
    email: str
    password: str


@app.post("/api/auth/signup", status_code=201)
def signup(body: SignupIn, db: Session = Depends(get_db)):
    # 1. Clean the email: strip spaces, make it lowercase.
    email = body.email.strip().lower()

    # 2. Look for a user with that email.
    existing = db.scalar(select(User).where(User.email == email))

    # 3. If one exists, answer 409.
    if existing:
        raise HTTPException(status_code=409, detail="EMAIL_TAKEN")

    # 4. Build a new User with the HASHED password.
    user = User(email=email, password_hash=hash_password(body.password))

    # 5. Stage it, then try to save it.
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="EMAIL_TAKEN")

    # 6. Answer with id and email. Never the password.
    return {"id": user.id, "email": user.email}


class LoginIn(BaseModel):
    email: str
    password: str


@app.post("/api/auth/login")
def login(body: LoginIn, response: Response, db: Session = Depends(get_db)):
    # 1. Clean the email (same as signup).
    email = body.email.strip().lower()
    # 2. Find the user with that email.
    user = db.scalar(select(User).where(User.email == email))
    now = datetime.now(timezone.utc)
    # A. Locked? Answer 429 before looking at the password.
    if user is not None and user.locked_until is not None and user.locked_until > now:
        raise HTTPException(status_code=429, detail="ACCOUNT_LOCKED")
    # 3. Is the login good?
    ok = user is not None and verify_password(body.password, user.password_hash)
    # B. Bad login: count it, maybe lock, SAVE, then answer 401.
    if not ok:
        if user is not None:
            user.failed_attempts += 1
            if user.failed_attempts >= MAX_ATTEMPTS:
                user.locked_until = now + timedelta(minutes=LOCK_MINUTES)
                user.failed_attempts = 0
            db.commit()
        raise HTTPException(status_code=401, detail="INVALID_CREDENTIALS")
    # C. Good login: wipe the counter and any old lock.
    user.failed_attempts = 0
    user.locked_until = None
    # 4. Make a random session id.
    session_id = secrets.token_urlsafe(32)
    # 5. Save a LoginSession row that expires in 7 days.
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)
    db.add(LoginSession(id=session_id, user_id=user.id, expires_at=expires_at))
    db.commit()
    # 6. Set the cookie (HttpOnly).
    response.set_cookie("session_id", session_id, httponly=True, samesite="lax",
                        max_age=SESSION_DAYS * 24 * 60 * 60)
    # 7. Answer with id and email.
    return {"id": user.id, "email": user.email}


def get_current_user(
    session_id: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
):
    # 1. No cookie at all: answer 401.
    if session_id is None:
        raise HTTPException(status_code=401, detail="NOT_LOGGED_IN")
    # 2. Find the session row with that id.
    row = db.scalar(select(LoginSession).where(LoginSession.id == session_id))
    # 3. No row, or it has expired: answer 401.
    if row is None or row.expires_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="NOT_LOGGED_IN")
    # 4. Find the user and hand it back.
    return db.get(User, row.user_id)


@app.get("/api/me")
def me(user: User = Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "role": user.role}


@app.post("/api/auth/logout")
def logout(
    response: Response,
    session_id: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
):
    # 1. If there is a cookie, delete that session row.
    if session_id is not None:
        row = db.scalar(select(LoginSession).where(LoginSession.id == session_id))
        if row is not None:
            db.delete(row)
            db.commit()
    # 2. Tell the browser to forget the cookie.
    response.delete_cookie("session_id")
    # 3. Answer.
    return {"ok": True}


@app.get("/api/premieres")
def list_premieres(db: Session = Depends(get_db)):
    # 1. What time is it now (UTC)?
    now = datetime.now(timezone.utc)
    # 2. Premieres joined to their movie: not cancelled, window not over, soonest first.
    rows = db.execute(
        select(Premiere, Movie)
        .join(Movie, Premiere.movie_id == Movie.id)
        .where(Premiere.cancelled_at.is_(None))
        .where(Premiere.window_ends_at > now)
        .order_by(Premiere.starts_at)
    ).all()
    # 3. One dictionary per row, with a computed state.
    return [
        {
            "id": p.id,
            "title": m.title,
            "synopsis": m.synopsis,
            "starts_at": p.starts_at,
            "window_ends_at": p.window_ends_at,
            "price_cents": p.price_cents,
            "currency": p.currency,
            "state": "UPCOMING" if now < p.starts_at else "LIVE",
        }
        for p, m in rows
    ]
@app.get("/api/premieres/{premiere_id}")
def get_premiere(premiere_id: int, db: Session = Depends(get_db)):
    # 1. What time is it now (UTC)?
    now = datetime.now(timezone.utc)
    # 2. Find this one premiere joined to its movie: not cancelled, window not over.
    row = db.execute(
        select(Premiere, Movie)
        .join(Movie, Premiere.movie_id == Movie.id)
        .where(Premiere.id == premiere_id)
        .where(Premiere.cancelled_at.is_(None))
        .where(Premiere.window_ends_at > now)
    ).first()
    # 3. Not there? 404 PREMIERE_NOT_FOUND.
    if row is None:
        raise HTTPException(status_code=404, detail="PREMIERE_NOT_FOUND")
    # 4. Same dictionary as the catalog, for this one row.
    p, m = row
    return {
        "id": p.id,
        "title": m.title,
        "synopsis": m.synopsis,
        "starts_at": p.starts_at,
        "window_ends_at": p.window_ends_at,
        "price_cents": p.price_cents,
        "currency": p.currency,
        "state": "UPCOMING" if now < p.starts_at else "LIVE",
    }

def require_admin(user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="ADMIN_ONLY")
    return user


class MovieIn(BaseModel):
    title: str = Field(min_length=1)
    movie_length: int = Field(gt=0)
    synopsis: str | None = None


@app.post("/api/admin/movies", status_code=201)
def create_movie(
    body: MovieIn,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    # 1. Build the movie and stage it.
    movie = Movie(title=body.title, movie_length=body.movie_length, synopsis=body.synopsis)
    db.add(movie)
    # 2. flush() sends the INSERT now (so movie.id exists) but does not save for good.
    db.flush()
    # 3. Record who did it, then save the movie and the audit row together.
    db.add(AuditLog(admin_id=admin.id, action="movie.create", target_id=movie.id))
    db.commit()
    return {"id": movie.id, "title": movie.title}


class PremiereIn(BaseModel):
    movie_id: int
    starts_at: datetime
    window_ends_at: datetime | None = None
    display_time_zone: str
    price_cents: int = Field(ge=0)


@app.post("/api/admin/premieres", status_code=201)
def create_premiere(
    body: PremiereIn,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    # 1. Times must carry a timezone (we store UTC).
    if body.starts_at.tzinfo is None or (
        body.window_ends_at is not None and body.window_ends_at.tzinfo is None
    ):
        raise HTTPException(status_code=422, detail="TIMEZONE_REQUIRED")
    # 2. No window given: default to 7 days after the start.
    window_ends_at = body.window_ends_at or body.starts_at + timedelta(days=PREMIERE_WINDOW_DAYS)
    # 3. The window must end after the start, and the start must be in the future.
    if window_ends_at <= body.starts_at:
        raise HTTPException(status_code=422, detail="WINDOW_BEFORE_START")
    if body.starts_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=422, detail="STARTS_IN_PAST")
    # 4. The movie must exist.
    if db.get(Movie, body.movie_id) is None:
        raise HTTPException(status_code=404, detail="MOVIE_NOT_FOUND")
    # 5. Build the premiere, record the audit row, save both together.
    premiere = Premiere(
        movie_id=body.movie_id,
        starts_at=body.starts_at,
        window_ends_at=window_ends_at,
        display_time_zone=body.display_time_zone,
        price_cents=body.price_cents,
    )
    db.add(premiere)
    db.flush()
    db.add(AuditLog(admin_id=admin.id, action="premiere.create", target_id=premiere.id))
    db.commit()
    return {"id": premiere.id}


@app.post("/api/admin/premieres/{premiere_id}/cancel")
def cancel_premiere(
    premiere_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    # 1. Find it.
    premiere = db.get(Premiere, premiere_id)
    if premiere is None:
        raise HTTPException(status_code=404, detail="PREMIERE_NOT_FOUND")
    # 2. Already cancelled? Say so.
    if premiere.cancelled_at is not None:
        raise HTTPException(status_code=409, detail="ALREADY_CANCELLED")
    # 3. Mark it cancelled, record the audit row, save both together.
    premiere.cancelled_at = datetime.now(timezone.utc)
    db.add(AuditLog(admin_id=admin.id, action="premiere.cancel", target_id=premiere.id))
    db.commit()
    return {"id": premiere.id, "cancelled": True}

@app.post("/api/premieres/{premiere_id}/playback")
def playback(
    premiere_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. What time is it now (UTC)?
    now = datetime.now(timezone.utc)
    # 2. Find the premiere. Not there? 404 PREMIERE_NOT_FOUND.
    premiere = db.get(Premiere, premiere_id)
    if premiere is None:
        raise HTTPException(status_code=404, detail="PREMIERE_NOT_FOUND")
    # 3. Find a PAID purchase for this user and this premiere. None? 403 NOT_PURCHASED.
    purchase = db.scalar(
        select(Purchase)
        .where(Purchase.user_id == user.id)
        .where(Purchase.premiere_id == premiere_id)
        .where(Purchase.status == "paid")
    )
    if purchase is None:
        raise HTTPException(status_code=403, detail="NOT_PURCHASED")
    # 4. Past window_ends_at? 410 WINDOW_ENDED.
    if now >= premiere.window_ends_at:
        raise HTTPException(status_code=410, detail="WINDOW_ENDED")
    # 5. Before starts_at? 403 PREMIERE_NOT_STARTED.
    if now < premiere.starts_at:
        raise HTTPException(status_code=403, detail="PREMIERE_NOT_STARTED")
    # 6. Answer {"allowed": True} for now.
    return {"allowed": True}

@app.get("/api/admin/movies")
def list_movies(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    movies = db.scalars(select(Movie).order_by(Movie.title)).all()
    return [{"id": m.id, "title": m.title} for m in movies]
    