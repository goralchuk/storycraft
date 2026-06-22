# Phase 8.8 — Error handling & recovery

Result of ROADMAP task 8.8. Generation failures are now recoverable and no book can
be stuck. OpenSpec change: `generation-error-recovery` (modifies `page-pricing`,
`book-lifecycle`, `generation-progress`).

## New failure / refund model

Per the agreed decision, the page-tier surcharge refund moved off automatic
failure and onto an explicit user decline:

- **Failure** → book is `FAILED` (last stage kept), **coins untouched**.
- **Retry** (`POST /books/:id/retry`) → `FAILED → PENDING`, re-enqueue, **free**
  (the user already paid). Guarded so only a `FAILED` book is affected.
- **Decline** (`POST /books/:id/cancel`) → `FAILED → CANCELLED` (new terminal
  status) and the page-tier surcharge is **refunded once** (guaranteed by the
  guarded transition). Tier 12 has nothing to refund.

## No stuck PROCESSING

On worker startup (`OnModuleInit`), any book left in `PROCESSING` by a crash/restart
is reset to `PENDING` (stage/progress cleared) and re-enqueued, so it resumes. The
idempotent `PENDING` claim makes a duplicate enqueue harmless.

## Changes

- **DB**: `BookStatus += CANCELLED` (migration `book_status_cancelled`).
- **Worker**: `failAndRefund` → `markFailed` (no coin movement); removed the now-unused
  CoinService + tier map from the processor; added startup requeue.
- **Backend**: `BooksService.retry` / `cancel` + `POST /books/:id/retry|cancel`; the
  dashboard list excludes `CANCELLED`.
- **Frontend**: the FAILED book screen offers «Попробовать снова» and «Вернуть
  монеты»; `CANCELLED` shows a refunded terminal state.

## Verification

- Integration test (updated): failure keeps coins (no refund); retry returns the book
  to `PENDING` free; decline moves it to `CANCELLED` and refunds once (and not again);
  tier-12 decline refunds nothing. 9 tests green.
- Live: an orphaned `PROCESSING` book was requeued on startup
  (`Requeued 1 orphaned PROCESSING book(s)`) and recovered to `FAILED` (no AI cost).
- Backend build + frontend `tsc --noEmit` clean.

## Notes

- A silently-abandoned `FAILED` book keeps its surcharge until the user retries or
  declines — by design (refund only on decline).
- Startup requeue resets **all** `PROCESSING` on boot; correct for the current
  single-worker setup. With multiple workers this should be gated on a stale
  `updatedAt` to avoid resetting in-flight jobs.
