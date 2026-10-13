# Data model

**Status:** the design covers nine tables. Six SQLAlchemy models are built and tested (see [What is built](#what-is-built)). The exact schema as PostgreSQL holds it is in [schema.sql](schema.sql), and that file is the source of truth if it ever differs from this page.

## The nine tables

Two tables matter most: `premieres` owns time, and `purchases` owns access.

| Table | Purpose | Key columns | Rules and indexes |
| --- | --- | --- | --- |
| `users` | Accounts | id, email, password_hash, role (user or admin), failed_attempts, locked_until | Email unique and lowercase. Role limited to two values. Lockout after repeated failed logins. |
| `movies` | Catalog entry | id, slug, title, synopsis, genre, runtime_minutes, rating, release_date, poster_url, trailer_url, status (draft or published) | Slug unique. Runtime above 0. Public endpoints return published rows only. |
| `video_assets` | The files behind a movie | id, movie_id, storage_prefix, manifest_path, duration_seconds, status (processing, ready, failed) | A premiere can only be scheduled for a movie with a ready asset. The bucket behind it is private. |
| `premieres` | One scheduled home premiere | id, movie_id, starts_at, window_ends_at, display_time_zone, price_cents, currency, cancelled_at | Times stored in UTC. `window_ends_at` after `starts_at`. Price 0 or more. Index on (movie_id, starts_at). |
| `purchases` | A viewer's payment, and their right to watch | id, user_id, premiere_id, status (pending, paid, expired, refunded, disputed), amount_cents, currency, stripe_checkout_session_id, stripe_payment_intent_id, paid_at | Partial unique index on (user_id, premiere_id) where status is pending or paid: no double purchase. Checkout session id unique. Index on user_id for the library. |
| `stripe_events` | Webhook de-duplication | id (Stripe's event id, the primary key), type, received_at, processed_at | Insert first. If the id already exists, skip the event. |
| `playback_sessions` | One viewing on one device | id, user_id, purchase_id, premiere_id, started_at, last_heartbeat_at, ended_at, position_seconds, user_agent | Active means not ended and a heartbeat within 2 minutes. Partial index on purchase_id where ended_at is null, for the stream limit. |
| `reminders` | Premiere reminder emails | id, user_id, premiere_id, send_at, status (pending, processing, sent, failed), attempts | Unique on (user_id, premiere_id). Index on (status, send_at). A worker claims due rows with `FOR UPDATE SKIP LOCKED`. |
| `admin_audit_log` | Who changed what | id, admin_user_id, action, entity, entity_id, details (JSON), created_at | Insert-only. Every admin write adds a row. |

Sign-in uses two more tables that are not part of the nine: `sessions` (built) and a password-reset table (not built yet). They follow the standard pattern.

**Relationships:** a movie has many premieres and many video assets. A user and a premiere each have many purchases. A purchase has many playback sessions.

**Not in V1:** watch rooms and members (Phase 3), filmmaker accounts and submissions (Phase 2).

## Rules that shape the code

- **Time is stored once, in UTC.** `starts_at` is an exact instant. `display_time_zone` (an IANA name like `America/Chicago`) only decides how "7:00 PM" is shown, so daylight saving never moves a premiere.
- **A premiere's state is computed, never stored.** Cancelled if `cancelled_at` is set. Scheduled before `starts_at`. Live until `window_ends_at`. Ended after. No scheduled job flips a status, so there is no job to fail at the worst moment.
- **Money is integer cents plus a currency code, never a float.**
- **The hot path is one indexed lookup:** a paid purchase for this user and premiere. Playback authorization depends on it, so it has to stay fast at the premiere moment.
- **Refunds and disputes change `purchases.status`.** The next authorization or heartbeat then fails. A cookie already issued works until it expires, which is why cookies are short-lived (see [security-and-capacity.md](security-and-capacity.md)).

## What is built

The database layer lives in [`premiere-api/`](../premiere-api):

- **Six SQLAlchemy models** in `models.py`, one for each of `users`, `movies`, `premieres`, `purchases`, `stripe_events`, and `sessions`.
- **Two Alembic migrations** in `premiere-api/alembic/versions/`: the core tables, then a `synopsis` column on movies. The schema changes only through migrations.
- **A re-runnable seed script** (`seed.py`) that creates three movies and four premieres in four states: scheduled, live, ended, and cancelled.
- **Six pytest tests** that run against a separate `premiere_test` database and prove the database itself enforces its rules: a negative price is rejected, an invalid status is rejected, a second active purchase of the same premiere is blocked, and buying again after a purchase expires is allowed.

### Built compared with the design

| Table | Built | Notes |
| --- | --- | --- |
| `users` | Yes | As designed: unique email, a CHECK that the email is lowercase, a CHECK that role is `user` or `admin`, `failed_attempts`, and `locked_until`. |
| `movies` | Partly | Today it has `id`, `title`, `movie_length`, and `synopsis`. The design's `slug`, `genre`, `rating`, `release_date`, `poster_url`, `trailer_url`, and `status` columns, and the runtime CHECK, arrive with the catalog slice as new migrations. The length column is called `movie_length` today where the design says `runtime_minutes`. The two will be reconciled when the catalog slice completes this table. |
| `premieres` | Yes | As designed: times in `timestamptz`, a CHECK that the price is 0 or more, a CHECK that `window_ends_at` is after `starts_at`, currency defaulting to `usd`, and an index on (`movie_id`, `starts_at`). |
| `purchases` | Yes | As designed: a status CHECK, the partial unique index `purchases_one_active_per_user_premiere`, a unique checkout session id, an index on `user_id`, and foreign keys to users and premieres. |
| `stripe_events` | Yes | As designed: Stripe's event id is the primary key. |
| `sessions` | Yes | Sign-in sessions: `id`, `user_id`, `created_at`, `expires_at`. |
| `video_assets`, `playback_sessions`, `reminders`, `admin_audit_log`, password reset | No | Added in later slices (see [build-plan.md](build-plan.md)). |

## Setting up the database locally

The steps are in the [project README](../README.md#run-it-locally). In short: start PostgreSQL 16 in Docker, create the `premiere` and `premiere_test` databases, copy `.env.example` to `.env`, run `alembic upgrade head`, then `python seed.py`.
