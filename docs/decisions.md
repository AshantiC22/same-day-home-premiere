# Design decisions

Six choices that shape the project, each with the alternatives I considered and the condition that would make me revisit it. Status: all six are decided. Only the database choice (PostgreSQL, SQLAlchemy, Alembic) is implemented so far.

## 1. Premiere model

- **Chosen:** embargoed on demand. The video unlocks at the premiere time and each viewer plays independently.
- **Alternatives:** synchronized, live-style playback where everyone shares one position.
- **Why:** it meets "watch at premiere time" and is far simpler to build, scale, and test.
- **Revisit when:** building watch parties (Phase 3).

## 2. Backend stack

- **Chosen:** FastAPI, SQLAlchemy, and PostgreSQL.
- **Alternatives:** Django with Django REST Framework (its built-in admin would save time on the admin screens). Node with Express (the stack of my earlier project, Villain Culture).
- **Why:** the database layer is already Python and SQLAlchemy. FastAPI adds Pydantic validation and generated API docs. The cost is that the admin screens must be built by hand.
- **Revisit when:** admin work becomes the bottleneck.

## 3. Hosting

- **Chosen:** one containerized API behind a load balancer on a managed container host (Render, Railway, or AWS ECS Fargate), plus managed PostgreSQL.
- **Alternatives:** Lambda with API Gateway, as in Villain Culture.
- **Why:** heartbeats, webhooks, and a reminder worker suit a long-running service, and it avoids cold starts and database connection limits at the premiere spike.
- **Revisit when:** traffic is tiny and cost matters most.

## 4. Video delivery

- **Chosen:** HLS files made locally with ffmpeg, stored in a private S3 bucket, served by CloudFront with signed cookies.
- **Alternatives:** managed video (Mux, Cloudflare Stream) or AWS MediaConvert.
- **Why:** S3 and CloudFront are familiar, and the authorization logic stays in my own code. Cookies suit HLS because one policy covers the manifest and every segment. The CDN must live on a subdomain of the site's domain, such as `cdn.example.com`, so the cookies are sent to it.
- **Revisit when:** DRM or a large catalog is needed.

## 5. Payments

- **Chosen:** Stripe Checkout (hosted page) plus webhooks.
- **Alternatives:** Payment Intents with Stripe Elements, as in Villain Culture.
- **Why:** the fastest route to a safe, complete flow with receipts and refunds.
- **Revisit when:** a custom in-page checkout is wanted.

## 6. Real time

- **Chosen:** no WebSockets in V1. The countdown runs locally with server-time sync, and the checkout success page and admin dashboard use short polling.
- **Alternatives:** WebSockets or Server-Sent Events.
- **Why:** nothing in V1 needs the server to push data.
- **Revisit when:** watch parties or a live viewer count.
