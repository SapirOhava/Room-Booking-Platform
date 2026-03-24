> Navigation:
>
> - [Backend implementation README](./api/README.md)
> - [Frontend implementation README](./frontend/README.md)

# Room Booking Platform — Assignment System Design

## Related Documents

- **API implementation README:** `API_IMPLEMENTATION_README.md`
- **Frontend implementation README:** `FRONTEND_IMPLEMENTATION_README.md`
- **This file:** `ASSIGNMENT_SYSTEM_DESIGN.md`

## 1. Overview

This submission implements the required scope of the assignment over **two services**:

- a **UI service** built with React + TypeScript
- a **backend service** built with NestJS + TypeScript

The implemented scope includes:

- user registration
- user login
- JWT-based authentication
- room search
- booking creation

Per the assignment instructions, the following were **not implemented as features**:

- cancellation
- booking history retrieval

Those are addressed as future extensions in the design notes.

The main design goal was to build a system that is:

- correct for booking integrity
- scalable for read-heavy search traffic
- fault-tolerant enough for a realistic MVP
- easy to explain and demo in an interview setting

---

## 2. High-Level Architecture

### 2.1 Implemented Architecture

```text
Client Browser
    |
    v
React UI Service (Vite)
    |
    | HTTP / JSON
    v
NestJS Backend Service
    |
    +--> PostgreSQL (source of truth)
    |
    +--> Redis (room-search cache)
```

### 2.2 Responsibilities

#### UI Service

Responsible for:

- registration form
- login form
- storing JWT access token
- protected navigation
- room search UI
- booking submission
- user-facing error handling

#### Backend Service

Responsible for:

- authentication
- JWT issuing and verification
- room search filtering
- booking validation
- booking creation
- rate limiting
- health endpoint
- cache access
- data integrity enforcement

#### PostgreSQL

PostgreSQL is the **source of truth** for:

- users
- rooms
- bookings
- booking consistency rules

It also enforces the strongest booking invariant with a **database-level exclusion constraint**.

#### Redis

Redis is used as a **cache layer** for room search queries.

It is intentionally not used as the source of truth for bookings.

This separation is important:

- Redis optimizes read performance
- PostgreSQL guarantees booking correctness

### 2.3 Multi-Region Design Consideration

Multi-region deployment was not implemented in code, but the system was designed with a realistic production direction in mind:

- UI can be served through a CDN or edge network
- backend can be deployed in multiple regions behind a load balancer
- booking writes should be routed to a **single primary write region** to preserve strong consistency
- search traffic can be scaled more aggressively than booking writes

This is important because the booking operation is correctness-critical, while search is read-heavy and more tolerant of scaling patterns.

### 2.4 Fault Tolerance Consideration

The backend is designed to be mostly stateless at the application layer:

- JWT avoids server-side session storage
- Redis cache failures are handled in **fail-open** mode for room search
- PostgreSQL remains the source of truth even if the cache is unavailable

This means that if Redis is down, search still works by falling back to PostgreSQL.

---

## 3. API Design

### 3.1 Authentication

#### `POST /auth/register`

Creates a new user.

**Request body**

```json
{
  "email": "sapir@example.com",
  "fullName": "Sapir Ohava",
  "password": "123456"
}
```

**Behavior**

- validates input
- checks duplicate email
- hashes password with Argon2
- stores user in PostgreSQL
- returns safe user fields only

#### `POST /auth/login`

Authenticates a user and returns a JWT access token.

**Request body**

```json
{
  "email": "sapir@example.com",
  "password": "123456"
}
```

**Response shape**

```json
{
  "accessToken": "...",
  "user": {
    "id": "...",
    "email": "sapir@example.com",
    "fullName": "Sapir Ohava",
    "createdAt": "..."
  }
}
```

#### `GET /auth/me`

Returns the currently authenticated user.

**Authentication**

```http
Authorization: Bearer <accessToken>
```

This route exists to support a realistic frontend session flow. The UI may use the login response directly, but `/auth/me` is useful after page refresh or app restart.

### 3.2 Room Search

#### `GET /rooms/search`

Searches rooms by filters.

**Supported query params**

- `city`
- `guests`
- `minPrice`
- `maxPrice`

**Example**

```http
GET /rooms/search?city=Tel%20Aviv&guests=2&minPrice=300&maxPrice=700
```

**Behavior**

- validates query parameters
- performs filtered Prisma query
- checks Redis cache first
- returns cached results when available
- falls back to PostgreSQL if cache misses or Redis is unavailable

### 3.3 Booking

#### `POST /bookings`

Creates a booking for the authenticated user.

**Authentication**

```http
Authorization: Bearer <accessToken>
```

**Request body**

```json
{
  "roomId": "ROOM_ID_HERE",
  "checkIn": "2026-03-29T00:00:00.000Z",
  "checkOut": "2026-03-31T00:00:00.000Z"
}
```

**Behavior**

- extracts user from JWT
- validates `checkOut > checkIn`
- verifies room exists
- checks for overlapping confirmed bookings
- calculates total price
- creates booking if valid
- relies on PostgreSQL exclusion constraint as final integrity enforcement

### 3.4 Health

#### `GET /health`

Checks whether the API is up and whether the database is reachable.

**Example response**

```json
{
  "status": "ok",
  "database": "up",
  "timestamp": "2026-03-24T..."
}
```

### 3.5 Authentication Mechanism

Authentication is implemented with:

- password hashing using **Argon2**
- JWT access tokens
- `JwtAuthGuard` on protected routes
- `JwtStrategy` to validate Bearer tokens and populate `req.user`

This design keeps the backend stateless at the session layer and supports horizontal scaling more easily than in-memory sessions.

### 3.6 Rate Limiting Strategy

Rate limiting is implemented with **Nest throttler**.

The design uses:

- global throttler configuration in `AppModule`
- route-level overrides using `@Throttle(...)`

Policy direction:

- **strict limits** on `register` and `login`
- **moderate limits** on `room search`
- **lighter limits** on authenticated booking

This is intentional:

- auth routes are abuse-prone
- search is naturally burstier
- booking is important but should still be protected

---

## 4. Database Schema

### 4.1 User

Stores application users.

**Key fields**

- `id`
- `email` (unique)
- `passwordHash`
- `fullName`
- `createdAt`

### 4.2 Room

Stores room metadata.

**Key fields**

- `id`
- `name`
- `city`
- `capacity`
- `pricePerNight`
- `description`
- `createdAt`

**Indexes**

- `city`
- `capacity`
- composite index on `city, capacity`

These indexes support common search patterns efficiently.

### 4.3 Booking

Stores room reservations.

**Key fields**

- `id`
- `userId`
- `roomId`
- `checkIn`
- `checkOut`
- `totalPrice`
- `status`
- `createdAt`

**Indexes**

- `roomId`
- `userId`
- composite index on `roomId, checkIn, checkOut`

### 4.4 Availability

A dedicated availability table was **not implemented** in this version.

That was an intentional decision.

For the current scope, availability is derived from `Booking` records. This keeps the MVP simpler and avoids introducing extra synchronization complexity too early.

In a larger system, precomputed availability or inventory tables could be introduced if search and booking scale required it.

### 4.5 Data Consistency Considerations

The most important consistency rule is:

> the same room must not have overlapping confirmed bookings

This is enforced in two layers:

1. application-layer overlap check in the booking service
2. database-level exclusion constraint in PostgreSQL

That layered approach gives both:

- clear business validation
- real protection under concurrent requests

---

## 5. Concurrency Handling

### 5.1 The Core Problem

A naive booking flow is:

1. check if room is available
2. if available, insert booking

That is not enough under concurrency.

Two requests can arrive at nearly the same time and both pass the availability check before either insert completes.

### 5.2 Application-Level Overlap Check

The booking service checks overlap using the standard rule:

```text
existing.checkIn < requested.checkOut
AND
existing.checkOut > requested.checkIn
```

This correctly models booking overlap.

It also allows **back-to-back bookings**, because equality at the boundary is allowed.

Example:

- booking A: Mar 10 → Mar 12
- booking B: Mar 12 → Mar 15

These do not overlap.

### 5.3 PostgreSQL Exclusion Constraint

The stronger protection is implemented at the database level.

A custom migration adds:

- a check constraint enforcing `checkOut > checkIn`
- an exclusion constraint preventing overlapping confirmed bookings for the same `roomId`

The booking interval is treated as:

```text
[checkIn, checkOut)
```

Meaning:

- include `checkIn`
- exclude `checkOut`

This is the correct model for most booking systems because a booking ending at time `T` should allow another booking to begin at exactly time `T`.

### 5.4 Why This Is Strong

This design does not rely only on application code.

Even if two booking requests race at the same time:

- both may pass the app-layer check
- but PostgreSQL still rejects an invalid overlapping insert

This is the key reason the design is concurrency-safe in a more senior and realistic way.

### 5.5 Transactions

A transaction was not used as the primary solution to overlap prevention.

That choice was intentional.

For this specific problem, a transaction alone is not the strongest guarantee. The stronger guarantee comes from the database-level exclusion constraint.

Transactions would become more important if booking creation later expands into multiple dependent writes, such as:

- booking row
- payment row
- audit row
- notification row

---

## 6. Scalability Strategies

### 6.1 Search Is Read-Heavy

The search endpoint is expected to receive much higher traffic than booking writes.

That is why Redis was added specifically for:

- caching room search results
- reducing repeated database reads
- improving latency on repeated identical queries

### 6.2 Redis Cache Strategy

Current Redis usage:

- cache key is derived from search filters
- cached results are reused for repeated identical searches
- cache failures do not break the request flow

This is a strong fit because room metadata changes infrequently compared to the number of search requests.

### 6.3 Booking Writes Stay Strongly Consistent

Booking writes are not cached.

That is intentional.

Booking is a correctness-critical write path, so PostgreSQL remains the source of truth and final consistency authority.

### 6.4 Horizontal Scaling

The backend is designed in a way that supports horizontal scaling:

- stateless JWT auth
- database-backed consistency
- Redis as shared cache layer
- no in-memory session dependency

This means multiple API instances can be placed behind a load balancer.

### 6.5 Replication and Multi-Region Direction

For a larger production deployment, the next scale steps would be:

- read replicas for read-heavy workloads
- CDN or edge delivery for UI assets
- backend instances in multiple regions
- one primary write region for booking writes

This is especially important because booking consistency is stricter than room-search latency.

### 6.6 Redis in This Submission

Redis was added as a targeted optimization, not as infrastructure theater.

Its role is clear and justified:

- optimize read-heavy room search
- keep booking consistency in PostgreSQL

That is a safer and more explainable design than trying to move booking correctness into cache-based logic.

---

## 7. Optional Components

### 7.1 Monitoring and Health

Implemented:

- `GET /health`

Future improvements:

- Prometheus metrics
- Grafana dashboards
- error-rate tracking
- search latency tracking
- cache hit ratio metrics

### 7.2 Logging

Current code uses standard Nest error handling and structured service logic.

Future improvements:

- request logging middleware/interceptor
- structured JSON logs
- correlation/request IDs
- log aggregation

### 7.3 Notifications

Booking confirmation emails were not implemented.

A realistic future design would use an asynchronous job or message queue after successful booking creation.

### 7.4 Analytics

Analytics were not implemented.

Examples of future analytics:

- popular cities
- booking conversion rate
- search-to-booking funnel
- cache hit / miss distribution

### 7.5 Idempotency Key

Idempotency key support was considered but not implemented in this version.

It would be a good future addition for protecting booking creation against duplicate retries caused by:

- double-clicks
- client retries
- network retry behavior

The core booking integrity problem was addressed first with overlap validation and the PostgreSQL exclusion constraint.

---

## 8. What Was Implemented vs. What Was Left as Future Design

### Implemented

- user registration
- user login
- JWT access token flow
- `/auth/me`
- room search with filters
- booking creation
- protected booking route
- app-layer overlap check
- PostgreSQL exclusion constraint
- rate limiting with Nest throttler
- Redis caching for room search
- health endpoint
- frontend + backend split into two services

### Not Implemented as Features

- cancellation
- booking history retrieval

These were explicitly out of scope according to the assignment implementation requirement.

### Future Improvements

- idempotency keys
- notifications
- analytics
- distributed monitoring/logging
- Swagger/OpenAPI documentation
- read replica strategy
- true production multi-region deployment

---

## 9. Final Design Summary

This solution focuses on the most important engineering priorities for the assignment:

1. **Correctness first** — prevent double booking with both app logic and DB enforcement
2. **Clear authentication flow** — registration, login, JWT, protected routes
3. **Read scalability** — Redis cache for room search
4. **Abuse protection** — route-aware rate limiting with Nest throttler
5. **Operational realism** — health endpoint and fault-tolerant cache behavior
6. **Production direction** — clear multi-region, replication, and optional-component roadmap

The result is a submission that is both:

- fully functional for the required coding scope
- and explicitly designed with realistic system-design tradeoffs in mind
