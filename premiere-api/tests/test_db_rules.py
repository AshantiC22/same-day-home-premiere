from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from models import Movie, Premiere, Purchase, User


def make_user_and_premiere(session):
    now = datetime.now(timezone.utc)
    movie = Movie(title="Test Movie", movie_length=100)
    user = User(email="fan@example.com", password_hash="x")
    session.add_all([movie, user])
    session.flush()
    premiere = Premiere(
        movie_id=movie.id,
        starts_at=now,
        window_ends_at=now + timedelta(days=7),
        display_time_zone="America/Chicago",
        price_cents=1500,
    )
    session.add(premiere)
    session.flush()
    return user, premiere


def test_pytest_works():
    assert 1 + 1 == 2


def test_tables_start_empty(session):
    movies = session.scalars(select(Movie)).all()
    assert movies == []


def test_negative_price_is_rejected(session):
    user, premiere = make_user_and_premiere(session)
    now = datetime.now(timezone.utc)
    session.add(
        Premiere(
            movie_id=premiere.movie_id,
            starts_at=now,
            window_ends_at=now + timedelta(days=1),
            display_time_zone="America/Chicago",
            price_cents=-1,
        )
    )
    with pytest.raises(IntegrityError):
        session.commit()


def test_bad_status_is_rejected(session):
    user, premiere = make_user_and_premiere(session)
    session.add(
        Purchase(
            user_id=user.id,
            premiere_id=premiere.id,
            status="banana",
            amount_cents=1500,
        )
    )
    with pytest.raises(IntegrityError):
        session.commit()

def test_second_active_purchase_is_blocked(session):
    user, premiere = make_user_and_premiere(session)
    session.add(
        Purchase(user_id=user.id, premiere_id=premiere.id, status="pending", amount_cents=1500)
    )
    session.commit()
    session.add(
        Purchase(user_id=user.id, premiere_id=premiere.id, status="pending", amount_cents=1500)
    )
    with pytest.raises(IntegrityError):
        session.commit()


def test_rebuy_after_expiry_is_allowed(session):
    user, premiere = make_user_and_premiere(session)
    session.add(
        Purchase(user_id=user.id, premiere_id=premiere.id, status="expired", amount_cents=1500)
    )
    session.commit()
    session.add(
        Purchase(user_id=user.id, premiere_id=premiere.id, status="pending", amount_cents=1500)
    )
    session.commit()
    purchases = session.scalars(select(Purchase)).all()
    assert len(purchases) == 2