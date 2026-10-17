from datetime import datetime, timedelta, timezone

from models import Movie, Premiere, Purchase


def make_premiere(session):
    movie = Movie(title="Night Shift", movie_length=95, synopsis="A short film.")
    session.add(movie)
    session.commit()
    now = datetime.now(timezone.utc)
    premiere = Premiere(
        movie_id=movie.id,
        starts_at=now - timedelta(hours=1),
        window_ends_at=now + timedelta(days=6),
        display_time_zone="America/Chicago",
        price_cents=1500,
    )
    session.add(premiere)
    session.commit()
    return premiere


def buy(session, user, premiere, status="paid"):
    purchase = Purchase(
        user_id=user.id,
        premiere_id=premiere.id,
        status=status,
        amount_cents=premiere.price_cents,
    )
    session.add(purchase)
    session.commit()
    return purchase


def log_in(client):
    response = client.post(
        "/api/auth/login", json={"email": "fan@example.com", "password": "devpass1"}
    )
    assert response.status_code == 200


def test_playback_needs_login(client, session):
    premiere = make_premiere(session)
    response = client.post(f"/api/premieres/{premiere.id}/playback")
    assert response.status_code == 401
    assert response.json()["detail"] == "NOT_LOGGED_IN"


def test_playback_unknown_premiere_is_404(client, user):
    log_in(client)
    response = client.post("/api/premieres/9999/playback")
    assert response.status_code == 404
    assert response.json()["detail"] == "PREMIERE_NOT_FOUND"


def test_playback_without_purchase_is_403(client, session, user):
    premiere = make_premiere(session)
    log_in(client)
    response = client.post(f"/api/premieres/{premiere.id}/playback")
    assert response.status_code == 403
    assert response.json()["detail"] == "NOT_PURCHASED"


def test_playback_pending_purchase_does_not_count(client, session, user):
    premiere = make_premiere(session)
    buy(session, user, premiere, status="pending")
    log_in(client)
    response = client.post(f"/api/premieres/{premiere.id}/playback")
    assert response.status_code == 403
    assert response.json()["detail"] == "NOT_PURCHASED"


def test_playback_paid_purchase_is_allowed(client, session, user):
    premiere = make_premiere(session)
    buy(session, user, premiere)
    log_in(client)
    response = client.post(f"/api/premieres/{premiere.id}/playback")
    assert response.status_code == 200
    assert response.json() == {"allowed": True}