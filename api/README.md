# Room Booking API

A backend API for a **Room Booking Platform** assignment, built with **NestJS**, **TypeScript**, **Prisma**, **PostgreSQL**, **JWT authentication**, **Argon2** password hashing, **rate limiting**, **Redis-backed caching** for room search, **Swagger/OpenAPI** documentation, a **unified error response format**, and **unit tests** for core business logic.

The assignment implementation scope covers:
- user registration
- user login
- room search with filters
- authenticated booking creation  
*(cancellation and booking history were out of scope for the implementation, per brief.)*

The overall system is split into **two services**: a **React (Vite) frontend** and this **NestJS API** (see repository root).

---

## Tech Stack

- **NestJS**
- **TypeScript**
- **Prisma ORM**
- **PostgreSQL**
- **JWT authentication** — `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`
- **Argon2** — password hashing
- **class-validator** & **class-transformer** — DTO validation and transformation
- **@nestjs/throttler** — rate limiting (global guard + per-route `@Throttle`)
- **Redis** — room search result caching via `@nestjs/cache-manager`, `cache-manager`, **Keyv** + **`@keyv/redis`**
- **Swagger / OpenAPI** — `@nestjs/swagger`, `swagger-ui-express` (interactive docs at `/docs`)
- **Global exception filter** — consistent JSON error shape for all HTTP errors
- **Jest** — unit tests for `AuthService`, `BookingsService`, `RoomsService`

---

## High-Level Architecture (assignment context)

| Layer | Role |
|--------|------|
| **Client** | React SPA (separate app under repo `frontend/`), calls API over HTTP |
| **API (this service)** | Auth, validation, business rules, throttling, caching orchestration |
| **PostgreSQL** | Source of truth for users, rooms, bookings; indexes on search/booking fields; DB constraints for booking integrity |
| **Redis** | Cache for expensive/read-heavy **room search** queries; optional `REDIS_URL`; fail-open if Redis is down |
| **Load balancer** | In production, sits in front of multiple API instances; not required for local dev |

**Multi-region / fault tolerance (design note):** In production you would replicate Postgres (read replicas), use Redis Cluster or regional caches, and route traffic via DNS + load balancers; the API is stateless except for JWT validation and DB/Redis, so horizontal scaling is feasible.

---

## Core Features Implemented

### 1. User Registration
- Email, full name, password  
- Passwords hashed with **Argon2** before persistence  
- Duplicate email rejected with a clear error

### 2. User Login
- Email + password  
- Returns **JWT access token** and safe user fields

### 3. JWT Authentication
Protected routes require:

```http
Authorization: Bearer <access_token>
```

The booking flow uses **`req.user.id` from the JWT**, not a client-supplied `userId` in the body.

### 4. Room Search
Filter by optional query params:
- `city`
- `guests`
- `minPrice`
- `maxPrice`

Cross-field rule: if both prices are set, `minPrice` must not exceed `maxPrice`.

### 5. Redis Caching (Room Search)
- Search results are cached under a deterministic key derived from the query (city, guests, min/max price).
- **TTL:** ~60 seconds (`60000` ms) in the current implementation.
- **Fail-open:** if Redis read/write fails, the service still queries PostgreSQL and returns results.

Configure Redis via `REDIS_URL` (defaults to `redis://localhost:6379` if unset).

### 6. Authenticated Booking Creation
- `POST /bookings` requires a valid JWT.  
- User identity comes from the token.

### 7. Double-Booking Prevention (Layered)

**Application layer:** overlap check for `CONFIRMED` bookings on the same room:

```text
existing.checkIn < requested.checkOut
AND
existing.checkOut > requested.checkIn
```

Strict `<` / `>` allows **back-to-back** bookings (checkout equals next check-in).

**Database layer:** PostgreSQL migration adds `btree_gist`, a `CHECK` on date order, and an **exclusion constraint** on `(roomId, tsrange)` for confirmed bookings so concurrent requests cannot both insert conflicting rows.

**Service layer:** Prisma errors mentioning constraint names are mapped to friendly messages (`ROOM_NOT_AVAILABLE`, `INVALID_DATE_RANGE`).

### 8. Rate Limiting
Global **ThrottlerGuard** with named limits (`short`, `medium`, `long`). Auth routes use stricter `@Throttle` overrides to reduce brute-force and spam.

Exceeded limits → **HTTP 429** (also normalized by the global error filter when applicable).

### 9. Health Check
- **`GET /health`** — verifies DB connectivity (`SELECT 1`). Returns `503` with structured error if the database is unavailable.

### 10. CORS
Configured for the frontend origin (`http://localhost:5173` in `main.ts`) with `credentials: true` for cookie-based flows if needed.

### 11. Swagger (OpenAPI)
- **`GET /docs`** — Swagger UI (Bearer auth scheme `access-token` for protected routes).
- DTOs use `@ApiProperty` / `@ApiPropertyOptional` where applicable; controllers use `@ApiTags`, `@ApiOperation`, etc.

### 12. Unified Error Responses
All errors pass through **`HttpExceptionFilter`** and return a consistent JSON body:

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [{ "field": "password", "message": "Password must be at least 6 characters" }],
  "path": "/auth/register",
  "timestamp": "2026-03-24T12:34:56.789Z"
}
```

Validation errors from `ValidationPipe` are normalized into this shape (including `details` when present).

---

## Scalability & Caching (assignment)

- **Search:** Redis reduces repeated identical queries to PostgreSQL; indexes on `Room` (`city`, `capacity`, composite) support filter queries.
- **Booking:** Writes go to Postgres; exclusion constraint prevents races; throttling limits abuse.
- **API:** Stateless; can scale horizontally behind a load balancer; session state is not stored server-side (JWT).

---

## Optional / Operational (assignment)

- **Monitoring:** health endpoint suitable for load-balancer or k8s probes; Swagger documents contracts.
- **Logging:** structured request logging can be added (middleware + correlation IDs); not required for core features.
- **Notifications / analytics:** out of scope for this codebase; would integrate via async jobs or external services.

---

## Project Structure

```text
src/
  auth/
    dto/
    auth.controller.ts
    auth.service.ts
    auth.service.spec.ts
    auth.module.ts
    jwt.strategy.ts
    jwt-auth.guard.ts
    constants.ts

  bookings/
    dto/
    bookings.controller.ts
    bookings.service.ts
    bookings.service.spec.ts
    bookings.module.ts

  common/
    errors/
      api-error.type.ts
      http-exception.filter.ts

  health/
    health.controller.ts
    health.module.ts

  prisma/
    prisma.module.ts
    prisma.service.ts
    seed.ts

  rooms/
    dto/
    rooms.controller.ts
    rooms.service.ts
    rooms.service.spec.ts
    rooms.module.ts

  main.ts
  app.module.ts
  app.controller.ts
  app.controller.spec.ts

prisma/
  schema.prisma
  migrations/

test/
  app.e2e-spec.ts
  jest-e2e.json
```

---

## Data Model & Indexing

### User
- `id`, `email` (unique), `passwordHash`, `fullName`, `createdAt`

### Room
- `id`, `name`, `city`, `capacity`, `pricePerNight`, `description`, `createdAt`  
- **Indexes:** `city`, `capacity`, composite `(city, capacity)` for search filters

### Booking
- `id`, `userId`, `roomId`, `checkIn`, `checkOut`, `totalPrice`, `status` (`CONFIRMED` | `CANCELLED`), `createdAt`  
- **Indexes:** `roomId`, `userId`, composite `(roomId, checkIn, checkOut)` for overlap-related queries  
- **Relations:** cascade delete from user/room

---

## Authentication Flows

### Register
1. Validate DTO  
2. Reject duplicate email  
3. Hash password (Argon2)  
4. Persist user  
5. Return safe fields only (no password hash)

### Login
1. Find user by email  
2. Verify password  
3. Sign JWT (`sub`, `email`)  
4. Return `accessToken` + user profile

### Protected Routes
`JwtAuthGuard` → `JwtStrategy` validates token → loads user → `req.user` for handlers.

---

## Booking Creation Flow (summary)

1. `checkOut > checkIn`  
2. User and room exist  
3. App-level overlap check  
4. Compute nights and `totalPrice`  
5. `prisma.booking.create`  
6. DB constraint as final guard for concurrency

---

## PostgreSQL Constraint Strategy

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
ADD CONSTRAINT "booking_check_dates"
CHECK ("checkOut" > "checkIn");

ALTER TABLE "Booking"
ADD CONSTRAINT "booking_no_overlap"
EXCLUDE USING gist (
  "roomId" WITH =,
  tsrange("checkIn", "checkOut", '[)') WITH &&
)
WHERE ("status" = 'CONFIRMED');
```

---

## API Endpoints

### Auth

| Method | Path | Auth | Description |
|--------|------|------|----------------|
| POST | `/auth/register` | No | Register |
| POST | `/auth/login` | No | Login + JWT |
| GET | `/auth/me` | Bearer | Current user |

### Rooms

| Method | Path | Auth | Description |
|--------|------|------|----------------|
| GET | `/rooms/search` | No | Search with query params |

### Bookings

| Method | Path | Auth | Description |
|--------|------|------|----------------|
| POST | `/bookings` | Bearer | Create booking |

### Health & Docs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | DB connectivity check |
| GET | `/docs` | Swagger UI |

### Example requests

**Register**

```json
{
  "email": "sapir@example.com",
  "fullName": "Sapir Ohava",
  "password": "123456"
}
```

**Login response**

```json
{
  "accessToken": "...",
  "user": {
    "id": "...",
    "email": "sapir@example.com",
    "fullName": "Sapir Ohava",
    "createdAt": "2026-03-20T..."
  }
}
```

**Search**

```http
GET /rooms/search?city=Tel%20Aviv&guests=2&minPrice=300&maxPrice=600
```

**Create booking**

```json
{
  "roomId": "ROOM_ID_HERE",
  "checkIn": "2026-03-29T00:00:00.000Z",
  "checkOut": "2026-03-31T00:00:00.000Z"
}
```

---

## Rate Limiting

- Global throttler with named windows  
- Stricter limits on `POST /auth/register` and `POST /auth/login`  
- Typical overload response: **429 Too Many Requests** (normalized by the global filter when applicable)

---

## Testing

### Unit tests (Jest)

Service-level tests with mocked Prisma / cache / Argon2:

- `src/auth/auth.service.spec.ts` — duplicate registration, login failure, login success  
- `src/bookings/bookings.service.spec.ts` — invalid dates, overlap, success path  
- `src/rooms/rooms.service.spec.ts` — price range validation, cache hit/miss  

Run:

```bash
npm test -- --runInBand
```

### E2E (optional)

Template e2e exists under `test/` (`npm run test:e2e`). The primary focus is the unit suite above.

---

## How to Run Locally

### 1. Install dependencies

```bash
cd api
npm install
```

### 2. Infrastructure (PostgreSQL + Redis)

From the **repository root** (optional):

```bash
docker compose up -d
```

This starts Postgres (`5432`) and Redis (`6379`) as in `compose.yaml`.

### 3. Environment variables

Create `api/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/room_booking"
JWT_SECRET="super-secret-key-change-this"
REDIS_URL="redis://localhost:6379"
PORT=3001
```

### 4. Migrations

```bash
npx prisma migrate dev
```

For a custom SQL migration (e.g. exclusion constraint):

```bash
npx prisma migrate dev --name booking_no_overlap --create-only
```

Edit the generated `migration.sql`, then:

```bash
npx prisma migrate dev
```

### 5. Seed

```bash
npx ts-node src/prisma/seed.ts
```

### 6. Start API

```bash
npm run start:dev
```

- **API:** `http://localhost:3001`  
- **Swagger:** `http://localhost:3001/docs`

---

## Manual Testing Flow (API)

1. `POST /auth/register`  
2. `POST /auth/login` → copy `accessToken`  
3. `GET /rooms/search` → copy a `roomId`  
4. `POST /bookings` with `Authorization: Bearer <token>`  
5. Retry overlapping dates → expect conflict  
6. Back-to-back dates → expect success  
7. Rapid auth calls → expect `429` eventually  
8. `GET /health` → `status: ok` when DB is up  

---

## Error Handling

Handled cases include: validation failures, invalid credentials, unauthorized access, not found, room unavailable / overlap, bad date ranges, rate limits, and dependency failures (e.g. health check when DB is down).

Responses follow the **unified JSON shape** described in section 12 above so clients can rely on `message`, optional `details`, and `code`.

---

## Security Decisions

- **Passwords:** Argon2 hashing  
- **Auth:** JWT bearer tokens for protected routes  
- **Bookings:** `userId` from JWT, not from request body  
- **Rate limiting:** Throttler on sensitive and high-traffic routes  
- **Data integrity:** PostgreSQL constraints + application checks  
- **CORS:** Restricted to frontend origin in development  

---

## Why This Meets the Assignment Brief

- **API design:** Documented endpoints, request/response examples, JWT auth, rate limiting strategy, Swagger for interactive exploration  
- **Database schema:** Users, rooms, bookings, relationships, indexes, consistency constraints  
- **Concurrency:** App overlap check + PostgreSQL exclusion constraint  
- **Scalability:** Redis cache for search, indexed queries, stateless API  
- **Quality:** Standardized errors, health check, unit tests for core logic  

---

## Future Improvements

- Booking **cancellation** and **history** endpoints (explicitly out of scope for this implementation)  
- **Refresh tokens** / rotation  
- **Idempotency** keys for booking retries  
- **Structured logging** with request IDs  
- **Integration/e2e** tests against real Postgres + Redis  
- **Multi-region** deployment and DR runbooks  

---

## Summary

This API delivers registration, login, JWT-protected booking, room search with **Redis-backed caching** and **fail-open** behavior, **PostgreSQL-backed integrity** for concurrent bookings, **rate limiting**, **Swagger** documentation, **unified error responses**, and **unit tests** on critical services—aligned with a practical room-booking platform design and the assignment’s system-design themes (security, scalability, consistency, and operability).
