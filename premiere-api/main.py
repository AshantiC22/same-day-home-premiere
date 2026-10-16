import secrets
from datetime import datetime, timedelta, timezone

from fastapi import Depends, FastAPI, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models import LoginSession, User
from security import hash_password, verify_password

app = FastAPI(title="Same-Day Home Premiere API")

SESSION_DAYS = 7
MAX_ATTEMPTS = 5
LOCK_MINUTES = 15


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