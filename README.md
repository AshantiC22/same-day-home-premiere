# Same-Day Home Premiere

A pay-per-view platform for independent films. A movie unlocks for paying home viewers at its premiere time, and the server, not the viewer's clock, decides when.

**Status: in progress.** The database layer is finished and tested. The API is next.

## What works so far

- **Data model:** a PostgreSQL 16 schema designed as nine tables. Six are built so far: movies, premieres, users, login sessions, Stripe events and purchases.
- **Database rules, enforced by Postgres:** a premiere's price cannot be negative, a purchase status must be a valid one, and a viewer cannot hold two active (pending or paid) purchases for the same premiere. A viewer can buy again after a purchase expires.
- **Migrations:** schema changes are tracked with Alembic, and each one can be rolled back.
- **Seed script:** a re-runnable script creates premieres in four states: scheduled, live, ended and cancelled.
- **Tests:** 6 pytest tests run against a separate test database and prove the rules above.

## Design decisions

- Video is **embargoed on demand**. It unlocks at the premiere time and each viewer presses play whenever they like after that. Synchronized watch parties are planned for a later phase.
- Times are stored in UTC. A separate time zone name only controls how a time is displayed.
- Money is stored as integer cents.

## Stack

PostgreSQL 16, Docker, Python, SQLAlchemy 2, Alembic, pytest.

Planned: FastAPI, React, TypeScript, Stripe, and a deployed demo.

## Run it locally

You need Python 3.11+, Docker and Git.

```powershell
git clone https://github.com/AshantiC22/same-day-home-premiere.git
cd same-day-home-premiere\premiere-api
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Start a database. Pick any password and use the same one in the next step:

```powershell
docker run --name premiere-db -e POSTGRES_PASSWORD=YOUR_PASSWORD -e POSTGRES_DB=premiere -p 5433:5432 -d postgres:16
docker exec -it premiere-db psql -U postgres -c "CREATE DATABASE premiere_test;"
```

Create your settings file, then open `.env` and replace `YOUR_PASSWORD` with the password you chose:

```powershell
copy .env.example .env
```

Build the tables, add sample data and run the tests:

```powershell
alembic upgrade head
python seed.py
pytest
```

## Project layout

```
premiere-api/
  models.py        SQLAlchemy models
  database.py      the single database engine
  seed.py          sample premieres in four states
  alembic/         migrations
  tests/           pytest tests for the database rules
  .env.example     settings template (copy to .env)
```

## Roadmap

1. FastAPI: accounts and the movie catalog
2. Premiere scheduling and a server-side access check
3. Stripe test payments with idempotent webhooks
4. Countdown page, video playback and a deployed demo