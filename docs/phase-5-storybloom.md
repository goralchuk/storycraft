# Phase 5 — StoryBloom: Data, API & Generation

## Overview

Implements the StoryBloom spec (`draft/storybloom_spec.md`): topic/age-based templates, the guided creation form, child photos, DB-configurable AI models, and reuse-ready story storage.

**Status: Phase 5 complete (5.1–5.11).** Data model & seed (5.1), domain API (5.2), settings API (5.3), task queue (5.4), AI contracts + stub + worker (5.5), Gemini text generator (5.6), image generator — stub-only, photo-driven (5.7), runtime text-provider injection (5.8), PDF worker + slot resolution (5.9), MinIO storage + photo upload (5.10), status lifecycle (5.11). Frontend create flow / preview / PDF download live in Phase 6 (Frontend Polish).

Key decisions driving the phase:
- AI model selection lives in the DB (`AppSettings` singleton), not env vars. API keys stay in env.
- Stories are stored **slot-based** (`Book.slots`, e.g. `{{child}}`) so saved books can later be re-personalized with zero text-model cost.
- Illustrations carry `featuresChild` so future reuse regenerates only child-facing panels.
- Topics are DB-seeded; writing styles are a fixed enum.
- `StoryPreset` reuse library is **not** built yet — `slots` + `featuresChild` are the hooks that make it cheap to add later.

---

## Project Structure Added

```
backend/
├── prisma/
│   ├── schema.prisma                 # +2 enums, 4 extended models, 2 new models
│   ├── seed.ts                       # Idempotent seed (topics, templates, settings)
│   └── migrations/
│       └── 20260604134057_stage_a_storybloom_models/
├── prisma.config.ts                  # migrations.seed wired
└── src/
    ├── topics/
    │   ├── topics.module.ts
    │   ├── topics.controller.ts      # GET /topics, /topics/:id
    │   └── topics.service.ts
    ├── settings/
    │   ├── settings.module.ts
    │   ├── settings.controller.ts    # GET/PATCH /settings
    │   └── settings.service.ts
    ├── tasks/
    │   ├── tasks.module.ts           # Registers queue + processor, imports Ai/PdfModule
    │   ├── tasks.service.ts          # enqueueBookGeneration(bookId)
    │   ├── tasks.constants.ts        # Queue name + job payload type
    │   └── book-generation.processor.ts  # Text→images→PDF; persists pages/slots/pdfUrl
    ├── pdf/
    │   ├── pdf.module.ts
    │   ├── pdf.service.ts            # pdfkit: cover + page-per-spread, embeds images
    │   └── slots.ts                  # resolveSlots() — {{token}} → value
    ├── storage/
    │   ├── storage.module.ts
    │   ├── storage.service.ts        # MinIO upload + presigned URL + toUrl()
    │   └── storage.controller.ts     # POST /uploads/photo (multipart)
    └── ai/
        ├── ai.module.ts             # Dispatching text binding + stub image binding
        ├── contracts.ts            # TextGenerator + ImageGenerator + shared types
        ├── stub.generators.ts      # Stub text (slot-tokenized) + stub image (photo-aware)
        ├── gemini-text.generator.ts  # Real text via Gemini OpenAI-compatible API
        └── dispatching-text.generator.ts  # Picks text impl from AppSettings.textProvider
```

Edited: `templates.{service,controller}.ts` (filtering), `children.{service,controller}.ts` (`photoUrl`), `books.{service,controller}.ts` (extended DTO + `topic` includes), `books.{module,service}.ts` (enqueue on create), `settings.module.ts` (export `SettingsService`), `config/env.schema.ts` + `.env.example` (optional `GEMINI_API_KEY`), `app.module.ts` (register `TopicsModule`, `SettingsModule`).

---

## 5.1 — Data Model & Seed

Migration `20260604134057_stage_a_storybloom_models` — fully additive (no data loss).

### Enums
- `TemplateCategory` — `FANTASY · ADVENTURE · NATURE · SCIENCE · FRIENDSHIP · ANIMALS`
- `WritingStyle` — `WATERCOLOR · ADVENTURE · FUNNY · GENTLE`

### Extended models
| Model | Added fields |
|---|---|
| `Template` | `icon, category, ageRange, availablePages[], defaultTone, badge, coverColor, tags (Json)` |
| `Book` | `topicId (→ Topic), title, pageCount, promptText, writingStyle, fear, photoUrl, slots (Json)` |
| `Child` | `photoUrl` |
| `Illustration` | `featuresChild (default false)` |

`Book → Topic` FK is `ON DELETE SET NULL` — deleting a topic never orphans books.

### New models
| Model | Purpose |
|---|---|
| `Topic` | `icon, label, prompts[], isActive` — fear/life-moment tiles with suggested prompts |
| `AppSettings` | Singleton (`id = "singleton"`): `textProvider, textModel, imageProvider, imageModel`. Defaults: `stub / gpt-4o-mini / stub / dall-e-3` |

### Seed
`prisma/seed.ts`, wired via `prisma.config.ts → migrations.seed`, run with `npx prisma db seed`. All upserts → **idempotent**; reseeding does not clobber admin-changed `AppSettings`.
- 7 topics (spec set, stable string ids), 6 templates (one per category, stable `tpl-*` ids), 1 `AppSettings` row.

> Prisma 7 gotcha: `migrate dev` did **not** refresh generated client types — run `npx prisma generate` explicitly after a migration before using new models.

---

## 5.2 — Domain API

Follows existing conventions — inline-type DTOs, no `ValidationPipe`, `JwtAuthGuard` + `CurrentUser`.

### Topics
- `GET /topics` — active topics ordered by creation.
- `GET /topics/:id` — single topic; `404` if missing. (Mirrors `TemplatesModule`.)

### Template filtering
- `GET /templates?category=&age=` — `category` validated against `TemplateCategory` (`400` on unknown); `age` is exact-match on `ageRange` (range-aware matching is a later refinement).

### Children — questionnaire expansion
- `photoUrl` added to create/update DTOs.

### Books — extended creation
- DTO gains `topicId, pageCount, promptText, writingStyle, fear, photoUrl`.
- **Photo fallback:** `photoUrl = dto.photoUrl ?? child.photoUrl` — implements "take the photo from the child's data *or* upload at generation time."
- `topic` connected only when `topicId` supplied; `GET`/`POST` responses include `template`, `child`, `topic`.

---

## 5.3 — Settings API

- `GET /settings` / `PATCH /settings` over the `AppSettings` singleton.
- Both **upsert** the `singleton` row, so it exists even before the seed runs; `PATCH` leaves unspecified fields untouched.
- Currently auth-only, **not** admin-restricted — there is no role on `User` yet (follow-up).

---

## 5.4 — Task Queue

`TasksModule` registers a single BullMQ queue (`book-generation`) via `BullModule.registerQueue`, reusing the global Redis connection already configured in `app.module.ts`.

- `TasksService.enqueueBookGeneration(bookId)` adds a `generate` job carrying `{ bookId }`.
- `BooksModule` imports `TasksModule`; `BooksService.create` enqueues the job **after** the book row is committed, then returns the book.
- No processor yet — jobs sit in the queue until the worker lands in **5.5**. Job payload/queue name are centralised in `tasks.constants.ts` so the worker can import the same contract.

> `Book.status` transitions are **not** part of this task — they land in 5.11. 5.4 is enqueue-only. (The granular `Task` table is left unused: the single-job worker tracks state on `Book.status` instead.)

---

## 5.5 — AI Contracts, Stub & Worker

Establishes the generation contracts and a working end-to-end pipeline backed by stubs.

### `AiModule`
- Two abstract classes are the DI tokens: **`TextGenerator`** (`generateText(StoryContext)`) and **`ImageGenerator`** (`generateImage(ImageContext)`) — split so text and image providers can be chosen independently (5.8). _(Introduced as a single `AiService` in 5.5, split into the two contracts in 5.6.)_
- `StubTextGenerator` returns hardcoded **slot-tokenized** text (`{{child}}`, `{{friend}}`); `StubImageGenerator` returns a placeholder URL — exercises the slot path with zero external cost.
- Module binds both contracts to the stubs by default and exports them.

### `BookGenerationProcessor`
- `@Processor('book-generation')` extending `WorkerHost`; injects `PrismaService` + `TextGenerator` + `ImageGenerator`.
- Loads the book (`child`, `template`, `topic`), calls `generateText`, then per page calls `generateImage` (passing `featuresChild` + the book's `photoUrl`).
- Persists each `BookPage` with its `Illustration` (carrying `featuresChild`), and writes `Book.title` + `Book.slots`.
- **Idempotent re-runs:** deletes existing pages first (cascades to illustrations) before regenerating.
- Registered in `TasksModule` (which now imports `AiModule`).

> Page text is stored **tokenized**; `Book.slots` holds the token→value map. Read-time/PDF resolution is owned by 5.9 (PDF) — an API read-time resolver is a noted follow-up. `Book.status` transitions remain deferred to 5.11.

---

## 5.6 — Text Generator (Gemini, slot-aware)

Real text generation behind the `TextGenerator` contract, using a budget-friendly provider.

- **Provider:** Google **Gemini** via its **OpenAI-compatible** endpoint (`/v1beta/openai/chat/completions`), called with native `fetch` — **no new npm dependency**. The same client shape works for OpenAI/Groq/Together/OpenRouter, so future swaps are just base-URL + key + model.
- **Config split:** model id read from `AppSettings.textModel` (DB); API key from optional `GEMINI_API_KEY` (env, secret). Missing key → `503 ServiceUnavailable` (never a boot failure — the key is only touched per-call).
- **Prompt → JSON:** requests `response_format: json_object`; the prompt forbids writing the real name, mandates `{{child}}`/`{{friend}}`(+invented) tokens, and the exact `{ title, slots, pages[] }` shape with `pageCount` pages.
- **Parsing hardening:** strips stray ````json ```` fences, validates shape, coerces `pageNum`/`featuresChild`, and **forces `slots.child = childName`** regardless of model compliance.
- **Not wired as default yet:** `AiModule` still binds `TextGenerator → StubTextGenerator`; `GeminiTextGenerator` is registered and ready for **5.8** to select via `AppSettings.textProvider`. Images stay on the stub (free) per current plan.

> Image generator is 5.7; runtime provider switching is 5.8. Until 5.8, generation runs on the stub regardless of `AppSettings.textProvider`.

---

## 5.7 — Image Generator (stub-only)

Per the cost decision, image generation stays on the **stub until launch** — no external image API is wired (the only realistic free image *API* is Google AI Studio; revisit post-launch). What 5.7 completes is the **photo-driven behaviour** behind the `ImageGenerator` contract.

- `StubImageGenerator` is now **photo-aware**: a child-facing panel (`featuresChild && photoUrl`) **echoes the child's photo** — standing in for a real provider conditioning on it — while scene panels (and child panels with no photo) get a static placeholder.
- The worker already (5.5) flags each `Illustration.featuresChild` per page and passes the book's `photoUrl` (child questionnaire photo or per-book override), so **no processor change** was needed.
- Returns one image URL per illustration; child-facing panels are flagged in the DB → the hooks for cheap future reuse (regenerate only child-facing panels) are in place.

> Reading image provider/model from `AppSettings` belongs to the real generator (deferred post-launch). 5.8's runtime selection therefore leaves images bound to the stub for now.

---

## 5.8 — Runtime Provider Injection

Provider selection moves from a static binding to a **per-call lookup of `AppSettings`** — no redeploy, no env change to switch.

- `DispatchingTextGenerator` is bound to the `TextGenerator` token. On each `generateText` it reads `AppSettings.textProvider` and delegates: `gemini` → `GeminiTextGenerator`, anything else (incl. `stub`) → `StubTextGenerator`. Unknown values fall back to the stub (safe by default).
- The worker is **unchanged** — it still injects `TextGenerator`; the dispatcher is transparent.
- **To go live on text:** `PATCH /settings { "textProvider": "gemini", "textModel": "gemini-2.0-flash" }` + set `GEMINI_API_KEY` in env. Switch back with `textProvider: "stub"` — both paths work.
- **Images:** only the stub exists, so `ImageGenerator` stays bound directly to `StubImageGenerator`; `imageProvider` switching is a deliberate **no-op** until a real image provider is added post-launch (a mirror `DispatchingImageGenerator` slots in then).

> Model id is read from `AppSettings` (DB); API keys remain in env. This keeps secrets out of the DB while letting non-secret model/provider choices be changed at runtime.

---

## 5.9 — PDF Worker (slot resolution)

Turns the generated pages into a downloadable PDF, resolving slot tokens at assembly time.

- **`resolveSlots(text, slots)`** (`pdf/slots.ts`) replaces `{{token}}` with its value; unknown tokens are left intact so missing data is visible, not silently dropped.
- **`PdfService`** (pdfkit, no external service) builds a title cover then one page per spread: fetches each image URL → `Buffer` and embeds it (`fit` box), with the resolved page text below. Image fetch failures are caught and skipped so a bad/offline image never breaks the PDF.
- **Worker integration:** during the page loop the processor collects `{ resolvedText, imageUrl }`, then calls `PdfService.generate({ title: resolved, pages })`. **DB pages stay tokenized**; only the PDF gets resolved text — preserving the reuse model.
- **Interim output:** the PDF is written to `backend/storage/books/<bookId>.pdf` and `Book.pdfUrl` is set to that path. **5.10 swaps this** for a MinIO upload + signed URL. (`backend/storage/` is gitignored.)
- Dependency added: `pdfkit` (+ `@types/pdfkit`).

> Status transitions (`PROCESSING`/`DONE`/`FAILED`) are still 5.11; the worker currently runs straight through on success.

---

## 5.10 — Storage (MinIO) & Photo Upload

Replaces the interim local PDF path with object storage, and adds the binary photo-upload endpoint.

- **`StorageService`** (`minio` client, config from existing `MINIO_*` env): `upload(key, buffer, contentType)`, `getSignedUrl(key)` (7-day TTL), and `toUrl(value)` — signs storage keys, passes absolute `http(s)` URLs through unchanged. Bucket creation is **lazy** (first upload), so the app still boots without MinIO.
- **PDF storage:** the worker now uploads to `books/<bookId>.pdf` and stores the **object key** in `Book.pdfUrl` (local-disk write removed; `backend/storage/` gitignore entry reverted).
- **Read-time signing:** `GET /books/:id` resolves the book's `pdfUrl`, `photoUrl`, the child's `photoUrl`, and every illustration `imageUrl` via `toUrl` → signed URLs (stub/external URLs pass through). Stored keys stay un-expired in the DB; URLs are minted per request.
- **Photo upload:** `POST /uploads/photo` (multipart `file`, image-only, ≤5 MB) → uploads to `photos/<uuid><ext>` and returns `{ key, url }`. Store `key` as a child/book `photoUrl`; it resolves to a signed URL on read.
- Dependencies added: `minio` (+ `@types/multer`; multer already shipped with `@nestjs/platform-express`).

> "Images stored" today = the uploaded **photo** (a real image) + the PDF. Generated illustration images stay as stub/external URLs (images are stub-only until launch); when a real image provider lands it can persist via the same `StorageService.upload`.

---

## 5.11 — Status Lifecycle

Makes generation progress observable so the frontend can poll.

- A book is created `PENDING` (schema default). The worker sets **`PROCESSING`** on pickup, then **`DONE`** on success (in the same update that writes `title`/`slots`/`pdfUrl`).
- The whole generation body is wrapped in `try/catch`: on any failure the book is set **`FAILED`** and the error is **rethrown**, so BullMQ records the job as failed (and retries it if the queue is later configured with attempts). The idempotent page-reset makes retries safe.
- `status` is returned by both `GET /books` and `GET /books/:id`, so the frontend polls a book until it reaches `DONE`/`FAILED` (Phase 6.4).
- **No schema change.** The error reason is logged (not persisted); the granular `Task` table stays unused — state lives on `Book.status` for the single-job worker. Persisting a failure reason on the book is a possible later refinement.

This closes **Phase 5** — the full create → generate → store → poll pipeline runs end-to-end on the stub, with Gemini text available via settings.

---

## Verification Checklist

| Check | How | Expected |
|---|---|---|
| Schema valid | `prisma validate` | valid |
| Migration applies | `prisma migrate dev` | applied, DB in sync, additive SQL |
| Types compile | `tsc --noEmit` | exit 0 |
| Seed runs | `prisma db seed` | 7 topics, 6 templates, AppSettings |
| Unauthenticated guard | `GET /topics` without token | `401` |
| Topics | `GET /topics` | 7 topics |
| Template filter | `GET /templates?category=FANTASY` | 1 (`tpl-enchanted-forest`) |
| Bad category | `GET /templates?category=BOGUS` | `400` |
| Settings read/write | `GET` then `PATCH /settings` | singleton returned; update persists |
| Child photo | `POST /children` with `photoUrl` | persisted |
| Book photo fallback | `POST /books` without `photoUrl` | inherits child photo; topic/style/pages/fear persisted |
| Book photo override | `POST /books` with `photoUrl` | override applied |
| Book includes topic | `GET /books` | `topic` present |
| Job enqueued | `POST /books` with Redis up | a `generate` job appears on the `book-generation` queue |
| Worker end-to-end | `POST /books` with stack up | `GET /books/:id` returns `pageCount` pages, each with an illustration; ~half flagged `featuresChild` |
| Slots present | after generation | `Book.slots` = `{ child, friend }`; page text contains `{{child}}`/`{{friend}}` tokens; `title` set |
| Gemini text (live) | set `GEMINI_API_KEY` + `textModel=gemini-2.0-flash`, call `GeminiTextGenerator` | returns `{ title, slots, pages[] }`, `slots.child` = child name, page text uses `{{…}}` tokens |
| Missing key | call Gemini gen with no `GEMINI_API_KEY` | `503` (no boot failure) |
| Child-facing image | generate a book whose child has `photoUrl` | child-facing illustrations' `imageUrl` == the photo; scene panels use the placeholder |
| Provider switch (stub) | `textProvider=stub`, generate | pages use the stub's `{{child}}`/`{{friend}}` text |
| Provider switch (gemini) | `textProvider=gemini` + `GEMINI_API_KEY`, generate | pages come from Gemini; switching back to `stub` reverts — no redeploy |
| Unknown provider | `textProvider=foo`, generate | falls back to stub (no error) |
| Slot resolution | `resolveSlots('{{child}} & {{friend}} meet {{x}}', {child:'Emma',friend:'Max'})` | `Emma & Max meet {{x}}` ✓ (verified) |
| Valid PDF | `PdfService.generate()` on tokenized pages | buffer starts `%PDF-`, ends `%%EOF` ✓ (verified, 2.3 KB) |
| PDF persisted | full generation with stack up | object `books/<id>.pdf` in MinIO; `Book.pdfUrl` holds the key |
| toUrl routing | `toUrl(null)`, `toUrl('http://…')` | pass through unchanged ✓ (verified, no network) |
| Signed URLs on read | `GET /books/:id` with stack up | `pdfUrl` + uploaded `photoUrl`/`imageUrl` keys returned as signed URLs; external URLs unchanged |
| Photo upload | `POST /uploads/photo` (image ≤5 MB) | `201 { key, url }`; object stored under `photos/…` |
| Photo upload bad type | `POST /uploads/photo` non-image | `400` |
| Status: pending | `POST /books` | `status: PENDING` |
| Status: done | after worker finishes | `status: DONE`, `pdfUrl` set |
| Status: failed | force a generator error | `status: FAILED`; job marked failed in BullMQ |

---

## Known follow-ups

- `/settings` needs admin-only restriction once a role exists on `User`.
- Binary photo upload → MinIO is part of 5.10 (`StorageService`); photo fields currently accept URL strings.
- `age` template filtering is exact-match; range-aware matching deferred.
- API responses serve **tokenized** page text — a read-time slot resolver (or returning `slots` alongside) is a follow-up; PDF resolution is owned by 5.9.

---

## Code Review Tooling (added after 5.11)

A standalone third-party (Qwen) code-review harness was added alongside Phase 5 — independent of the app runtime:

- `scripts/review.mjs` + `review.config.json` — on-demand review over the branch diff (`main...HEAD`) via the OpenAI-compatible DashScope API. Model/provider live in the config; the API key stays in env (`QWEN_API_KEY`); findings are written to `reviews/<branch>.md`. Run locally via the `/qwen-review` command.
- `.github/workflows/qwen-review.yml` — an **inert CI stub**; the same script gates PRs once `pull_request` is enabled (see ROADMAP → Tech Debt).
- **First real run** was against the Phase 5 diff. It surfaced that `/settings` is open to any authenticated user (no role on `User`) — now tracked as RBAC hardening in **Phase 8** / Tech Debt.

---

## Next (beyond Phase 5)

- **Phase 6** — frontend flow & book preview: landing + CTA routing, create wizard, **HTML spreads**, **status polling (6.5)**, **PDF on demand** (PDF build moves out of the worker).
- **Phase 7** — characters & avatars: real Gemini image provider behind `ImageGenerator` (+ a mirror `DispatchingImageGenerator`), `Avatar` model (max 5/child), targeted regeneration of `featuresChild` panels.
- **Phase 8** — subscriptions & payments (Stripe).
- **Phase 9 / later** — `StoryPreset` reuse library (the `slots` + `featuresChild` hooks are already in place), ratings, referrals.
