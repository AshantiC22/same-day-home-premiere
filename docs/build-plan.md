# Build plan

V1 is built as seven vertical slices. Each one is merged on its own and leaves something demoable, so no slice waits on a finished layer underneath it.

| # | Slice | Done when | Status |
| --- | --- | --- | --- |
| 1 | **Accounts and catalog.** Migrations for users, sessions, movies, and premieres. Auth. Catalog endpoints. Catalog and detail pages. | A person can sign up and see a scheduled premiere with its time. | Database layer built. API not started. |
| 2 | **Admin scheduling.** Admin role, movie and premiere forms, audit log. | An admin schedules a premiere and it appears in the catalog. A normal user gets 403 on every admin route. | Planned |
| 3 | **Checkout and webhook.** Purchases, `stripe_events`, Stripe Checkout, the signed and idempotent webhook, the library page. | A test-card payment turns a pending purchase into paid exactly once, even if Stripe sends the webhook twice. | Planned |
| 4 | **The gate and playback.** ffmpeg HLS of the test film, private S3 plus CloudFront signed cookies, `playback_sessions`, the gate, the hls.js player, heartbeats. | The gate returns 403 before the start, a direct CDN URL returns 403, and after the start the film plays. | Planned |
| 5 | **Countdown and card states.** Server-time sync, the eight card states, the randomized retry at zero. | Changing the laptop clock does not unlock the film early, and it plays within a couple of seconds of the premiere time. | Planned |
| 6 | **Dashboard, reminders, cancellation.** Admin dashboard, the reminder worker, cancel with automatic refunds. | Cancelling a premiere refunds every paid purchase and emails the buyers. | Planned |
| 7 | **Ship it.** Dockerfile, GitHub Actions, staging and production deploys, the 1,000-viewer load test, monitoring and alerts, and a README with the diagrams and decision records. | The load test passes and a live test premiere runs end to end. | Planned |

## Tests that prove the product

The clock is passed into the service as a parameter, so the boundary can be tested exactly.

- One second before the start the gate returns 403 and sets no cookies. At the start it returns 200.
- No purchase, a refunded purchase, a disputed purchase, an ended window, and a third simultaneous stream each get their own error code.
- A webhook delivered twice produces one paid purchase and one email. A bad signature returns 400.
- A second purchase attempt returns 409. User B cannot read user A's purchases or sessions.
- A direct request to the CDN with no cookies returns 403 (run against staging).
- The load test passes at 1,000 viewers.

Already passing: six database tests (negative price, invalid status, duplicate active purchase, and rebuying after expiry).

## Reliability

Each failure from the scope has a planned answer, and each needs a test or a drill, or it is only a hope.

- **Server failure:** two or more instances behind a load balancer with a health check.
- **Database failure:** managed PostgreSQL with automated backups and a restore that has actually been tested.
- **Payment failure:** pending purchases that expire, and webhooks that retry safely.
- **Network and streaming failures:** hls.js retries and cookie renewal.

## The cut line

If time runs short, cut in this order: subtitles, the manual quality picker (adaptive quality stays), reminder emails, then dashboard extras beyond sales and active viewers.

Never cut the gate, webhook idempotency, ownership checks, tests, or the deploy.

**Out of V1:** watch parties, filmmaker uploads, TV apps, DRM, multiple currencies, and studio deals.
