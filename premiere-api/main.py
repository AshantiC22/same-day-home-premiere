from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import User
from security import hash_password

app = FastAPI(title="Same-Day Home Premiere API")


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

    # 5. Stage it, then save it.
    db.add(user)
    db.commit()

    # 6. Answer with id and email. Never the password.
    return {"id": user.id, "email": user.email}