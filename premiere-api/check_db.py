from database import engine
from sqlalchemy import create_engine,text


with engine.connect() as conn:
    rows = conn.execute(text('SELECT movie_id,starts_at, price_cents,currency,cancelled_at FROM premieres ORDER BY id'))
    for row in rows:
        print(row.movie_id, row.starts_at, row.price_cents, row.currency, row.cancelled_at)