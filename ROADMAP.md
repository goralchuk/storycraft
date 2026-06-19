# StoryCraft — Development Roadmap

Reports on completed implementations in the folder /docs/

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
│   ├── Dockerfile              # Multi-stage, node:24-alpine
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

## Phase 5 — StoryBloom: Data, API & Generation

Implements the StoryBloom spec (`draft/storybloom_spec.md`): topic/age-based templates, the guided creation form, child photos, DB-configurable AI models, and reuse-ready story storage.

**Status:** ✅ Complete (5.1–5.11). Results in `docs/phase-5-storybloom.md`.

AI providers and models are selected at runtime from a DB-backed typed `AppSettings` singleton — separate `textProvider`/`textModel` and `imageProvider`/`imageModel` — editable via `GET/PATCH /settings`. API keys stay in env; only the provider/model choice lives in the DB. (Replaces the earlier `AI_PROVIDER` env-var approach.)

**Text:** provider/model configurable (default OpenAI `gpt-4o-mini`, ~$0.15/1M tokens; Anthropic Claude also supported). Stories are generated **slot-based** — the child name and character names are emitted as tokens (`{{child}}`, `{{friend}}`) with a `Book.slots` map resolved at read-time, so a saved story can later be re-personalized with zero text-model cost.
**Images:** provider/model configurable. Illustrations that feature the child are flagged `featuresChild` and driven by the child's photo (`Child.photoUrl`, or a per-book `Book.photoUrl` override), so later reuse regenerates only child-facing panels.
> Reuse library (`StoryPreset`) is not built in this phase — the slot map + `featuresChild` flag are the hooks that make it cheap to add later. Frontend create flow / preview / PDF download live in Phase 7.

| # | Task | Verification |
|---|------|-------------|
| 5.1 | **Data model & seed** — extend `Template`/`Book`/`Child`/`Illustration`; add `Topic` and `AppSettings` singleton; seed topics, templates, default settings | `prisma migrate dev` runs clean; seed rows present |
| 5.2 | **Domain API** — `/topics`; template `category`/`age` filtering; extended `Children` (`photoUrl`) and `Books` DTO (`topicId, pageCount, promptText, writingStyle, fear, photoUrl`) | Endpoints list/filter; book inherits child `photoUrl` when none supplied |
| 5.3 | **Settings API** — `GET/PATCH /settings` for AI provider/model config | Patching `textModel` persists; reads reflect change |
| 5.4 | `TasksModule` + BullMQ queue setup | Job enqueued on book creation |
| 5.5 | `AiService` interface + `StubAiService` (hardcoded slot-tokenized text + image URL) | Worker processes job end-to-end with stub; slots present |
| 5.6 | Text generator — reads provider/model from `AppSettings`; emits slot-tokenized story (child + character names as tokens) per page from child profile + template prompt | Returns structured page text with `{{...}}` tokens + slots map |
| 5.7 | Image generator — reads provider/model from `AppSettings`; generates per illustration, sets `featuresChild`, uses child photo for child-facing panels | Returns image URL per illustration; child-facing panels flagged |
| 5.8 | Provider/model injection driven by `AppSettings` (not env) | Switching `textProvider`/`imageProvider` in DB swaps implementation; stub and live both work |
| 5.9 | PDF generation worker (pdfkit or Puppeteer) — resolves slots, assembles pages + images into PDF | Produces valid PDF with names resolved |
| 5.10 | `StorageService` — MinIO/S3 upload + signed URL; binary photo upload endpoint | PDF + images stored, URLs returned on `GET /books/:id`; photo upload returns a URL |
| 5.11 | Book status lifecycle: `PENDING → PROCESSING → DONE / FAILED` | Frontend can poll status |

---

## Phase 6 — Frontend Flow & Book Preview

The end-to-end user journey on the current generation pipeline (Gemini text, stub/echo images): landing → create → preview → PDF. Books render as **HTML spreads**; PDF is produced **on demand**, not eagerly in the worker.

| # | Task | Verification |
|---|------|-------------|
| 6.1 | Landing page + CTA routing — guest → Google sign-in; signed-in with a child → create; no child → child form → create | Landing renders; CTA routes by auth/child state |
| 6.2 | Children management page — add/edit/delete, photo upload (`POST /uploads/photo`) | Full CRUD from the UI; photo persists |
| 6.3 | Book creation wizard (`/books/new`) — child select/add → template + page count → topic/style/prompt/photo | `POST /books` sends the full StoryBloom DTO |
| 6.4 | HTML spread renderer — `/books/[id]` lays out pages as book spreads (slots resolved, images placed) | Generated book renders as readable spreads |
| 6.5 | Book status polling — `PENDING → PROCESSING → DONE / FAILED` | Status updates without refresh; viewer appears on `DONE` |
| 6.6 | PDF on demand — generate + download from the HTML layout on click; remove eager PDF build from the worker | Download button returns a PDF; worker no longer builds PDF |
| 6.7 | Profile page — edit name, avatar | Changes persist |

---

## Phase 7 — Characters & Avatars (real image generation)

Real, style-matched illustrations and reusable hero avatars. Enables the "from scratch" mode and cheap targeted regeneration. Image model: Gemini (free tier; model id via `AppSettings.imageModel`).

| # | Task | Verification |
|---|------|-------------|
| 7.1 | `GeminiImageGenerator` + `DispatchingImageGenerator` — image provider/model from `AppSettings`, output stored via `StorageService` | Switching `imageProvider` swaps stub/Gemini; real image stored, signed URL on read |
| 7.2 | `Avatar` model — linked to `Child` (style + image key), max 5 per child | Migrate clean; create avatar; 6th rejected |
| 7.3 | Avatar generation — main hero from child photo + description + chosen style | Generates + stores a style-matched avatar |
| 7.4 | Avatar selection in the create wizard — reuse a saved avatar or generate a new one | Wizard offers saved avatars for the chosen style |
| 7.5 | Targeted regeneration — re-render only `featuresChild` panels when the avatar changes | Swapping avatar regenerates hero panels only; text untouched |

---

## Phase 8 — Subscriptions & Payments

| # | Task | Verification |
|---|------|-------------|
| 8.1 | Stripe products/prices setup (free tier + paid plans) | Prices exist in Stripe dashboard |
| 8.2 | `SubscriptionsModule` — create checkout session, portal | Redirect to Stripe works |
| 8.3 | Stripe webhook handler — sync subscription status to DB | Status updates on payment event |
| 8.4 | Subscription guard on book generation endpoint | Free tier returns `403` when limit hit |
| 8.5 | Subscription/billing page (frontend) | Checkout + portal links work |

---

## Phase 9 — Optional / Later

- Security hardening — role-based access control: add a `role` to `User` and restrict admin-only endpoints (`/settings`, and any future admin APIs) to admins. _(Surfaced by code review of Phase 5: `/settings` is currently open to any authenticated user.)_
- Ratings system on books
- Referral program
- Mobile app (App Store + Play Market)
- Add production-scale image providers (OpenAI DALL-E 3, Stability AI) selectable via `AppSettings`
- `StoryPreset` reuse library — save curated slot-based books, re-personalize by swapping name/photo/character slots (regenerates only `featuresChild` panels)

---

## Tech Debt / Deferred

Items intentionally postponed — revisit when the trigger applies.

| Item | Action | Trigger |
|---|---|---|
| Enable Qwen review PR gate | Uncomment `pull_request` in `.github/workflows/qwen-review.yml`, add `QWEN_API_KEY` to GitHub Secrets, and switch the diff base to `${{ github.event.pull_request.base.sha }}` | When we start opening PRs |
