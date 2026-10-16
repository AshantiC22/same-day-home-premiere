import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from database import get_db
from main import app
from models import User


@pytest.fixture
def client(session):
    """A test client wired to the throwaway premiere_test session."""

    def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_signup_creates_user(client, session):
    response = client.post(
        "/api/auth/signup",
        json={"email": " New@Example.com ", "password": "devpass1"},
    )
    assert response.status_code == 201
    body = response.json()
    assert set(body) == {"id", "email"}  # no password, no hash
    assert body["email"] == "new@example.com"  # cleaned

    user = session.scalar(select(User).where(User.email == "new@example.com"))
    assert user is not None
    assert user.password_hash != "devpass1"  # never plain text
    assert user.password_hash.startswith("$argon2")


def test_signup_duplicate_email_is_409(client):
    first = client.post(
        "/api/auth/signup", json={"email": "dup@example.com", "password": "devpass1"}
    )
    assert first.status_code == 201

    second = client.post(
        "/api/auth/signup", json={"email": " DUP@example.com", "password": "other"}
    )
    assert second.status_code == 409
    assert second.json() == {"detail": "EMAIL_TAKEN"}


def test_signup_missing_password_is_422(client):
    response = client.post("/api/auth/signup", json={"email": "a@b.com"})
    assert response.status_code == 422


def test_signup_race_is_409_not_500(client, session, monkeypatch):
    # A user already exists, but pretend the lookup missed it,
    # like the second of two requests racing at the same instant.
    session.add(User(email="race@example.com", password_hash="x"))
    session.commit()
    monkeypatch.setattr(session, "scalar", lambda *args, **kwargs: None)

    response = client.post(
        "/api/auth/signup", json={"email": "race@example.com", "password": "devpass1"}
    )
    assert response.status_code == 409

def test_signup_missing_email_is_422(client):
    response = client.post("/api/auth/signup", json={"password": "devpass1"})
    assert response.status_code == 422