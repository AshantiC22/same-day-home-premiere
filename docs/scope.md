# Project scope

Same-Day Home Premiere is a technical prototype of a movie distribution platform. This is the scope as first written, with a few notes marked **Design update** where the later [system design](design.md) refined it.

## 1. Overview

Same-Day Home Premiere lets authorized viewers watch selected movies at home at the moment the movie premieres.

For example: a movie premieres Friday at 7:00 PM. A home viewer buys access ahead of time and can watch from home beginning Friday at 7:00 PM.

The platform provides a secure way to discover movies, buy premiere access, verify users, control release times, and deliver authorized video.

**Important assumption:** this is a technical prototype (an MVP). Real commercial distribution would need agreements with studios, distributors, filmmakers, theaters, and rights holders. The prototype uses a test film with an open license instead of copyrighted content.

## 2. Problem

Movies normally have separate release windows for theaters, digital rental, purchase, and subscription streaming. That causes several problems:

- People who cannot easily get to a theater may wait weeks or months.
- Theater attendance can be expensive for families.
- Some people prefer watching at home but still want to see a movie when it first becomes available.
- Independent filmmakers need more ways to reach audiences directly.
- Existing platforms generally cannot offer a new theatrical movie right away unless the rights holder allows it.

This project designs a platform that could give viewers authorized same-day home access to participating movies.

## 3. Purpose

Build the technical foundation for a new kind of movie distribution platform. The system coordinates:

```
Movie licensing -> user authorization -> payment -> premiere scheduling -> secure video delivery -> controlled viewing
```

It also investigates the technical problem of making a movie available to thousands of viewers at the same moment.

The long-term idea is that a rights holder could offer two choices for the same premiere: go to the theater, or have the premiere at home.

## 4. Goals

**Product goals**

1. A working movie discovery site.
2. Accounts for viewers.
3. Upcoming premieres on display.
4. Reserve and purchase of home-premiere access.
5. No access to a movie before its scheduled time.
6. Secure video delivery.
7. A premiere experience tied to a shared start time.
8. A responsive web interface.
9. A scalable backend.
10. A foundation that real distributors could build on.

**Technical objectives**

Authentication and authorization, payment processing, database design, REST APIs, cloud infrastructure, video streaming, secure content access, scheduled events, scalable architecture, monitoring and logging, and automated deployment.

> **Design update:** goal 7 is interpreted as *embargoed video on demand*. The video unlocks for everyone at the premiere time, and each viewer presses play when they like. Playback synchronized to the second, with shared position and chat, is a later phase (watch parties). See [decisions.md](decisions.md), decision 1.

## 5. Users

**Viewers** want to watch participating movies from home. They browse movies, see premiere times, buy access, receive reminders, watch, manage their account, and see what they have bought.

**Filmmakers and distributors** (a later phase) supply the movies. They could upload movie information, set release windows, monitor sales, view audience analytics, and manage availability.

**Platform administrators** run the platform. They add and remove movies, schedule premieres, manage users, monitor transactions and streaming, and control content availability.

## 6. Functional requirements

### 6.1 Accounts
Create an account, log in, log out, reset a password, manage a profile. The system distinguishes normal users from administrators.

### 6.2 Movie catalog
Each movie shows: title, poster, description, genre, runtime, rating, trailer, release date, premiere time, home-premiere price, and availability status.

### 6.3 Premiere scheduling
Administrators schedule a movie's home premiere. The system stores the movie, premiere date and time, time zone, availability window, price, and content status. It must prevent access before the scheduled time.

### 6.4 Purchasing
Users buy access to participating movies. The system creates a transaction, processes payment, confirms the purchase, links it to the user's account, and grants viewing authorization. The prototype uses Stripe's test mode.

### 6.5 Countdown
Buyers see a countdown ("PREMIERE BEGINS IN" with days, hours, minutes, seconds). It follows server-controlled time and does not rely on the viewer's device clock.

### 6.6 Playback
Once the premiere begins, authorized viewers can watch. The player supports play, pause, volume, fullscreen, seeking where allowed, subtitles, and quality selection.

### 6.7 Access control
Before any video is released, the backend verifies, in order:

```
Is the user signed in?
   -> Did the user buy this premiere?
      -> Has the premiere started?
         -> Is the user's access still valid?
            -> Yes: issue authorized playback access
```

This stops anyone from simply finding the video URL and watching early.

> **Design update:** the design adds a fifth check, a limit on simultaneous streams per purchase, and gives every failure its own error code. See [design.md](design.md#the-premiere-gate).

### 6.8 Watch parties (future)
Create a watch room, invite friends, synchronize playback, and chat during the movie. Not part of V1.

### 6.9 Notifications
Upcoming premieres, purchase confirmation, premiere reminders, availability, and watch-party invitations.

### 6.10 Admin dashboard
Active movies, upcoming premieres, access sold, revenue, active viewers, streaming status, and user activity.

## 7. Non-functional requirements

- **Security.** Protect accounts, payment information, movie content, authentication tokens, and API endpoints. A PCI-compliant payment provider handles card data, so the application never stores it.
- **Scalability.** Support large numbers of simultaneous viewers and avoid designing around a single server.
- **Availability.** Stay up during a high-demand premiere, which creates a sudden traffic spike.
- **Performance.** Pages load quickly and API requests have low latency. Video is delivered by a CDN, not by the application server.
- **Reliability.** Recover gracefully from server, payment, network, streaming, and database failures.
- **Usability.** A viewer can go from finding a movie to buying, waiting, and watching without unnecessary steps.

> **Design update:** the vague scalability goal became testable targets: load-tested at 1,000 concurrent viewers, designed so the CDN can carry 10,000, non-video API requests under 300 ms at the 95th percentile, and video starting within 5 seconds of pressing play. See [security-and-capacity.md](security-and-capacity.md).

## 8. Boundaries

**Included in V1:** registration and login, movie catalog and detail pages, premiere scheduling, countdown, test payments, purchase history, authorized video playback, an admin dashboard, basic cloud deployment, basic security, and basic analytics.

**Not included in V1:** negotiating with major studios, building a theater network, producing movies, a custom video codec, a custom DRM system, replacing streaming services or theaters, hosting thousands of commercial movies, and processing real studio licensing agreements.

## 9. Future expansion

- **Phase 2, independent filmmakers.** Filmmakers submit films, the platform reviews and approves them, the filmmaker sets a premiere, and audiences buy.
- **Phase 3, watch parties.** Synchronized remote viewing with chat.
- **Phase 4, TV apps.** Roku, Apple TV, Fire TV, Google TV, smart TVs.
- **Phase 5, studio partnerships.** Licensing agreements with distributors and studios. This is also where DRM becomes necessary.
- **Phase 6, global distribution.** Multiple currencies and languages, international release windows, regional licensing, global CDN.

**Long-term vision:** theatrical and home premieres can happen at the same time, with the rights holder deciding whether to offer both.
