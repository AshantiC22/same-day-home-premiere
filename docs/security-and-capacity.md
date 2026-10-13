# Security and capacity

**Status:** design only. Nothing on this page is built or measured yet. The capacity figures are planning estimates that load testing will replace with real numbers.

## Security: what V1 stops, and what it does not

V1 stops early access and casual sharing. It does not stop a determined copier. Only DRM and forensic watermarking do that, and both are out of V1. Knowing what a design does not protect is part of the design.

| Threat | Defense in V1 | What still gets through |
| --- | --- | --- |
| Guessing the video URL to watch early | The video sits in a private S3 bucket that only CloudFront can read. CloudFront requires signed cookies, and the API issues them only after a paid purchase and the premiere start. | Nothing early: no signature, no video. |
| Changing the device clock to unlock early | The server decides. The countdown is cosmetic. | Nothing. |
| Sharing a link or a copied cookie | Cookies last 30 minutes and renew only through heartbeats from a session the API approved. | A copied cookie works for up to 30 minutes. |
| Sharing an account | At most 2 active streams per purchase. | Someone with the password can still watch within that limit. |
| Saving or recording the stream | None in V1. Studio-grade protection needs DRM (Widevine, FairPlay, PlayReady) and forensic watermarking, which managed video services can add later. | A determined paying viewer can copy the film. This is why studios will require DRM (Phase 5). |
| A fake payment confirmation | Verify Stripe's webhook signature with the endpoint secret, trust only the webhook and never the browser redirect, and process each event id once. | Nothing: a forged call fails the signature check. |
| Chargebacks and refunds | The dispute and refund webhooks change the purchase status, so the next gate call or heartbeat fails. An admin reviews disputes. | Up to 30 minutes of viewing on a cookie already issued. |
| One user reading another's purchases or sessions | Ownership filter on every query, and 404 instead of 403 so ids cannot be probed. | Nothing. |
| A hijacked or abusive admin account | Role check on every admin endpoint and an audit-log row for every admin write. Two-factor sign-in is a later addition. | An admin can still change data, but every change is recorded. |
| A traffic flood at premiere time | A CDN and a web application firewall in front of the site and video, rate limits on the API, and a stateless API behind a load balancer. A waiting room is a later addition. | A large attack needs managed DDoS protection, which is out of V1. |
| Leaking an unreleased movie | Draft movies and unpublished assets never appear in public responses, and the files stay in the private bucket. | Nothing. |

Two foundations sit underneath all of this. Card numbers never reach the servers, because Stripe Checkout collects them and the app stores only Stripe's ids. Everything else is standard hardening: HTTPS only, HttpOnly and Secure session cookies, bcrypt password hashing, validation on every input, and secrets in environment variables (the database layer already does this: credentials live in a git-ignored `.env`).

## Capacity: the video is heavy, the API is small but spiky

At 10,000 viewers the CDN carries about 40 Gbps of video, while the API sees a burst of a few hundred requests per second for a minute or two.

**Assumptions:** 10,000 concurrent viewers, a 2-hour film at an average of 4 Mbps, everyone pressing play within 60 seconds of the start, and one heartbeat per viewer per minute.

| Part | Load at 10,000 viewers | The arithmetic | What the design does about it |
| --- | --- | --- | --- |
| CDN and video storage | About 40 Gbps at peak, about 36 TB for the premiere | 10,000 x 4 Mbps = 40,000 Mbps. 4 Mbps is 0.5 MB/s, times 7,200 s is 3.6 GB per viewer, times 10,000 is 36 TB. | The CDN serves the video and the API servers never touch it. Everyone requests the same files, so cache hits are high. Check the CDN's price per GB and account quotas before a real premiere: egress is the biggest bill. |
| The gate (playback authorization) | About 170 requests per second on average, perhaps 500 in the first seconds | 10,000 requests over 60 s is 167 per second. A 3x burst is about 500. | One indexed lookup, one insert, one count, and one signature per request. Run at least 2 API instances. The planning guess of about 100 requests per second per worker must be measured. The random retry delay on the client flattens the burst. |
| Heartbeats | About 170 writes per second for the whole film | 10,000 viewers / 60 s. | One small update per viewer per minute is fine for PostgreSQL. If it ever hurts, keep heartbeat state in Redis and flush it later. |
| Logins | Up to 33 per second if everyone logs in at the last minute | 10,000 logins over 300 s is 33 per second. At about 0.25 s of CPU per bcrypt check, that is roughly 8 cores of hashing. | Seven-day sessions mean most viewers are already signed in. The reminder email says "log in early". Benchmark the real bcrypt time. |
| Database connections | Up to 15 per API process | A pool of 5 plus 10 overflow. With 2 instances of 4 workers, that is up to 120 connections. | Many small managed databases cap near 100 connections. Lower the pool size or add a pooler (PgBouncer or RDS Proxy). |
| Payments | A few hundred checkouts and webhooks in the last minutes | Stripe hosts the payment page, so each buyer costs one checkout call and one webhook. | Webhooks are idempotent, so duplicates and retries are safe. |
| Reminder emails | Up to 10,000 messages at once | One reminder per buyer at the same moment. | The worker sends in batches of 100, and each reminder's send time gets a small random offset so the email provider's rate limits are not hit all at once. |

**The design rule that follows:** keep video out of the servers, keep the gate cheap, and keep every instance stateless so adding capacity is just adding instances.

**How it will be proven:** a k6 or Locust script with 1,000 simulated viewers calling the gate in the same 10 seconds, with a pass mark of 95th-percentile latency under 300 ms and no errors, run against a deployed staging copy and not a laptop.
