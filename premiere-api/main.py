from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Same-Day Home Premiere API")


@app.get("/api/health")
def health():
    return {"status": "ok"}


class SignupIn(BaseModel):
    email: str
    password: str


@app.post("/api/auth/signup", status_code=201)
def signup(body: SignupIn):
    return {"email": body.email}