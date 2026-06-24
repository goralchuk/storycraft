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

## Phase 6 — Coin Economy, Heroes, Pricing Admin & Full Redesign

Implements the prototype flow (`draft/design/STORYCRAFT_FLOW.md`): internal **coin** currency, paid book creation with **draft persistence**, child-owned **reusable heroes** with metered generation, a **3-step wizard**, **wallet**, an admin-editable **pricing catalog** (cached), and a full visual redesign ported from the prototype. Replaces the earlier "Frontend Flow" + "Characters & Avatars" phases.

Decisions: internal coin economy only (wallet "buy" credits coins as a stub — real-money purchase is Phase 7); coins replace subscriptions; App Router pages; heroes are owned by `Child` and reusable; per-hero free-generation counter (3 free, +100 for 3 more) resets to 3 on book completion; pricing lives in a DB catalog (`PriceItem`) cached in Redis (backend) and the Next.js data cache (frontend), edited via an admin-only API that invalidates both caches.

| # | Task | Verification |
|---|------|-------------|
| 6.1 | **Roles & RBAC** — `Role` enum on `User`; `RolesGuard` + `@Roles`; protect `/settings` + future admin APIs; seed admin by email | non-admin → 403 on admin endpoint; admin passes; `/settings` now guarded |
| 6.2 | **Coins data model** — `User.balance` (default 500), `CoinTransaction` (label, amount, isIn, bookId?) | migrate clean; new user = 500; debit logs txn |
| 6.3 | **Pricing catalog** — `PriceItem` (key, label, category, amount, active); seed all costs + coin packages | migrate clean; seed rows present |
| 6.4 | **Pricing API + cache** — public `GET /pricing` (Redis-cached); admin `PATCH /pricing/:key` → DB write + cache invalidate | GET served from cache; PATCH reflects after invalidation; non-admin PATCH → 403 |
| 6.5 | **Frontend pricing** — fetch `/pricing` via Next data cache + tag; admin update triggers `revalidateTag` | prices render w/o per-request DB hit; updated price appears after admin change |
| 6.6 | **Coin service** — atomic debit/credit + balance guard; insufficient-funds error; reads amounts from `PriceItem` | debit below 0 rejected; balance + txn atomic |
| 6.7 | **Book DRAFT lifecycle** — `DRAFT` status; pay-at-config creates DRAFT + debits; resume restores wizard step 2 | pay → exit → DRAFT persists; resume → step 2; not re-charged |
| 6.8 | **Hero model** — `Hero` linked to `Child` (main + ≤4 companions): name, role, style, imageKey, status, free-attempt counter | migrate clean; 5th rejected; counter starts at 3 |
| 6.9 | **Hero generation & billing** — gen avatar from photo+desc+style; −1 attempt; +100 → 3 more; companion +100; counters reset on book completion | 3 free; 4th blocked until topup; companion debits 100; completion resets |
| 6.10 | **Pricing wiring** — book type (unique 500 / template 300) + page tiers charged at step 1 via `PriceItem` amounts | each choice debits correct amount; insufficient → wallet redirect |
| 6.11 | **Generation stages** — 4 named stages (heroes→story→illustrations→assemble) + progress on `GET /books/:id` | frontend polls through named stages |
| 6.12 | **Design system** — port prototype tokens to Tailwind theme (navbar, cards, buttons, coin badge) | shared theme; navbar shows balance |
| 6.13 | **Landing + Auth** redesigned | matches prototype; CTA → auth/onboarding |
| 6.14 | **Onboarding** redesigned (2 steps; skip) | name+child saved; skip → empty dashboard |
| 6.15 | **Dashboard** redesigned — draft banner / book grid / empty state; balance in navbar | three states render; resume works |
| 6.16 | **Children screen** — CRUD + photo + saved heroes per child | full CRUD; avatars listed |
| 6.17 | **Wizard step 1** — type + template pick; debit upfront → DRAFT | confirm debits, creates DRAFT, advances |
| 6.18 | **Wizard step 2** — child, heroes (inline gen), style, topic, pages; template freezes all but main hero | template locks fields; unique editable; inline gen |
| 6.19 | **Wizard step 3** — start generation; live 4-stage progress; done → dashboard + reader | progress advances; DONE; reader opens |
| 6.20 | **Book reader** — HTML spreads (slots+images) + on-demand PDF | spreads render; PDF download works |
| 6.21 | **Wallet** — balance, transaction history, coin packages (buy = stub credit, reads `PriceItem`) | history lists txns; package credits + logs |

---

## Phase 7 — Coin Economy: finalize logic & schema (pre-payment)

Complete all coin business logic and lock the data model so the **entire flow is fully testable without a payment provider**. Also remove dead schema left over from the abandoned subscription model.

| # | Task | Verification |
|---|------|-------------|
| 7.1 | **Remove unused schema** — drop the `Subscription` model + `SubscriptionPlan`/`SubscriptionStatus` enums + `User.subscription` relation (subscriptions are dropped in favor of coins); audit the rest and remove anything genuinely unreferenced. Keep `Rating`/`Referral` (reserved for Phase 11 features). Prisma migration | migration applies; `prisma validate` + backend build clean; no dangling references |
| 7.2 | **Lock the coin data model** — confirm the complete set of coin tables and document them: `User.balance` (current balance), `CoinTransaction` (append-only ledger), `PriceItem` (price catalog). No coin state lives anywhere else | data model documented in `docs/`; all coin state is in these three tables |
| 7.3 | **Complete coin rules** — every charge/credit flows through `CoinService` and is logged; failed generation refunds the page-tier surcharge; hero free-attempt counters reset on book completion; insufficient funds consistently returns 402 | each rule has a test / manual check |
| 7.4 | **Pricing is tunable** — seed covers every key (book types, page tiers, hero top-up, companion, packs); amounts editable via seed/admin for testing | changing a `PriceItem` amount changes the charged cost |
| 7.5 | **Full coin E2E without payments** — create → configure → generate → read, plus stub top-up; verify balance + ledger correctness across the whole flow | balances and `CoinTransaction` entries are correct end-to-end |

---

## Phase 8 — Book Generation Hardening

Stand up real book generation on the Qwen family and stabilize it, so books generate reliably in Russian — done after the coin fixes and before any payment integration. Models (DashScope intl, OpenAI-compatible base for text): `qwen3.7-plus` (story text), `qwen-image-2.0` (illustrations, multimodal-generation API → image URL stored in MinIO), `qwen3-vl-flash` (consistency / quality check). Name tokenization (`{{child}}`) is kept.

| # | Task | Verification |
|---|------|-------------|
| 8.1 | **Qwen providers + first live book** — wire `qwen3.7-plus` (text) and `qwen-image-2.0` (images, download OSS URL → MinIO); add `QWEN_API_KEY` to backend env; default `AppSettings` → qwen. Russian prompt + Cyrillic PDF font already in place | a book reaches `DONE` with a real Russian story + real illustrations and opens in the reader + PDF |
| 8.2 | **Rich page structure** — story model emits a per-page `imageDescription` (+ mood) stored in `Illustration.prompt`; illustrations are built from the scene description, not the raw page text | illustrations match the scene, not just the sentence |
| 8.3 | **Character consistency — description** — bake a detailed character-reference description (from the MAIN hero) into every image prompt where the child/hero appears | the character is described consistently across pages |
| 8.4 | **Character consistency — reference image** — pass the MAIN hero portrait to the illustrator as an inline (base64) reference, downscaled to fit the ~6 MB request limit | same recognizable character across illustrations |
| 8.5 | **Illustration quality control (`qwen3-vl-flash`)** — VL-check the finished illustrations for consistency/quality and regenerate outliers | inconsistent pages are detected and re-generated |
| 8.6 | **Page layout variants** — per-page layout (image-only / ⅔ image + ⅓ text / text-only) chosen by the model, rendered in the reader and the PDF | a book shows varied page layouts on screen and in PDF |
| 8.7 | **Russify the heroes page** — translate `/children/[id]/heroes` to Russian and bring it to the design system | no English UI strings remain |
| 8.8 | **Error handling & recovery** — a stage failure sets `FAILED` with the last stage; safe retry / re-run; partial-failure handling; no stuck `PROCESSING` | failures are recoverable |
| 8.9 | **Progress accuracy** — `stage`/`progress` reflect real work and are non-decreasing | poller shows truthful progress |
| 8.10 | **Observability** — per-stage and per-AI-call logging/metrics to aid debugging | failures are diagnosable from logs |

---

## Phase 9 — Generation v2 (quality)

Rebuild the book pipeline for quality (current output is unusable: characters don't
match the data, heroes drift, the story is incoherent, images and plot are
disconnected — e.g. a 3-year-old boy named «Лев» is drawn as a lion). Child + hero
data drive the prompts; **style is chosen before heroes**; per-theme story templates;
a deterministic final-prompt assembler; chained multi-image illustration on a
consistency-capable model; and a persisted generation log so stages aren't lost. All
generation stays provider-agnostic via abstractions (`TextGenerator` /
`ImageGenerator` / `ConsistencyChecker` + an `ImageCaptioner` VL wrapper), with
swappable implementations selected through `AppSettings` (Qwen / wan / qwen-edit now;
ChatGPT / NanoBanana later). Prompt content (styles / themes / scaffolds) is authored
separately by the product owner — this phase builds the tables + assembly mechanism
and leaves the prompt fields to fill. The generated story is saved as a reusable
`BookTemplateHistory` alongside the concrete `Book` (template catalog deferred).

| # | Task | Verification |
|---|------|-------------|
| 9.1 | **Probe image models** — live-probe `wan2.7-image-pro` and `qwen-image-edit-plus-2025-12-15` (multi-image input, request/response shape, limits, price); pick the default. Both behind `ImageGenerator`, selected via `AppSettings` | both respond; chosen model returns an image from ≥2 reference images |
| 9.2 | **Data model** — migrations (`StyleTemplate`, `PageLayoutTemplate`, `BookGeneration`, `BookGenerationLog`, `BookTemplateHistory`); extend `Hero` (`imageCaption?`, `personality?`); reuse `Template` as story themes + a `custom` base; placeholder seeds (prompts authored later) | `migrate` + `generate` clean; seeds present |
| 9.3 | **Child profile + disambiguation** — age/gender reach the prompts; rule “{{child}} is a human boy/girl aged N, not an animal” | «Лев» renders as a boy; prompts carry species/gender/age |
| 9.4 | **Hero generation in the chosen style** — style chosen before heroes; MAIN from child data; companions with optional description, else a fixed образ; generate image + save the description (+ optional VL caption via the wrapper) | hero generated in the chosen style, description saved |
| 9.5 | **Final-prompt assembler** — deterministic build (child + profile + heroes + theme + style + requirements) → JSON story; `PageLayoutTemplate` drives per-page layout and which heroes appear | assembled prompt carries all blocks; story splits into N paragraphs per the template |
| 9.6 | **Orchestration + log** — `BookGeneration` + `BookGenerationLog`, no lost stages; on success `BookTemplateHistory` + `Book` created together | log carries every step; a failure shows where; book + history created |
| 9.7 | **Chained illustration** — new model: heroes (descriptions + images) + short plot + previous page; VL QC | character recognizable across pages, consistent style |
| 9.8 | **Wizard v2** — order: child → style → heroes → theme → generate | end-to-end passes, the book opens in the reader |

---

## Phase 10 — Real Coin Purchases (Stripe)

Replaces the wallet stub-credit with real money → coins. Deferred until the product
is usable (after Phase 9).

| # | Task | Verification |
|---|------|-------------|
| 10.1 | Stripe products/prices for coin packages, mapped to `PriceItem` `PACK_*` keys | Prices exist in Stripe dashboard |
| 10.2 | Checkout session for a coin package | Redirect to Stripe works |
| 10.3 | Stripe webhook — credit `balance` + log `CoinTransaction` on payment success (idempotent) | Duplicate webhook does not double-credit |
| 10.4 | Wallet "buy" wired to Stripe checkout (replaces 6.21 stub credit) | Real purchase credits coins end-to-end |

---

## Phase 11 — Optional / Later

- Ratings system on books (`Rating` model reserved)
- Referral program — earn coins for invites (`Referral` model reserved)
- Earn coins via promos / sponsor gifts
- Template marketplace — sell curated templates for coins
- Mobile app (App Store + Play Market)
- Add production-scale image providers (OpenAI DALL-E 3, Stability AI) selectable via `AppSettings`
- `StoryPreset` reuse library — save curated slot-based books, re-personalize by swapping name/photo/character slots (regenerates only `featuresChild` panels)

---

## Future Improvements — Generation

Richer generation features to revisit once the core pipeline (Phase 9) is solid and
budget allows. (The character profile and photo analysis are folded into Phase 9; the
rest stay deferred.)

- **Photo analysis (`qwen3-vl-flash`)** — full extraction of the child's appearance from a photo to feed hero generation (Phase 9 ships the optional VL-caption wrapper; deeper analysis later).
- **Dialogue stage (`qwen-flash-character`)** — per-page natural dialogue generated separately from the narrative (Phase 9 folds light dialogue into the story prompt instead).
- **Character variant selection** — generate 2-3 character references and let the user pick / regenerate.
- **Generation caching** — cache character reference and profile per child; cache prompts.
- **A/B style testing** — experiment with illustration styles and prompt variants.
- **Per-model usage + cost counters** — track call counts and price per model to compute the economics / pricing (set up after the v2 pipeline stabilizes; informs the model abstraction).

---

## Tech Debt / Deferred

Items intentionally postponed — revisit when the trigger applies.

| Item | Action | Trigger |
|---|---|---|
| Enable Qwen review PR gate | Uncomment `pull_request` in `.github/workflows/qwen-review.yml`, add `QWEN_API_KEY` to GitHub Secrets, and switch the diff base to `${{ github.event.pull_request.base.sha }}` | When we start opening PRs |
| pg concurrent-query deprecation | `main.ts` filters one benign pg DeprecationWarning (`client is already executing a query`) emitted by Prisma 7's `@prisma/adapter-pg` parallelizing sub-queries on a single connection. Remove the filter once the adapter serializes its IO (or Prisma fixes it) | When `@prisma/adapter-pg` / `prisma` is upgraded |
