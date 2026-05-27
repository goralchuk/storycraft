# StoryCraft — Development Roadmap

## Project Structure

```
storycraft/
├── docker-compose.yml          # PostgreSQL, Redis, MinIO
├── .gitignore
├── CLAUDE.md
├── ROADMAP.md
├── DRAFT.md
├── docs/
├── backend/                    # NestJS
│   ├── Dockerfile              # Multi-stage, node:20-alpine
│   ├── .env                    # Local only, gitignored
│   ├── .env.example            # Committed, no real values
│   ├── prisma.config.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── nest-cli.json
│   ├── tsconfig.json
│   └── src/
│       ├── main.ts
│       ├── app.module.ts       # PrismaModule + BullMQ
│       ├── app.controller.ts
│       ├── app.service.ts
│       ├── config/
│       │   ├── env.schema.ts   # Zod schema + Env type
│       │   └── config.service.ts
│       └── prisma/
│           ├── prisma.module.ts
│           └── prisma.service.ts
└── frontend/                   # Next.js
    ├── Dockerfile              # Multi-stage, standalone output
    ├── next.config.ts          # output: "standalone"
    ├── tsconfig.json
    └── src/
        └── app/                # App Router
```

---

## Phase 1 — Foundation

| # | Task | Verification |
|---|------|-------------|
| 1.1 | Scaffold `backend/` — NestJS with Prisma, BullMQ, `prisma.module.ts` global | `nest start` runs |
| 1.2 | Scaffold `frontend/` — Next.js App Router, standalone output | `next dev` runs |
| 1.3 | `docker-compose.yml` — PostgreSQL, Redis, MinIO | `docker compose up` — all healthy |
| 1.4 | `backend/.env.example` (all keys, no real values) committed; `backend/.env` in `.gitignore`; Zod schema + typed `ConfigService` validates at boot | Missing var prints field name + reason and exits; `.env` never appears in `git status` |
| 1.5 | `prisma/schema.prisma` — empty schema targeting PostgreSQL | `prisma migrate dev` runs clean |

---

## Phase 2 — Database Schema & Auth

| # | Task | Verification |
|---|------|-------------|
| 2.1 | Prisma schema: `User`, `Child`, `Template`, `Book`, `BookPage`, `Illustration`, `Subscription`, `Rating`, `Referral`, `Task` | `prisma migrate dev` runs clean |
| 2.2 | Stub auth — hardcoded test user bypass in NestJS + NextAuth stub on frontend | Can log in without a Google account |
| 2.3 | Frontend login page (Next.js) — sign-in button, redirects to dashboard | Login page renders, stub login works |
| 2.4 | Google OAuth in NestJS via Passport + JWT session | `/auth/google` redirects, returns JWT |
| 2.5 | Swap stub for real Google provider in NextAuth | Real Google login works, stub removed |
| 2.6 | Auth guard + user context decorator on API | Protected endpoint returns `401` without token |

---

## Phase 3 — Core Domain APIs

| # | Task | Verification |
|---|------|-------------|
| 3.1 | `UsersModule` — profile read/update | `GET /users/me` returns profile |
| 3.2 | `ChildrenModule` — CRUD under authenticated user | Create child, fetch list |
| 3.3 | `TemplatesModule` — list and get (admin seeded) | `GET /templates` returns items |
| 3.4 | `BooksModule` — create, list, get | `POST /books` with `templateId` + `childId` |

---

## Phase 4 — Onboarding & Dashboard

| # | Task | Verification |
|---|------|-------------|
| 4.1 | Fix session user ID — `backend-callback` calls `GET /users/me`; stores real DB UUID + `name` in session | `session.user.id` is a cuid; `name` is `null` for new user |
| 4.2 | Route guard — new user (name is null) redirected to `/onboarding`; returning user goes to `/dashboard` | First login → `/onboarding`; second login → `/dashboard` |
| 4.3 | `/onboarding` page — step 1: enter name (`PATCH /users/me`); step 2: add first child (`POST /children`) with skip option | Name saved to DB; child created; lands on `/dashboard` |
| 4.4 | `frontend/src/lib/api.ts` — server-side fetch helper that attaches Bearer token from session | All backend calls use the helper |
| 4.5 | Dashboard — state A (no books): "Create your first book" CTA; state B: book list with template title, child name, status badge | New user sees CTA; returning user sees book list |
| 4.6 | Book creation flow — pick template (`GET /templates`), pick child (`GET /children`), submit (`POST /books`) | Book appears in list with `PENDING` status |

---

## Phase 5 — Generation Pipeline

`AiService` is an interface with two implementations selected via env var `AI_PROVIDER=stub|real`.

**Text:** OpenAI `gpt-4o-mini` (cheapest model, ~$0.15/1M tokens).
**Images:** Bing Image Creator (DALL-E 3 under the hood, free via Microsoft account).
> Bing Image Creator has no official API — access is cookie-based (`_U` cookie from a logged-in Microsoft account). Suitable for development and low volume. For production scale, swap to OpenAI DALL-E 3 or Stability AI.

| # | Task | Verification |
|---|------|-------------|
| 5.1 | `TasksModule` + BullMQ queue setup | Job enqueued on book creation |
| 5.2 | `AiService` interface + `StubAiService` (returns hardcoded text/image URL) | Worker processes job end-to-end with stub |
| 5.3 | `OpenAiTextService` — `gpt-4o-mini` generates story text per page from child profile + template prompt | Returns structured page text |
| 5.4 | `BingImageService` — submits prompt to Bing Image Creator via `_U` cookie, polls for result URL | Returns image URL per illustration |
| 5.5 | Wire `AI_PROVIDER` env var to inject stub or real implementation | Switching `AI_PROVIDER=real` uses live APIs; `stub` uses hardcoded data |
| 5.6 | PDF generation worker (pdfkit or Puppeteer) — assembles pages + images into PDF | Produces valid PDF |
| 5.7 | `StorageService` — MinIO/S3 upload + signed URL | PDF stored, URL returned on `GET /books/:id` |
| 5.8 | Book status lifecycle: `PENDING → PROCESSING → DONE / FAILED` | Frontend can poll status |

---

## Phase 6 — Subscriptions & Payments

| # | Task | Verification |
|---|------|-------------|
| 6.1 | Stripe products/prices setup (free tier + paid plans) | Prices exist in Stripe dashboard |
| 6.2 | `SubscriptionsModule` — create checkout session, portal | Redirect to Stripe works |
| 6.3 | Stripe webhook handler — sync subscription status to DB | Status updates on payment event |
| 6.4 | Subscription guard on book generation endpoint | Free tier returns `403` when limit hit |

---

## Phase 7 — Frontend Polish

| # | Task | Verification |
|---|------|-------------|
| 7.1 | Children management page — add/edit/delete | Full CRUD from the UI |
| 7.2 | Template browser — grid with preview | Templates display with cover image |
| 7.3 | Book detail page + PDF download | Signed URL opens PDF |
| 7.4 | Book status polling — `PENDING → PROCESSING → DONE` | Status badge updates without refresh |
| 7.5 | Profile page — edit name, avatar | Changes persist |
| 7.6 | Subscription/billing page | Checkout + portal links work |

---

## Phase 8 — Optional / Later

- Ratings system on books
- Referral program
- Mobile app (App Store + Play Market)
- Swap `BingImageService` for OpenAI DALL-E 3 or Stability AI at production scale
