from datetime import datetime, timedelta, timezone

from models import Movie, Premiere


def add_premiere(session, movie, starts_in, ends_in, cancelled=False):
    now = datetime.now(timezone.utc)
    premiere = Premiere(
        movie_id=movie.id,
        starts_at=now + starts_in,
        window_ends_at=now + ends_in,
        display_time_zone="America/Chicago",
        price_cents=1500,
        cancelled_at=now if cancelled else None,
    )
    session.add(premiere)
    session.commit()
    return premiere


def make_movie(session, title="Night Shift"):
    movie = Movie(title=title, movie_length=95, synopsis="A short film.")
    session.add(movie)
    session.commit()
    return movie


def test_catalog_is_public_and_starts_empty(client):
    response = client.get("/api/premieres")
    assert response.status_code == 200
    assert response.json() == []


def test_catalog_shows_live_and_upcoming_with_state(client, session):
    movie = make_movie(session)
    add_premiere(session, movie, timedelta(days=1), timedelta(days=8))    # upcoming
    add_premiere(session, movie, timedelta(hours=-1), timedelta(days=7))  # live

    response = client.get("/api/premieres")
    assert response.status_code == 200
    items = response.json()
    assert [item["state"] for item in items] == ["LIVE", "UPCOMING"]  # soonest first
    first = items[0]
    assert first["title"] == "Night Shift"
    assert first["price_cents"] == 1500
    assert first["currency"] == "usd"
    assert set(first) == {
        "id", "title", "synopsis", "starts_at", "window_ends_at",
        "price_cents", "currency", "state",
    }


def test_catalog_hides_cancelled_and_ended(client, session):
    movie = make_movie(session)
    good = add_premiere(session, movie, timedelta(days=1), timedelta(days=8))
    add_premiere(session, movie, timedelta(days=1), timedelta(days=8), cancelled=True)
    add_premiere(session, movie, timedelta(days=-10), timedelta(days=-3))  # window over

    response = client.get("/api/premieres")
    assert [item["id"] for item in response.json()] == [good.id]