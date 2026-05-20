# Phase 2 — Database Schema & Auth

## Overview

Defined the full domain schema in Prisma, wired authentication end-to-end (stub for development, Google OAuth for production), and added JWT-based API protection with a `@CurrentUser()` decorator.

---

## Project Structure Added

```
storycraft/
├── backend/
│   └── src/
│       └── auth/
│           ├── auth.module.ts              # PassportModule + JwtModule
│           ├── auth.service.ts             # stubLogin(), googleLogin(), googleVerify()
│           ├── auth.controller.ts          # Auth endpoints
│           ├── strategies/
│           │   ├── google.strategy.ts      # PassportStrategy for Google OAuth
│           │   └── jwt.strategy.ts         # PassportStrategy for JWT Bearer
│           ├── guards/
│           │   └── jwt-auth.guard.ts       # @UseGuards(JwtAuthGuard)
│           └── decorators/
│               └── current-user.decorator.ts # @CurrentUser()
└── frontend/
    └── src/
        ├── auth.ts                         # NextAuth v5 config
        ├── proxy.ts                        # Route guard (renamed from middleware.ts in Next.js 16)
        └── app/
            ├── actions/
            │   └── auth.ts                 # Server actions: googleLoginAction, stubLoginAction, logoutAction
            ├── login/
            │   └── page.tsx                # Login page
            └── dashboard/
                └── page.tsx                # Dashboard stub
```

---

## 2.1 — Prisma Schema

Full domain schema in `backend/prisma/schema.prisma`.

### Enums

| Enum | Values |
|------|--------|
| `SubscriptionPlan` | `FREE`, `BASIC`, `PRO` |
| `SubscriptionStatus` | `ACTIVE`, `CANCELED`, `PAST_DUE`, `TRIALING` |
| `BookStatus` | `PENDING`, `PROCESSING`, `DONE`, `FAILED` |
| `TaskStatus` | `QUEUED`, `RUNNING`, `DONE`, `FAILED` |
| `TaskType` | `GENERATE_TEXT`, `GENERATE_IMAGE`, `GENERATE_PDF` |

### Models

| Model | Key Relations |
|-------|--------------|
| `User` | has many `Child`, `Book`, one `Subscription`, many `Rating`, `Referral` |
| `Child` | belongs to `User`, has many `Book` |
| `Template` | has many `Book` (admin-seeded) |
| `Book` | belongs to `User`, `Child`, `Template`; has many `BookPage`, `Task`, `Rating` |
| `BookPage` | belongs to `Book`; has many `Illustration`; unique on `(bookId, pageNum)` |
| `Illustration` | belongs to `BookPage` |
| `Subscription` | one-to-one with `User`; holds Stripe IDs and plan status |
| `Rating` | belongs to `User` + `Book`; unique on `(userId, bookId)` |
| `Referral` | links referrer `User` → referee `User`; referee is unique |
| `Task` | belongs to `Book`; tracks generation job state + payload |

### Prisma 7 Schema Rules

- No `url` in `datasource` block — it lives in `prisma.config.ts`
- No `previewFeatures = ["driverAdapters"]` — no longer needed in Prisma 7

### Running the migration

```bash
cd backend
npx prisma migrate dev --name init
```

---

## 2.2 — Stub Auth

A hardcoded test user bypass so the app can be used locally without Google credentials.

### Backend — `POST /auth/stub-login`

Returns a signed JWT for a fixed test user. Requires no credentials.

```
Response: { access_token: string, user: { id, email, name } }
```

Test user: `id=stub-user-id`, `email=test@storycraft.local`, `name=Test User`

### Frontend — Credentials stub provider

`STUB_AUTH=true` in `frontend/.env.local` activates a second NextAuth provider with `id: 'stub'`.
When triggered it calls `POST /auth/stub-login` and stores the backend JWT in the session.

The stub button only renders when `STUB_AUTH=true` (server component env check).

---

## 2.3 — Login Page & Route Guard

### Login page (`/login`)

- "Sign in with Google" — triggers Google OAuth
- "Sign in as test user (dev)" — triggers stub (only visible when `STUB_AUTH=true`)

### Dashboard stub (`/dashboard`)

Displays `session.user.email` and a sign-out button. Verifies the session is wired correctly.

### Route guard (`src/proxy.ts`)

> **Next.js 16 rename:** `middleware.ts` is deprecated and renamed to `proxy.ts`. The exported function must be named `proxy` or be the default export.

```
/dashboard (and below) → requires session → redirects to /login if missing
/login → redirects to /dashboard if already signed in
```

The guard wraps NextAuth's `auth()` as the default export:

```ts
export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname.startsWith('/dashboard'))
    return NextResponse.redirect(new URL('/login', req.nextUrl))
})
```

---

## 2.4 — Google OAuth (NestJS + Passport)

### Packages added

```
@nestjs/passport  passport  passport-google-oauth20  passport-jwt
@types/passport-google-oauth20  @types/passport-jwt  @types/passport
```

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/auth/google` | Redirects browser to Google consent screen |
| `GET` | `/auth/google/callback` | Google redirects here; signs JWT; redirects to `FRONTEND_URL` |
| `POST` | `/auth/google/token` | Server-side exchange — NextAuth calls this after Google OAuth |
| `POST` | `/auth/stub-login` | Dev stub — returns JWT for test user |
| `GET` | `/auth/me` | Protected — returns `{ id, email }` from JWT |

### New env variables (backend)

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | Full callback URL, e.g. `http://localhost:3001/auth/google/callback` |
| `FRONTEND_URL` | Frontend origin for post-OAuth redirect, e.g. `http://localhost:3000` |

---

## 2.5 — NextAuth Google Provider

`frontend/src/auth.ts` replaced the Credentials stub with the Google provider.

### Flow

1. User clicks "Sign in with Google" → NextAuth initiates Google OAuth
2. Google redirects to `/api/auth/callback/google`
3. NextAuth `jwt` callback calls `POST /auth/google/token` with `{ googleId, email, name }`
4. Backend signs a backend JWT and returns it
5. Backend JWT is stored as `session.accessToken` — used for all API calls

### NextAuth env variables (frontend)

| Variable | Description |
|----------|-------------|
| `AUTH_SECRET` | NextAuth signing secret (min 32 chars) |
| `AUTH_GOOGLE_ID` | Google OAuth client ID (same as backend) |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret (same as backend) |
| `BACKEND_URL` | Backend base URL, e.g. `http://localhost:3001` |
| `STUB_AUTH` | Set to `true` to enable the dev stub login button |

---

## 2.6 — JWT Auth Guard & `@CurrentUser()`

### `JwtStrategy`

Extracts Bearer token from `Authorization` header, verifies against `JWT_SECRET`, returns `{ id, email }`.

### `JwtAuthGuard`

```ts
@UseGuards(JwtAuthGuard)
```

Apply to any controller or route that requires authentication. Returns `401` when the token is absent or invalid.

### `@CurrentUser()`

```ts
@Get('me')
@UseGuards(JwtAuthGuard)
me(@CurrentUser() user: AuthUser) {
  return user; // { id: string, email: string }
}
```

### Isoloated modules note

NestJS `tsconfig.json` enables `isolatedModules` + `emitDecoratorMetadata`. Express types (`Request`, `Response`) and local interfaces (`AuthUser`, `GoogleUser`) used in decorated method signatures must be imported with `import type` to avoid TS1272 errors.

---

## Port Assignments (local dev)

| Service | Port |
|---------|------|
| Frontend (Next.js) | `3000` |
| Backend (NestJS) | `3001` |
| PostgreSQL | `5433` |
| Redis | `6379` |
| MinIO API | `9000` |
| MinIO Console | `9001` |

---

## Local Setup (first time)

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Backend env
cp backend/.env.example backend/.env
# Fill in GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

# 3. Frontend env
cp frontend/.env.local.example frontend/.env.local
# Fill in AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_SECRET

# 4. Run initial migration
cd backend && npx prisma migrate dev --name init

# 5. Start backend (port 3001)
npm run start:dev

# 6. Start frontend (port 3000, separate terminal)
cd ../frontend && npm run dev
```

---

## Verification Checklist

| Check | How | Expected |
|-------|-----|----------|
| Schema valid | `cd backend && npx prisma validate` | "The schema is valid" |
| Migration applied | `npx prisma migrate dev --name init` | All tables created |
| Backend starts | `npm run start:dev` | "Nest application successfully started" on port 3001 |
| Frontend starts | `npm run dev` | Ready on port 3000 |
| Stub login | `POST localhost:3001/auth/stub-login` | `{ access_token, user }` |
| Login page | Open `localhost:3000/login` | Two buttons visible (with `STUB_AUTH=true`) |
| Stub flow | Click "Sign in as test user (dev)" | Redirects to `/dashboard`, shows `test@storycraft.local` |
| Route guard | Open `localhost:3000/dashboard` without session | Redirects to `/login` |
| Protected endpoint | `GET localhost:3001/auth/me` without token | `401 Unauthorized` |
| Protected endpoint | `GET localhost:3001/auth/me` with Bearer token | `{ id, email }` |
