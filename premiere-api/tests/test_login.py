import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from datetime import datetime, timedelta, timezone

from database import get_db
from main import app
from models import LoginSession, User
from security import hash_password


@pytest.fixture
def client(session):
    def override_get_db():
        yield session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def user(session):
    u = User(email="fan@example.com", password_hash=hash_password("devpass1"))
    session.add(u)
    session.commit()
    return u


def test_login_sets_cookie_and_creates_session(client, session, user):
    response = client.post(
        "/api/auth/login", json={"email": " FAN@example.com ", "password": "devpass1"}
    )
    assert response.status_code == 200
    assert response.json() == {"id": user.id, "email": "fan@example.com"}
    assert "httponly" in response.headers["set-cookie"].lower()

    session_id = response.cookies.get("session_id")
    assert session_id
    row = session.scalar(select(LoginSession).where(LoginSession.id == session_id))
    assert row is not None
    assert row.user_id == user.id


def test_login_wrong_password_is_401(client, user):
    response = client.post(
        "/api/auth/login", json={"email": "fan@example.com", "password": "wrong"}
    )
    assert response.status_code == 401
    assert response.json() == {"detail": "INVALID_CREDENTIALS"}
    assert response.cookies.get("session_id") is None


def test_login_unknown_email_gets_the_same_401(client):
    response = client.post(
        "/api/auth/login", json={"email": "nobody@example.com", "password": "devpass1"}
    )
    assert response.status_code == 401
    assert response.json() == {"detail": "INVALID_CREDENTIALS"}

def test_login_missing_password_is_422(client):
    response = client.post("/api/auth/signup", json={"email": "a@b.com"})
    assert response.status_code == 422

def test_five_wrong_passwords_lock_the_account(client, user):
    for _ in range(5):
        response = client.post(
            "/api/auth/login", json={"email": "fan@example.com", "password": "wrong"}
        )
        assert response.status_code == 401

    response = client.post(
        "/api/auth/login", json={"email": "fan@example.com", "password": "devpass1"}
    )
    assert response.status_code == 429
    assert response.json() == {"detail": "ACCOUNT_LOCKED"}

def test_expired_lock_lets_you_log_in(client, session, user):
    user.locked_until = datetime.now(timezone.utc) - timedelta(minutes=1)
    session.commit()

    response = client.post(
        "/api/auth/login", json={"email": "fan@example.com", "password": "devpass1"}
    )
    assert response.status_code == 200

    session.refresh(user)
    assert user.locked_until is None

def log_in(client):
    response = client.post(
        "/api/auth/login", json={"email": "fan@example.com", "password": "devpass1"}
    )
    assert response.status_code == 200


def test_me_without_cookie_is_401(client):
    response = client.get("/api/me")
    assert response.status_code == 401
    assert response.json() == {"detail": "NOT_LOGGED_IN"}


def test_me_after_login_returns_the_user(client, user):
    log_in(client)
    response = client.get("/api/me")
    assert response.status_code == 200
    assert response.json() == {"id": user.id, "email": "fan@example.com", "role": "user"}


def test_me_with_expired_session_is_401(client, session, user):
    log_in(client)
    row = session.scalar(select(LoginSession).where(LoginSession.user_id == user.id))
    row.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    session.commit()

    response = client.get("/api/me")
    assert response.status_code == 401


def test_logout_ends_the_session(client, session, user):
    log_in(client)
    response = client.post("/api/auth/logout")
    assert response.status_code == 200
    assert response.json() == {"ok": True}

    assert client.get("/api/me").status_code == 401
    assert session.scalar(select(LoginSession).where(LoginSession.user_id == user.id)) is None


def test_logout_without_cookie_is_ok(client):
    response = client.post("/api/auth/logout")
    assert response.status_code == 200

