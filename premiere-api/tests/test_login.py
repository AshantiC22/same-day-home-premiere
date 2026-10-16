import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

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
