# RoomBookingPlatform — Senior Full-Stack Learning Plan

## What You Have Right Now

A solid **monolith** with good bones:

- **NestJS** backend with Auth, Rooms, Bookings, Health modules
- **Prisma + PostgreSQL** with a real migration (non-overlapping booking constraint via `btree_gist`)
- **Redis** caching on room search
- **JWT auth** with Argon2 password hashing
- **Next.js 16** frontend (App Router, shadcn UI, react-hook-form)
- **Docker Compose** for Postgres + Redis
- Swagger at `/docs`, global validation, throttling, exception filters

This is the perfect base. You don't rewrite it — you **evolve** it.

---

## The Target Architecture

```
                        ┌─────────────────────┐
                        │   Next.js Frontend  │
                        │   (Vercel / S3+CF)  │
                        └──────────┬──────────┘
                                   │ HTTPS
                        ┌──────────▼──────────┐
                        │     API Gateway     │  ← NestJS, validates JWT,
                        │  (ALB → ECS/Fargate)│    routes + rate limits
                        └──┬───────┬──────┬───┘
                           │       │      │
              ┌────────────▼┐  ┌───▼───┐ ┌▼──────────────┐
              │ Auth Service│  │ Room  │ │Booking Service │
              │  (NestJS)   │  │Service│ │   (NestJS)     │
              │  Postgres   │  │Nest.JS│ │   Postgres     │
              └─────────────┘  │ Pg+   │ └───────┬────────┘
                               │ Redis │         │ emits events
                               └───────┘  ┌──────▼───────────┐
                                          │  Message Broker   │
                                          │ (RabbitMQ/Kafka)  │
                                          └──────┬────────────┘
                                                 │
                                      ┌──────────▼──────────┐
                                      │ Notification Service │
                                      │  (email via AWS SES) │
                                      └─────────────────────┘
```

---

## The Phased Learning Plan

### Phase 1 — Solidify the Monolith

Before splitting anything, make the monolith production-quality. This teaches
fundamentals that carry into every later phase.

**What to build:**

- Booking cancellation endpoint (`PATCH /bookings/:id/cancel`)
- Booking history endpoint (`GET /bookings/my`)
- Auth-aware Navbar (show user name, logout button — currently has static links)
- A real home page (`page.tsx` is a placeholder right now)
- Refresh token flow (learn `httpOnly` cookies vs localStorage — critical security concept)
- Room image upload to local disk → later swap for S3

**What you learn:** NestJS guards/interceptors, REST best practices, cookie
security, Prisma relations

---

### Phase 2 — Docker & CI/CD

**What to build:**

- Multi-stage `Dockerfile` for the API (builder stage → production stage, no `start:dev` in prod)
- `Dockerfile` for Next.js
- Full `docker-compose.yml` that runs the entire app locally (currently only Postgres + Redis)
- GitHub Actions pipeline: lint → test → build Docker image → push to AWS ECR

**What you learn:** Multi-stage builds, layer caching, environment management,
CI/CD fundamentals, ECR

> The current API `Dockerfile` runs `start:dev` which is wrong for production.
> This phase fixes that.

---

plan for this seconed step
Phase 2 — Docker & CI/CD

Here's what you need to build:

1. Multi-stage Dockerfile for the API Your current Dockerfile runs start:dev which is wrong for production. You'll build a proper multi-stage file: builder stage compiles TypeScript → production stage runs the compiled JS with start:prod. No dev dependencies in production.

2. Dockerfile for Next.js Similar multi-stage build for the frontend.

3. Full docker-compose.yml Currently your compose only runs Postgres + Redis. You'll extend it to run the entire app — API + frontend + Postgres + Redis — so anyone can clone the repo and run one command to get everything working.

4. GitHub Actions pipeline Automate: lint → test → build Docker image → push to AWS ECR. Every push to main triggers this.

Suggested order:

Fix the API Dockerfile first (most important, teaches multi-stage builds)
Add Next.js Dockerfile
Update docker-compose.yml to include all services
GitHub Actions last
Let me check what you currently have before we start.

Good — now I can see exactly what needs to change. Here's the current state:

Problems with the existing api/Dockerfile:

Runs start:dev — this uses ts-node with file watching, not for production
Single stage — dev dependencies and TypeScript compiler end up in the production image (bloated, insecure)
EXPOSE 3000 — your API runs on 3001
No .dockerignore — copies node_modules and other junk into the build context
No prisma migrate deploy step — migrations don't run on startup
What's missing entirely:

Dockerfile for Next.js frontend
API + frontend services in docker-compose.yml
GitHub Actions workflow file

---

### Phase 3 — Break into Microservices

This is the most educational phase. The split follows your existing NestJS modules:

| Service                  | Responsibility                           | Own DB?              |
| ------------------------ | ---------------------------------------- | -------------------- |
| **API Gateway**          | Route requests, validate JWT, rate limit | No                   |
| **Auth Service**         | Register, login, issue/refresh JWT       | Yes (Postgres)       |
| **Room Service**         | Search, CRUD rooms, caching              | Yes (Postgres+Redis) |
| **Booking Service**      | Create, cancel, history                  | Yes (Postgres)       |
| **Notification Service** | Listen for events, send emails           | No DB needed         |

**Key patterns to implement:**

- **Database-per-service** — each service owns its schema, no shared tables
- **API Gateway pattern** — Next.js only talks to the gateway, never direct to services
- **Service-to-service auth** — internal calls use a shared secret or mTLS, not user JWTs
- **NestJS Microservices transport** — use `@nestjs/microservices` with TCP or RabbitMQ transport

**What you learn:** Service boundaries, data ownership, distributed system
tradeoffs (what happens when Booking Service can't reach Room Service?)

---

### Phase 4 — Message Broker (RabbitMQ first, then Kafka)

**What to build:**

- When booking is confirmed → Booking Service **publishes** a `booking.confirmed` event
- Notification Service **consumes** it → sends confirmation email via AWS SES
- When booking is cancelled → `booking.cancelled` event → cancellation email
- Dead letter queues for failed messages
- Eventually: Kafka for the event log (room views, searches → analytics)

Start with **RabbitMQ** (simpler, integrates cleanly with `@nestjs/microservices`).
Add **Kafka** later for the event-sourcing/analytics use case.

**What you learn:** Pub/sub vs request/reply, at-least-once delivery,
idempotency, dead letter queues, the difference between RabbitMQ (message broker)
and Kafka (event log)

---

### Phase 5 — AWS

Map your Docker Compose services directly to AWS managed services:

| Local (Docker)       | AWS                                    |
| -------------------- | -------------------------------------- |
| PostgreSQL container | **RDS PostgreSQL**                     |
| Redis container      | **ElastiCache Redis**                  |
| API services         | **ECS Fargate** (no servers to manage) |
| Next.js              | **Vercel** OR **S3 + CloudFront**      |
| RabbitMQ             | **Amazon MQ**                          |
| Room images          | **S3**                                 |
| Email                | **SES**                                |
| Secrets/env vars     | **Secrets Manager**                    |
| Logs & metrics       | **CloudWatch**                         |
| Load balancing       | **ALB** (Application Load Balancer)    |
| Container registry   | **ECR**                                |
| Infrastructure code  | **Terraform** or **AWS CDK**           |

> The most important concept here: use **Terraform** or **AWS CDK** to define
> infrastructure as code. Never click-ops in the console — define everything in
> code so it's reproducible and reviewable.

**What you learn:** VPC networking, IAM roles (least privilege), ECS task
definitions, ALB target groups, managed services vs self-hosted,
infrastructure as code

---

### Phase 6 — Observability (separates senior devs)

**What to build:**

- Structured JSON logging in every service (replace `console.log`)
- Distributed tracing with **OpenTelemetry** + **AWS X-Ray** or Jaeger
- Metrics to **CloudWatch** or **Prometheus + Grafana**
- Health checks that actually check dependencies (DB, Redis, broker)
- Alerting: if booking service error rate > 1% for 5 min → alert

**What you learn:** The three pillars of observability (logs, metrics, traces),
how to debug a distributed system when a request spans 4 services

---

### Phase 7 — Kubernetes (later)

By the time you reach Kubernetes, you'll already understand containers deeply.
K8s adds:

- Horizontal pod autoscaling
- Rolling deployments / rollbacks
- Service mesh (Istio) for mTLS between services
- Helm charts for packaging

Deploy on **AWS EKS**.

---

### Phase 8 — AI Integration (later)

Natural fits for this project:

- **Smart search**: vector embeddings for room descriptions → semantic search
  (`pgvector` extension on your existing Postgres)
- **Price suggestions**: ML model predicting optimal price by season/demand
- **Support chatbot**: RAG over your room catalog using LangChain + OpenAI

---

## The One Architecture Decision That Matters Most

**Start as a modular monolith, not microservices.** You're already there.
The phases above let you extract services one at a time when the domain
boundaries are clear — not upfront when they're not.

The biggest mistake junior devs make is going straight to microservices and
ending up with a **distributed monolith** (services that are tightly coupled
and need to be deployed together anyway). Your current NestJS module structure
(`auth/`, `rooms/`, `bookings/`) maps perfectly to future service boundaries —
which is the right way to discover them.

---

## Suggested Order of Next Steps

1. Finish the frontend (auth-aware nav, cancellation, booking history)
2. Fix the `Dockerfile` for production (multi-stage, `start:prod`)
3. Add GitHub Actions CI (lint + test)
4. Containerize everything in docker-compose (include the Next.js app)
5. Extract Notification Service + RabbitMQ (cleanest first extraction)
6. Deploy to AWS ECS with Terraform
7. Extract remaining services one by one
8. Add observability (OpenTelemetry, CloudWatch)
9. Kubernetes (EKS)
10. AI features (pgvector, RAG, price model)
