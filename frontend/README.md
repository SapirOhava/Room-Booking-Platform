# Room Booking — Frontend

A **React + TypeScript** single-page application for the **Room Booking Platform** assignment. It talks to the **NestJS API** over HTTP (REST), implements **user registration**, **login**, **JWT storage**, **protected room search**, and **authenticated booking creation**. The UI uses **Vite**, **Tailwind CSS v4**, **shadcn/ui** (Radix-based components), and **react-hook-form** for forms.

This app is the **UI microservice** in the monorepo; the backend lives under `../api/`.

---

## Assignment Scope (Implementation)

Aligned with the brief, this frontend implements:

| Feature           | Status                                  |
| ----------------- | --------------------------------------- |
| User registration | Yes (`/register`)                       |
| User login        | Yes (`/login`)                          |
| Room search       | Yes (`/rooms`, protected)               |
| Create booking    | Yes (from search results)               |
| Cancellation      | Not implemented (out of scope for code) |
| Booking history   | Not implemented (out of scope for code) |

---

## Tech Stack

- **React 19** + **TypeScript**
- **Vite 8** — dev server & build
- **React Router 7** — routing (`/`, `/login`, `/register`, `/rooms`, 404)
- **Axios** — HTTP client with base URL and Bearer token interceptor
- **react-hook-form** — form state and validation
- **Tailwind CSS v4** — styling (`@tailwindcss/vite`)
- **shadcn/ui** + **Radix** + **lucide-react** — accessible UI primitives (`components/ui/`, `components.json`)
- **Geist** font (`@fontsource-variable/geist`)

---

## High-Level Architecture

```text
Browser (React SPA)
       │
       │  HTTPS / HTTP (REST)
       ▼
NestJS API (../api)  ←  PostgreSQL, Redis (cache), JWT
```

- **Auth:** JWT `accessToken` stored in **`localStorage`** under `accessToken`. Axios attaches `Authorization: Bearer <token>` on every request when a token exists.
- **Protected routes:** `ProtectedRoute` checks for a token; if missing, redirects to `/login`.
- **CORS:** The API must allow the frontend origin (e.g. `http://localhost:5173`); configured in the API `main.ts`.

---

## Features

### 1. Registration (`/register`)

- Collects full name, email, password (client-side validation with react-hook-form).
- `POST /auth/register` via `registerUser`.
- On success, navigates to `/login` with an optional success message in router state.

### 2. Login (`/login`)

- Email + password.
- `POST /auth/login` → stores `accessToken` with `setToken`, navigates to `/rooms`.

### 3. Room Search (`/rooms`) — protected

- Filter by city, guests, min/max price.
- `GET /rooms/search` with query params.
- Results rendered as cards; supports creating a booking per room (check-in / check-out).

### 4. Bookings

- `POST /bookings` with JWT; body includes `roomId`, `checkIn`, `checkOut` (ISO strings).
- Success and error feedback via inline banners (not modals).

### 5. Navigation & Session

- **Navbar:** links to Rooms, Login/Register or Logout.
- **Logout:** clears token from `localStorage` and sends user to `/login`.

### 6. Error Handling (API)

- Backend returns a **unified JSON error shape** (`statusCode`, `code`, `message`, optional `details`).
- **`getErrorMessage`** (`src/utils/getErrorMessage.ts`) reads `error.response.data.message` from Axios errors and maps to a single string for banners.
- **Field errors:** react-hook-form shows validation under inputs; **server errors** show in red alert boxes above forms or in the search/booking sections.

### 7. Not Found

- Unknown routes render `NotFoundPage` (`*` route).

---

## Project Structure

```text
frontend/
  src/
    api/
      axios.ts              # axios instance + auth header interceptor
      auth.ts               # register, login, getMe
      rooms.ts              # searchRooms
      bookings.ts           # createBooking
    components/
      layout/Navbar.tsx
      rooms/RoomCard.tsx
      ui/                   # shadcn components (button, card, input, label, …)
    pages/
      LoginPage.tsx
      RegisterPage.tsx
      SearchRoomsPage.tsx
      NotFoundPage.tsx
    routes/
      ProtectedRoute.tsx
    utils/
      getErrorMessage.ts
      token.ts              # localStorage helpers
    types/
      index.ts              # shared TS types
    lib/
      utils.ts              # cn() helper (shadcn)
    App.tsx
    main.tsx
    index.css
  components.json           # shadcn config
  vite.config.ts
  tsconfig.json
  tsconfig.app.json
```

Path alias: `@/*` → `src/*` (see `vite.config.ts` and `tsconfig`).

---

## Environment Variables

Create **`frontend/.env`** (or `.env.local`):

```env
VITE_API_URL=http://localhost:3001
```

- Must match the API base URL (no trailing slash required for how paths are used).
- Vite exposes only variables prefixed with `VITE_`.

---

## How to Run Locally

### Prerequisites

- Node.js (LTS recommended)
- API running (see `../api/README.md`) — typically `http://localhost:3001`
- PostgreSQL + Redis if required by the API

### 1. Install

```bash
cd frontend
npm install
```

### 2. Configure environment

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001
```

### 3. Development server

```bash
npm run dev
```

App: **`http://localhost:5173`**

### 4. Production build

```bash
npm run build
npm run preview
```

### 5. Lint

```bash
npm run lint
```

---

## Typical User Flow

1. Open app → redirect `/` → `/rooms` → if not logged in, **ProtectedRoute** redirects to **`/login`**.
2. **Register** → **Login** → token stored.
3. **Search rooms** → pick dates on a room → **Book** → see success or error message.
4. **Logout** clears token.

---

## API Integration Summary

| UI action               | HTTP method | Endpoint                                                  |
| ----------------------- | ----------- | --------------------------------------------------------- |
| Register                | POST        | `/auth/register`                                          |
| Login                   | POST        | `/auth/login`                                             |
| Search rooms            | GET         | `/rooms/search`                                           |
| Create booking          | POST        | `/bookings`                                               |
| (Optional) Current user | GET         | `/auth/me` — available via `getMe()` if you extend the UI |

All authenticated calls rely on the Axios instance in `src/api/axios.ts` (Bearer token from `localStorage`).

---

## Styling & UI Conventions

- **Tailwind v4** with `@import "tailwindcss"` in `src/index.css`.
- **shadcn** theme tokens and components under `src/components/ui/`.
- Forms use **Cards**, **Inputs**, **Labels**, **Buttons** for a consistent layout.

---

## Error & Edge Cases (UX)

- **Network / no response:** `getErrorMessage` falls back to a generic message.
- **401 / invalid token:** user may see API error; clearing token and re-login is the recovery path (logout is available in the navbar).
- **429 rate limit:** API may return throttling errors; same banner pattern applies.
- **Validation:** `react-hook-form` + DTO rules on the server; duplicate messages possible if both client and server validate — acceptable for the assignment.

---

## Testing (Frontend)

This project does **not** ship a Jest/Vitest suite by default. You can add **Vitest + React Testing Library** later for component tests. The **API** includes Jest unit tests for core services (`../api`).

---

## Docker / Compose (with API)

From the **repository root**, `docker compose up -d` can start Postgres and Redis for the API. The frontend still runs with `npm run dev` on the host unless you add a container for it.

---

## Future Improvements

- Vitest + Testing Library for forms and routing
- Refresh tokens or silent refresh
- Dedicated booking history / cancellation pages when backend supports them
- Toast notifications instead of inline banners only
- Environment-specific `VITE_API_URL` for staging/production

---

## Summary

This frontend is a **Vite + React + TypeScript** SPA that implements **registration, login, protected room search, and booking** against the **Room Booking API**, with **JWT in localStorage**, **Axios interceptors**, **unified error message parsing**, and a **shadcn/Tailwind** UI—matching the assignment’s two-service architecture and the core functional requirements.

---

## Related Documentation

- **Backend API:** [`../api/README.md`](../api/README.md)
