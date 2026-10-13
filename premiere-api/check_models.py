from database import engine
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from models import Movie, Premiere


with Session(engine) as session:
    for movie in session.scalars(select(Movie).order_by(Movie.id)):
        print(movie.title, movie.movie_length)

    for p in session.scalars(select(Premiere).order_by(Premiere.id)):
        print(p.movie_id, p.starts_at, p.price_cents, p.currency, p.cancelled_at)