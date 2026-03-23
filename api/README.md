# Room Booking API

A backend API for a room booking assignment built with NestJS, TypeScript, Prisma, PostgreSQL, JWT authentication, Argon2 password hashing, and Nest throttling.

This project focuses on the core requirements of a booking system:
- user registration
- user login
- authenticated booking creation
- room search with filters
- double-booking prevention
- rate limiting
- clear modular backend structure

---

## Tech Stack

- **NestJS**
- **TypeScript**
- **Prisma ORM**
- **PostgreSQL**
- **JWT authentication** using `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`
- **Argon2** for password hashing
- **class-validator** and **class-transformer** for DTO validation
- **@nestjs/throttler** for rate limiting

---

## Core Features Implemented

### 1. User Registration
Users can register with:
- email
- full name
- password

Passwords are hashed with **Argon2** before being stored in the database.

### 2. User Login
Users can log in with:
- email
- password

If credentials are valid, the API returns:
- a JWT access token
- basic user data

### 3. JWT Authentication
Protected routes require a bearer token:

```http
Authorization: Bearer <access_token>
```

The token is issued after successful login and is later used to identify the authenticated user.

### 4. Room Search
Rooms can be searched by:
- city
- guest count
- minimum price
- maximum price

### 5. Authenticated Booking Creation
Only authenticated users can create bookings.

The booking endpoint does **not** trust `userId` sent from the client body. Instead, it takes the authenticated user from the JWT token.

### 6. Double-Booking Prevention
This project uses a **layered approach** to prevent double booking:

#### Application-layer overlap check
Before creating a booking, the API checks whether there is already a confirmed booking for the same room that overlaps the requested date range.

Overlap rule:

```text
existing.checkIn < requested.checkOut
AND
existing.checkOut > requested.checkIn
```

This logic is intentionally based on **strict** comparisons:
- `<` instead of `<=`
- `>` instead of `>=`

That allows **back-to-back bookings**.

Example:
- existing booking: Mar 10 → Mar 12
- new booking: Mar 12 → Mar 15

This is allowed because the first booking ends exactly when the next begins.

#### Database-level protection with PostgreSQL exclusion constraint
To make the solution safer under concurrent requests, the database also enforces the booking invariant using a PostgreSQL migration with:
- `btree_gist`
- a `CHECK` constraint for valid date order
- an **exclusion constraint** on `roomId` and booking range

Conceptually, PostgreSQL enforces:
- same `roomId`
- confirmed bookings only
- ranges `[checkIn, checkOut)` must not overlap

This means:
- include `checkIn`
- exclude `checkOut`

That is the correct booking model because one booking may end exactly when another begins.

This DB-level rule is important because application code alone is not enough under concurrency. Two requests can race and both pass an app-level overlap check before either insert is committed. The exclusion constraint makes PostgreSQL the final source of truth.

### 7. Rate Limiting
The API uses **Nest throttler** (`@nestjs/throttler`) to protect routes from abuse and burst traffic.

Rate limiting is configured globally through:
- `ThrottlerModule.forRoot(...)`
- `APP_GUARD`
- `ThrottlerGuard`

It is then tuned per route using `@Throttle(...)`.

This project uses stricter rate limits for sensitive auth routes such as:
- `POST /auth/register`
- `POST /auth/login`

This helps protect against:
- brute-force attempts
- repeated registration spam
- accidental frontend request bursts

---

## Project Structure

```text
src/
  auth/
    dto/
    auth.controller.ts
    auth.service.ts
    auth.module.ts
    jwt.strategy.ts
    jwt-auth.guard.ts
    constants.ts

  bookings/
    dto/
    bookings.controller.ts
    bookings.service.ts
    bookings.module.ts

  prisma/
    prisma.module.ts
    prisma.service.ts

  rooms/
    dto/
    rooms.controller.ts
    rooms.service.ts
    rooms.module.ts

  main.ts
  app.module.ts

prisma/
  schema.prisma
  seed.ts
  migrations/
```

---

## Data Model

### User
Fields:
- `id`
- `email`
- `passwordHash`
- `fullName`
- `createdAt`

### Room
Fields:
- `id`
- `name`
- `city`
- `capacity`
- `pricePerNight`
- `description`
- `createdAt`

### Booking
Fields:
- `id`
- `userId`
- `roomId`
- `checkIn`
- `checkOut`
- `totalPrice`
- `status`
- `createdAt`

---

## Authentication Flow

### Register Flow
Server logic:
1. validate DTO input
2. check whether the email already exists
3. hash the password with Argon2
4. save the user in PostgreSQL
5. return safe user data only

### Login Flow
Server logic:
1. find the user by email
2. verify password against stored Argon2 hash
3. build JWT payload
4. sign JWT using the server secret
5. return access token and basic user info

### Protected Route Flow
When a client calls a protected route:
1. the client sends `Authorization: Bearer <token>`
2. `JwtAuthGuard` intercepts the request
3. `jwt.strategy.ts` extracts the token from the header
4. the token signature and expiration are verified
5. the JWT payload is read
6. the user is loaded from the database
7. the authenticated user is attached to `req.user`
8. the route handler continues

---

## Booking Creation Flow

When a booking request is made:
1. validate that `checkOut > checkIn`
2. verify the authenticated user exists
3. verify the room exists
4. check for overlapping confirmed bookings in application logic
5. calculate the number of nights
6. calculate total price
7. attempt booking creation
8. rely on PostgreSQL exclusion constraint as final protection under concurrency

This layered design gives:
- clear business validation in the API
- strong data integrity in the database

---

## PostgreSQL Constraint Strategy

The migration adds:

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

### What this enforces
- `checkOut` must be after `checkIn`
- confirmed bookings for the same room may not overlap
- back-to-back bookings are allowed because the range is `[checkIn, checkOut)`

### Why this is important
This is stronger than application code alone. Even if two booking requests arrive at almost the same time, PostgreSQL rejects the invalid conflicting insert.

---

## API Endpoints

### Auth

#### `POST /auth/register`
Create a new user.

Example request:

```json
{
  "email": "sapir@example.com",
  "fullName": "Sapir Ohava",
  "password": "123456"
}
```

#### `POST /auth/login`
Authenticate user and return JWT access token.

Example request:

```json
{
  "email": "sapir@example.com",
  "password": "123456"
}
```

Example response:

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

#### `GET /auth/me`
Returns the currently authenticated user.

Headers:

```http
Authorization: Bearer <access_token>
```

### Rooms

#### `GET /rooms/search`
Search rooms with optional filters.

Supported query params:
- `city`
- `guests`
- `minPrice`
- `maxPrice`

Example:

```http
GET /rooms/search?city=Tel%20Aviv&guests=2&minPrice=300&maxPrice=600
```

### Bookings

#### `POST /bookings`
Create a booking for the authenticated user.

Headers:

```http
Authorization: Bearer <access_token>
```

Example request:

```json
{
  "roomId": "ROOM_ID_HERE",
  "checkIn": "2026-03-29T00:00:00.000Z",
  "checkOut": "2026-03-31T00:00:00.000Z"
}
```

---

## Rate Limiting Design

The API uses **Nest throttler** as a global guard.

### Why auth routes are stricter
Login and registration are the most abuse-prone routes.

Examples of attacks/problems:
- password brute-force attempts
- bot traffic
- repeated registration spam
- accidental multi-clicks from the frontend

### Why search is usually more relaxed
Search routes are expected to be called more often by the UI, especially when users change filters.

### Why bookings are protected but not too aggressively limited
Booking is a high-value authenticated action. It should be protected, but normal users should still be able to use the app comfortably.

### Expected throttling error
If a rate limit is exceeded, Nest throttler returns:
- **HTTP 429 Too Many Requests**

The frontend should handle that and show a friendly message such as:
- `Too many requests. Please wait a moment and try again.`

---

## How to Run Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables
Create a `.env` file:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/room_booking"
JWT_SECRET="super-secret-key-change-this"
```

### 3. Run migrations

```bash
npx prisma migrate dev --name init
```

If you are adding a custom SQL migration for overlap enforcement:

```bash
npx prisma migrate dev --name booking_no_overlap --create-only
```

Edit the generated `migration.sql`, then run:

```bash
npx prisma migrate dev
```

### 4. Seed the database

```bash
npx ts-node prisma/seed.ts
```

### 5. Start the server

```bash
npm run start:dev
```

The API will be available at:

```text
http://localhost:3001
```

---

## Example Testing Flow

### 1. Register
Call `POST /auth/register`

### 2. Login
Call `POST /auth/login`

Copy the returned `accessToken`.

### 3. Search rooms
Call `GET /rooms/search`

Copy one `roomId`.

### 4. Create booking
Call `POST /bookings` with:
- Bearer token
- `roomId`
- `checkIn`
- `checkOut`

### 5. Test overlap prevention
Try creating another booking for the same room with overlapping dates.

Expected result:
- request should fail

### 6. Test back-to-back booking
Try creating another booking starting exactly when the first one ends.

Expected result:
- request should succeed

### 7. Test rate limiting
Send repeated rapid requests to `POST /auth/login` or `POST /auth/register`.

Expected result:
- eventually receive `429 Too Many Requests`

---

## Error Handling

Examples of handled errors:
- invalid dates
- user not found
- room not found
- overlapping booking
- invalid credentials
- unauthorized request
- too many requests

For rate limiting, the standard throttling response is:
- `429 Too Many Requests`

For booking conflicts, the API can return a clear business error such as:
- `Room is not available for these dates`

---

## Security Decisions

### Password Storage
Passwords are hashed with Argon2 before storage.

### JWT Authentication
Protected routes use bearer tokens instead of sending email and password on every request.

### Protected Booking Identity
The booking route uses the authenticated user from the JWT token rather than trusting a client-provided `userId`.

### Rate Limiting
Sensitive routes are protected against request abuse and burst traffic using Nest throttler.

### Database Integrity
Critical booking consistency is enforced not only in application logic, but also in PostgreSQL using a constraint.

---

## Why this is a strong assignment solution

This project shows:
- clear modular NestJS architecture
- DTO validation
- secure password hashing
- JWT-based authentication
- protected routes
- filtered search
- authenticated booking flow
- layered double-booking prevention
- database-level integrity enforcement
- rate limiting with Nest throttler

This is stronger than a basic CRUD implementation because it addresses real system-design concerns:
- authentication
- abuse protection
- concurrency safety
- data consistency

---

## Future Improvements

Possible next improvements:
- idempotency keys for retry safety
- Swagger / OpenAPI documentation
- automated unit and integration tests
- health check endpoint
- structured logging and observability
- refresh tokens
- booking history endpoint
- cancellation flow
- deployment architecture for multi-region discussion

---

## Summary

This project implements the core backend requirements of a room booking system with a practical and production-aware design.

It includes:
- registration
- login
- JWT authentication
- room search with filters
- authenticated booking creation
- application-level overlap checks
- PostgreSQL exclusion constraint for stronger booking integrity
- Nest throttler rate limiting

The result is a modular backend that is both functional and designed to address important real-world concerns such as security, abuse prevention, and consistency under concurrent requests.
