# Phase 9.2 — Soft-delete convention

Result of ROADMAP task 9.2. Code no longer hard-deletes user-facing or generated
records — a deletion sets a `deletedAt` timestamp and keeps the row; physical
deletion is manual only. OpenSpec change: `soft-delete-convention` (new capability
`data-retention`).

## Why

Heroes, books, illustrations and the upcoming generation history are expensive and
reusable. An accidental or impulsive user delete (or a failed-charge rollback) must
not destroy data.

## What changed

- **Schema**: `deletedAt DateTime?` on `Hero`, `Child`, `Book`, `BookPage`,
  `Illustration` (migration `soft_delete`).
- **User deletes are soft**: `heroes.remove` and `children.remove` set `deletedAt`
  (children no longer need the FK-conflict guard).
- **Reads exclude soft-deleted**: `heroes`/`children`/`books` list & read queries
  filter `deletedAt: null`; `getOne` returns only live pages + illustrations;
  soft-deleted heroes don't count toward `MAX_HEROES`.
- **Rollbacks soft-delete**: `createDraft` / `addCompanion`, on a failed coin charge,
  soft-delete the just-created row instead of `.delete()`. (This avoids nesting an
  interactive transaction inside `coin.debit`'s own transaction, and keeps the
  `CoinTransaction.bookId` link.)
- **Page re-gen updates in place**: the worker upserts pages by `(bookId, pageNum)`,
  soft-deletes a page's prior illustration before creating the new one, and
  soft-deletes any stale pages beyond the new count — replacing `bookPage.deleteMany`.

## Verification

- Integration tests (2 new, 12 total green):
  - removing a hero hides it from the list and from the limit count, while the row
    is retained in the DB with `deletedAt` set;
  - regenerating a book reuses the same page rows in place (16 → 16, same ids), with
    no duplicates and no hard delete.
- `npm run build` + `npm run test:int` green.

## Scope notes

- Each entity filters its **own** `deletedAt`. Deep cascade-hiding (a soft-deleted
  child also hiding its books) is intentionally out of scope for now.
- Test-suite cleanup still hard-deletes its own test user — test-only, equivalent to
  a manual operator delete.
- A future throwaway "scratch" store for draft generation (ROADMAP → Future
  Improvements) would remove most regen churn from Postgres entirely.
