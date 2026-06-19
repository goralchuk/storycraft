## Context

`BooksService.create` today connects a required `templateId` + `childId`, then immediately `tasks.enqueueBookGeneration`. There is no payment and no intermediate state. The coin-economy foundation is already in place: `CoinService.debit(userId, amount, label, bookId?)` is atomic and race-safe and throws `InsufficientCoinsException` (402); `priceOf(key)` resolves a `PriceItem` amount. Books are scoped to the user by `user: { email }`. The frontend create flow is a single flat form (`/books/new`) posting via `createBookAction`; the dashboard lists books.

This change splits create into pay → configure → submit, backed by a `DRAFT` state. It is a thin vertical slice: backend lifecycle plus the minimal UI to exercise it end-to-end (temporary styling — the polished wizard/dashboard come in 6.13–6.19).

## Goals / Non-Goals

**Goals:**
- A `DRAFT` book that is paid once, persists across sessions, and resumes without re-charging.
- One active draft per user; deterministic resume.
- Replace the eager `POST /books` with the draft flow; keep the app working end-to-end through the UI.

**Non-Goals:**
- Page-tier surcharges / full pricing wiring (6.10) — only the book-type cost is charged here.
- Heroes (6.8–6.9), generation-stage progress (6.11), wallet screen (6.21), and the visual redesign (6.13–6.19).
- Re-personalization / multiple concurrent drafts.

## Decisions

**Reuse `Book` with nullable `childId`/`templateId` rather than a separate Draft table.**
A draft *is* a book in an earlier state; the wizard fields map 1:1 to existing `Book` columns. Making `childId`/`templateId` nullable lets a draft exist before child selection and lets `UNIQUE` books have no template. Alternative considered: a dedicated `Draft` table copied into `Book` on submit — rejected as duplicate schema and an extra copy step for no benefit. `userId` stays required.

**`bookType` is an enum on `Book`.**
`UNIQUE | TEMPLATE` selects the price key (`BOOK_UNIQUE` / `BOOK_TEMPLATE`) and later (6.18) drives the "freeze all but main hero" behavior for template books. Storing it on the book keeps the cost and the rules with the artifact.

**Single active draft enforced in the service, not the schema.**
`createDraft` first looks up an existing `DRAFT` for the user and returns it (no debit) if found; otherwise it debits then creates. Rationale: avoids a partial-unique DB constraint (only one *DRAFT*, but many non-draft books) which Postgres expresses as a filtered unique index but Prisma models awkwardly; the service check is simpler and the read-then-write race is benign here (worst case two drafts; acceptable for a single-user wizard, and the GET returns the most recent).

**Debit-then-create ordering.**
`createDraft` calls `CoinService.debit` first; on success it creates the book and the debit transaction is already logged with… — note the ordering subtlety: `debit` writes the `CoinTransaction` before the book exists, so `bookId` cannot reference it at debit time. Resolution: create the `DRAFT` book first **without** charging, then `debit(..., bookId)` inside the same flow; if the debit throws (insufficient funds), the book creation is rolled back. Implement create+debit in one `prisma.$transaction` is not possible because `CoinService.debit` opens its own transaction; instead create the book, then debit in a try/catch that deletes the just-created draft on failure. This keeps the not-re-charged and no-orphan guarantees.

**Submit validates then transitions; generation is unchanged.**
`submit` checks status is `DRAFT` and `childId` is set, updates status to `PENDING`, and calls the existing `enqueueBookGeneration`. The worker is untouched.

**Remove the eager `POST /books`.**
Per minimalism, the old create path is deleted and the frontend rewired to draft → patch → submit. This avoids two divergent create flows.

## Risks / Trade-offs

- **Read-then-write race on single-draft** → Mitigation: acceptable for a single user driving one wizard; `getDraft` returns the latest `DRAFT`; a filtered unique index can be added later if needed.
- **Orphaned draft if book created but debit fails** → Mitigation: delete the draft in the catch before rethrowing the insufficient-funds error, so no unpaid draft persists.
- **Nullable `templateId`/`childId` touches existing reads** → Mitigation: `getOne`/`list` already include relations; ensure they tolerate null (list excludes drafts, and existing non-draft books keep both set). The generation worker only runs after submit, where `childId` is guaranteed.
- **Breaking `POST /books` removal** → Mitigation: the frontend is updated in the same slice; documented in API.md.

## Migration Plan

1. Prisma migration: add `DRAFT` to `BookStatus`, add `BookType` enum + `Book.bookType` (nullable or defaulted), make `Book.childId`/`Book.templateId` nullable. Existing rows keep their values; `bookType` backfills null/`UNIQUE` for legacy rows (not user-visible).
2. `prisma migrate dev`; no seed change.
3. Deploy backend + frontend together (the create flow changes). Rollback: revert migration (columns were widened to nullable + added enum value; reverting requires no data loss for existing books) and code.

## Open Questions

- Should `bookType` be non-nullable with a default of `UNIQUE`, or nullable? Proposing non-nullable defaulted to keep reads simple; confirm during implementation.
- Whether to hard-delete a draft on insufficient-funds rollback vs. never creating it first — see the debit-ordering decision; will finalize in code to guarantee no orphan and no double-charge.
