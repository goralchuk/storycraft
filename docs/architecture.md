# StoryCraft — Architecture

## Overview

StoryCraft is a personalized children's book generation service. Users select a story template, pick a child profile, and the system generates a PDF book with AI-written text and AI-generated illustrations.

**Current state:** Phase 4 complete (Onboarding & Dashboard). Generation pipeline, subscriptions, and frontend polish are planned (Phases 5–7).

---

## Services

```
Browser
  └── Next.js frontend  :3000
        └── NestJS backend  :3001
              ├── PostgreSQL  :5432  (via Prisma)
              ├── Redis       :6379  (BullMQ job queue)
              └── MinIO       :9000  (object storage — planned Phase 5)
```

All services run locally via `docker-compose.yml`.

---

## Backend (NestJS)

Entry: `backend/src/main.ts` — listens on port `3001`.

**Modules:**

| Module | Responsibility |
|---|---|
| `AuthModule` | Google OAuth via Passport + JWT issuance; stub login for dev |
| `UsersModule` | `GET/PATCH /users/me` — profile read/update; upsert on first access |
| `ChildrenModule` | CRUD `/children` — owned per user; `409` on delete with books |
| `TemplatesModule` | Read-only `/templates` — admin-seeded, filtered by `isActive` |
| `BooksModule` | `GET/POST /books` — book creation and listing with template + child |
| `PrismaModule` | Global Prisma client; `prisma.config.ts` handles DB URL (Prisma 7) |
| `ConfigModule` | Zod-validated env schema; typed `ConfigService`; exits on missing vars |

**Auth flow:**
1. Frontend initiates Google OAuth → `GET /auth/google`
2. Google redirects to `GET /auth/google/callback` → Passport validates
3. Backend posts credential to `POST /auth/google/token` → returns JWT
4. NextAuth stores JWT in session as `accessToken`
5. All protected endpoints require `Authorization: Bearer <token>` (`JwtAuthGuard`)

---

## Frontend (Next.js App Router)

Entry: `frontend/src/app/` — uses App Router with server components and server actions.

**Key files:**

| File | Responsibility |
|---|---|
| `auth.ts` | NextAuth config; two providers: `backend-callback` (Google) and `stub` (dev) |
| `proxy.ts` | Middleware route guard — redirects unauthenticated users to `/login` |
| `lib/api.ts` | `apiFetch` helper — attaches Bearer token from session to all backend calls |

**Pages:**

| Route | Description |
|---|---|
| `/login` | Sign-in page; redirects authenticated users to `/dashboard` |
| `/onboarding` | Two-step flow: enter name → add first child; redirects if name already set |
| `/dashboard` | Book list (or "Create first book" CTA if no books); redirects new users to `/onboarding` |
| `/books/new` | Template + child picker → `POST /books`; redirects to `/onboarding?step=2` if no children |

---

## Data Model (Prisma)

Core entities: `User`, `Child`, `Template`, `Book`, `BookPage`, `Illustration`, `Subscription`, `Rating`, `Referral`, `Task`.

Ownership chain: `User → Child → Book → BookPage → Illustration`.

---

## Generation Pipeline (Phase 5 — planned)

- BullMQ job enqueued on `POST /books`
- `AiService` interface with `stub` and `real` implementations (`AI_PROVIDER` env var)
- Text: OpenAI `gpt-4o-mini`
- Images: Bing Image Creator (cookie-based; DALL-E 3 for production scale)
- PDF assembled via pdfkit or Puppeteer, stored in MinIO/S3
- Book status lifecycle: `PENDING → PROCESSING → DONE / FAILED`

---

## Environment Variables

Validated at boot via Zod (`backend/src/config/env.schema.ts`). Template in `backend/.env.example`.

Key vars: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_URL`, `AI_PROVIDER`.
