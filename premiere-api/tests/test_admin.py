from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import select

from models import AuditLog, Movie, Premiere, User
from security import hash_password


@pytest.fixture
def admin(session):
    a = User(email="boss@example.com", password_hash=hash_password("devpass1"), role="admin")
    session.add(a)
    session.commit()
    return a


@pytest.fixture
def movie(session):
    m = Movie(title="Night Shift", movie_length=95, synopsis="A short film.")
    session.add(m)
    session.commit()
    return m


def log_in_as(client, email):
    response = client.post("/api/auth/login", json={"email": email, "password": "devpass1"})
    assert response.status_code == 200


def in_days(days):
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()


def premiere_body(movie, **changes):
    body = {
        "movie_id": movie.id,
        "starts_at": in_days(2),
        "display_time_zone": "America/Chicago",
        "price_cents": 1500,
    }
    body.update(changes)
    return body


def test_admin_endpoints_need_login(client):
    response = client.post("/api/admin/movies", json={"title": "X", "movie_length": 90})
    assert response.status_code == 401


def test_regular_user_gets_403(client, user):
    log_in_as(client, "fan@example.com")
    response = client.post("/api/admin/movies", json={"title": "X", "movie_length": 90})
    assert response.status_code == 403
    assert response.json() == {"detail": "ADMIN_ONLY"}


def test_admin_creates_movie_and_audit_row(client, session, admin):
    log_in_as(client, "boss@example.com")
    response = client.post(
        "/api/admin/movies", json={"title": "Night Shift", "movie_length": 95}
    )
    assert response.status_code == 201
    movie_id = response.json()["id"]
    assert session.get(Movie, movie_id).title == "Night Shift"

    audit = session.scalar(select(AuditLog))
    assert audit.action == "movie.create"
    assert audit.admin_id == admin.id
    assert audit.target_id == movie_id


def test_admin_schedules_premiere_with_default_window(client, session, admin, movie):
    log_in_as(client, "boss@example.com")
    response = client.post("/api/admin/premieres", json=premiere_body(movie))
    assert response.status_code == 201

    premiere = session.get(Premiere, response.json()["id"])
    assert premiere.window_ends_at - premiere.starts_at == timedelta(days=7)
    audit = session.scalar(select(AuditLog))
    assert audit.action == "premiere.create"
    assert audit.target_id == premiere.id


def test_schedule_rejects_a_start_in_the_past(client, admin, movie):
    log_in_as(client, "boss@example.com")
    response = client.post("/api/admin/premieres", json=premiere_body(movie, starts_at=in_days(-1)))
    assert response.status_code == 422
    assert response.json() == {"detail": "STARTS_IN_PAST"}


def test_schedule_rejects_a_time_without_timezone(client, admin, movie):
    log_in_as(client, "boss@example.com")
    response = client.post(
        "/api/admin/premieres", json=premiere_body(movie, starts_at="2030-01-01T19:00:00")
    )
    assert response.status_code == 422
    assert response.json() == {"detail": "TIMEZONE_REQUIRED"}


def test_schedule_rejects_window_that_ends_before_it_starts(client, admin, movie):
    log_in_as(client, "boss@example.com")
    response = client.post(
        "/api/admin/premieres", json=premiere_body(movie, window_ends_at=in_days(1))
    )
    assert response.status_code == 422
    assert response.json() == {"detail": "WINDOW_BEFORE_START"}


def test_schedule_unknown_movie_is_404(client, admin):
    log_in_as(client, "boss@example.com")
    body = {
        "movie_id": 999,
        "starts_at": in_days(2),
        "display_time_zone": "America/Chicago",
        "price_cents": 1500,
    }
    response = client.post("/api/admin/premieres", json=body)
    assert response.status_code == 404
    assert response.json() == {"detail": "MOVIE_NOT_FOUND"}


def test_schedule_negative_price_is_422(client, admin, movie):
    log_in_as(client, "boss@example.com")
    response = client.post("/api/admin/premieres", json=premiere_body(movie, price_cents=-1))
    assert response.status_code == 422


def test_cancel_removes_premiere_from_catalog(client, session, admin, movie):
    log_in_as(client, "boss@example.com")
    created = client.post("/api/admin/premieres", json=premiere_body(movie))
    premiere_id = created.json()["id"]
    assert len(client.get("/api/premieres").json()) == 1

    response = client.post(f"/api/admin/premieres/{premiere_id}/cancel")
    assert response.status_code == 200
    assert client.get("/api/premieres").json() == []
    actions = session.scalars(select(AuditLog.action).order_by(AuditLog.id)).all()
    assert actions == ["premiere.create", "premiere.cancel"]


def test_cancel_twice_is_409(client, admin, movie):
    log_in_as(client, "boss@example.com")
    premiere_id = client.post("/api/admin/premieres", json=premiere_body(movie)).json()["id"]
    assert client.post(f"/api/admin/premieres/{premiere_id}/cancel").status_code == 200
    response = client.post(f"/api/admin/premieres/{premiere_id}/cancel")
    assert response.status_code == 409
    assert response.json() == {"detail": "ALREADY_CANCELLED"}


def test_cancel_unknown_premiere_is_404(client, admin):
    log_in_as(client, "boss@example.com")
    response = client.post("/api/admin/premieres/999/cancel")
    assert response.status_code == 404