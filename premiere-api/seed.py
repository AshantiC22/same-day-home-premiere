from datetime import datetime, timedelta, timezone

from sqlalchemy import delete
from sqlalchemy.orm import Session

from database import engine
from models import Movie, Premiere, Purchase

with Session(engine) as session:
    # wipe: children first, then parents
    session.execute(delete(Purchase))
    session.execute(delete(Premiere))
    session.execute(delete(Movie))

    fast = Movie(title="2 Fast 2 Furious", movie_length=107)
    redline = Movie(title="Redline", movie_length=122)
    batman = Movie(title="Batman Begins", movie_length=141)
    session.add_all([fast, redline, batman])
    session.flush()  # Postgres hands out the ids now

    now = datetime.now(timezone.utc)
    week = timedelta(days=7)

    soon = now + timedelta(minutes=2)
    started = now - timedelta(hours=1)
    long_ago = now - timedelta(days=10)
    next_week = now + week

    session.add_all([
        Premiere(  # scheduled: starts in 2 minutes
            movie_id=batman.id,
            starts_at=soon,
            window_ends_at=soon + week,
            display_time_zone="America/Chicago",
            price_cents=1500,
        ),
        Premiere(  # live: started 1 hour ago
            movie_id=redline.id,
            starts_at=started,
            window_ends_at=started + week,
            display_time_zone="America/Chicago",
            price_cents=1200,
        ),
        Premiere(  # ended: window closed 3 days ago
            movie_id=fast.id,
            starts_at=long_ago,
            window_ends_at=long_ago + week,
            display_time_zone="America/Chicago",
            price_cents=1000,
        ),
        Premiere(  # cancelled: was due next week
            movie_id=fast.id,
            starts_at=next_week,
            window_ends_at=next_week + week,
            display_time_zone="America/Chicago",
            price_cents=1000,
            cancelled_at=now,
        ),
    ])
    session.commit()