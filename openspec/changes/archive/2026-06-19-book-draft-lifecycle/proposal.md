## Why

In the prototype flow, paying for a book and creating it are separate moments: the user picks a book type at wizard step 1, **coins are debited immediately**, and a book is created in a `DRAFT` state the user can leave and resume later from the dashboard — without being charged twice. Today `POST /books` does the opposite: it creates and enqueues a book in one shot and charges nothing. This change introduces the DRAFT lifecycle (ROADMAP 6.7) so payment, configuration, and generation become distinct, resumable steps backed by the coin economy.

## What Changes

- **DRAFT book state** — add `DRAFT` to `BookStatus`; a `bookType` (`UNIQUE | TEMPLATE`) on `Book`; make `Book.childId` and `Book.templateId` nullable (child is chosen at step 2, template only applies to `TEMPLATE` books). **BREAKING**: schema columns become nullable; the eager `POST /books` create-and-enqueue path is removed.
- **Pay-at-config** — `POST /books/draft { bookType, templateId? }` debits the book-type cost (`BOOK_UNIQUE` 500 / `BOOK_TEMPLATE` 300) via `CoinService` using `PriceItem` amounts, creates the `DRAFT`, and logs a `CoinTransaction` tagged with the book id. Exactly one active draft per user — a second call returns the existing draft instead of charging again.
- **Resume** — `GET /books/draft` returns the user's current draft (drives the dashboard "Continue draft" banner and restores step 2). `GET /books` excludes drafts.
- **Configure** — `PATCH /books/:id` updates draft config fields (`childId, topicId, pageCount, promptText, writingStyle, fear, photoUrl`); allowed only while `DRAFT`; never charges.
- **Submit** — `POST /books/:id/submit` validates required fields (child set), transitions `DRAFT → PENDING`, and enqueues generation. Never re-charges.
- **Not-re-charged guarantee** — coins are debited exactly once, at draft creation; resume/patch/submit never debit the book-type cost again.
- **Frontend (minimal, temporary styling)** — `/books/new` gains a step 1 (type + template) that creates the draft, then the existing config form PATCHes it and submit finalizes; the dashboard shows a "Continue draft" banner when a draft exists.

## Capabilities

### New Capabilities
- `book-lifecycle`: The book state machine from paid `DRAFT` through `PENDING` generation — draft creation with coin payment, single-active-draft, resume, configure-while-draft, and submit-to-generate.

### Modified Capabilities
<!-- No existing book capability spec in openspec/specs/. coin-wallet and pricing-catalog are consumed, not modified. -->

## Impact

- **Backend (NestJS + Prisma/Postgres)**: `BookStatus` + new `BookType` enum, nullable `childId`/`templateId`, `Book.bookType`; a migration. `BooksModule` imports `CoinModule`; `BooksService` gains `createDraft`, `getDraft`, `updateDraft`, `submit`; `BooksController` gains `POST /books/draft`, `GET /books/draft`, `PATCH /books/:id`, `POST /books/:id/submit`; removes eager `POST /books`. Documented in `docs/API.md`.
- **Frontend (Next.js App Router)**: `/books/new` step-1 type picker + server actions (`createDraftAction`, `updateDraftAction`, `submitBookAction`) replacing `createBookAction`; dashboard draft banner reading `GET /books/draft`.
- **Consumers**: page-tier surcharges (6.10), heroes (6.8–6.9), generation stages (6.11), and the full wizard/dashboard redesign (6.13–6.19) build on this draft and its config fields.
- **Out of scope**: page-tier pricing, heroes, generation-stage UI, visual redesign, and the wallet screen (insufficient-coins already returns the 402-style error for a later wallet redirect).
