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

## Phase 4 — Generation Pipeline

`AiService` is an interface with two implementations selected via env var `AI_PROVIDER=stub|real`.

**Text:** OpenAI `gpt-4o-mini` (cheapest model, ~$0.15/1M tokens).
**Images:** Bing Image Creator (DALL-E 3 under the hood, free via Microsoft account).
> Bing Image Creator has no official API — access is cookie-based (`_U` cookie from a logged-in Microsoft account). Suitable for development and low volume. For production scale, swap to OpenAI DALL-E 3 or Stability AI.

| # | Task | Verification |
|---|------|-------------|
| 4.1 | `TasksModule` + BullMQ queue setup | Job enqueued on book creation |
| 4.2 | `AiService` interface + `StubAiService` (returns hardcoded text/image URL) | Worker processes job end-to-end with stub |
| 4.3 | `OpenAiTextService` — `gpt-4o-mini` generates story text per page from child profile + template prompt | Returns structured page text |
| 4.4 | `BingImageService` — submits prompt to Bing Image Creator via `_U` cookie, polls for result URL | Returns image URL per illustration |
| 4.5 | Wire `AI_PROVIDER` env var to inject stub or real implementation | Switching `AI_PROVIDER=real` uses live APIs; `stub` uses hardcoded data |
| 4.6 | PDF generation worker (pdfkit or Puppeteer) — assembles pages + images into PDF | Produces valid PDF |
| 4.7 | `StorageService` — MinIO/S3 upload + signed URL | PDF stored, URL returned on `GET /books/:id` |
| 4.8 | Book status lifecycle: `PENDING → PROCESSING → DONE / FAILED` | Frontend can poll status |

---

## Phase 5 — Subscriptions & Payments

| # | Task | Verification |
|---|------|-------------|
| 5.1 | Stripe products/prices setup (free tier + paid plans) | Prices exist in Stripe dashboard |
| 5.2 | `SubscriptionsModule` — create checkout session, portal | Redirect to Stripe works |
| 5.3 | Stripe webhook handler — sync subscription status to DB | Status updates on payment event |
| 5.4 | Subscription guard on book generation endpoint | Free tier returns `403` when limit hit |

---

## Phase 6 — Frontend

| # | Task | Verification |
|---|------|-------------|
| 6.1 | NextAuth with Google provider + JWT forwarding to API | Login works, session persists |
| 6.2 | Dashboard layout + routing | Nav renders, routes load |
| 6.3 | Children management page | Add/edit/delete children |
| 6.4 | Template browser | Grid of templates with preview |
| 6.5 | Book creation wizard (template → child → confirm) | Wizard submits, shows status |
| 6.6 | Book detail + PDF download | Signed URL opens PDF |
| 6.7 | Subscription/billing page | Checkout + portal links work |

---

## Phase 7 — Optional / Later

- Ratings system on books
- Referral program
- Mobile app (App Store + Play Market)
- Swap `BingImageService` for OpenAI DALL-E 3 or Stability AI at production scale
