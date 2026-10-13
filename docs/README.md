# Documentation

Planning and design documents for Same-Day Home Premiere. They were written before the API code and are updated as the build teaches me things.

## Read in this order

1. [scope.md](scope.md): what the product is, who uses it, and what V1 includes and leaves out.
2. [design.md](design.md): the architecture, the access check (the "gate"), the API, and the screens.
3. [data-model.md](data-model.md): the database tables and the rules the database enforces. The exact schema is in [schema.sql](schema.sql).
4. [security-and-capacity.md](security-and-capacity.md): what V1 defends against, what it does not, and load estimates.
5. [decisions.md](decisions.md): six technology and design choices, with the alternatives I considered.
6. [build-plan.md](build-plan.md): seven vertical slices, the tests that prove the product, and the cut line.

## Status

Last updated October 13, 2026.

| Area | Status |
| --- | --- |
| Scope and requirements | Done |
| System design (architecture, gate, API, screens, security, capacity, decisions) | Done |
| Database layer: models, migrations, seed script, tests | Built. Six SQLAlchemy models, two Alembic migrations, a re-runnable seed script, and 6 pytest tests |
| API (FastAPI): accounts and catalog | Next |
| Stripe checkout and webhooks, video delivery, countdown, frontend | Planned |
| Deployment, load test, live test premiere | Planned |

The design describes the whole of V1. Only the database layer exists as code today. Everything else in these documents is a plan, and each document says so where it matters.
