> Navigation:
>
> - [Backend implementation README](./api/README.md)
> - [Frontend implementation README](./frontend/README.md)

# Room Booking Platform

Monorepo for the **Room Booking** system-design / implementation assignment: a **React (Vite) frontend** and a **NestJS API** with **PostgreSQL**, **Redis** (room search cache), **JWT** auth, and **Prisma**.

Cancellation and booking history are **not** implemented in code (per assignment scope). See **[ASSIGNMENT_SYSTEM_DESIGN.md](./ASSIGNMENT_SYSTEM_DESIGN.md)** for architecture, API design, database schema, concurrency, scalability, and optional components.

---

## Repository layout

| Path                                                           | Description                                              |
| -------------------------------------------------------------- | -------------------------------------------------------- |
| [`frontend/`](./frontend/)                                     | React SPA — register, login, room search, booking UI     |
| [`api/`](./api/)                                               | NestJS REST API — auth, rooms, bookings, health, Swagger |
| [`compose.yaml`](./compose.yaml)                               | **PostgreSQL** + **Redis** for local development         |
| [`ASSIGNMENT_SYSTEM_DESIGN.md`](./ASSIGNMENT_SYSTEM_DESIGN.md) | Written system design (assignment deliverable)           |

Detailed docs:

- **[API README](./api/README.md)** — stack, endpoints, Swagger, Redis, errors, tests, migrations
- **[Frontend README](./frontend/README.md)** — env, routing, auth, API integration

---

## Prerequisites

- **Node.js** (LTS recommended)
- **npm**
- **Docker** + **Docker Compose** (recommended for Postgres + Redis)

---

## Quick start (Docker + two terminals)

### 1. Start databases

From the **repository root**:

```bash
docker compose up -d
```

This starts:

- **PostgreSQL** on `localhost:5432` (database `room_booking`, user/password `postgres`)
- **Redis** on `localhost:6379`

**Why Redis?** The API caches **room search** results in Redis (see [`api/README.md`](./api/README.md)). The frontend does not connect to Redis—only the backend does, via `REDIS_URL` in `api/.env`. If Redis is unavailable, the API can still serve searches from PostgreSQL (fail-open caching).

### 2. API (terminal 1)

```bash
cd api
npm install
```

Create **`api/.env`**:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/room_booking"
JWT_SECRET="change-me-in-production"
REDIS_URL="redis://localhost:6379"
PORT=3001
```

Then:

```bash
npx prisma migrate dev
npx ts-node src/prisma/seed.ts
npm run start:dev
```

- **API:** http://localhost:3001
- **Swagger:** http://localhost:3001/docs

### 3. Frontend (terminal 2)

```bash
cd frontend
npm install
```

Create **`frontend/.env`**:

```env
VITE_API_URL=http://localhost:3001
```

Then:

```bash
npm run dev
```

- **App:** http://localhost:5173

---

## Run tests (API)

```bash
cd api
npm test -- --runInBand
```

---

## Stopping Docker services

```bash
docker compose down
```

To remove volumes (wipe DB data):

```bash
docker compose down -v
```

---

## Summary

- **Frontend** talks to the API using `VITE_API_URL` and stores the JWT in `localStorage`.
- **API** uses **PostgreSQL** for data and **Redis** for room-search cache; documents itself at `/docs` (details in [API README](./api/README.md)).
- **System design** for reviewers is in **`ASSIGNMENT_SYSTEM_DESIGN.md`**; runbooks and feature detail stay in **`api/README.md`** and **`frontend/README.md`** so this file stays short.
