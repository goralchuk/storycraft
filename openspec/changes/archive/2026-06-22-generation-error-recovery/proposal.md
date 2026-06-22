## Why

Generation failures and crashes are not gracefully recoverable today: a failed book
auto-refunds the page-tier surcharge (7.3) with no way to retry, and a book orphaned
in `PROCESSING` (worker crash/restart) is stuck forever (the claim only takes
`PENDING`). We want failures to be recoverable — the user retries for free, and the
refund happens only if they give up — and no book should ever be stuck.

## What Changes

- **Failure no longer auto-refunds.** Generation failure sets `FAILED` (keeping the
  last stage) and leaves coins as-is.
- **Free retry.** `POST /books/:id/retry` resets a `FAILED` book to `PENDING`
  (stage cleared, progress 0) and re-enqueues it — no charge (the user already paid).
- **Decline → refund.** `POST /books/:id/cancel` refunds the page-tier surcharge
  (at most once) and moves the book to a new terminal status `CANCELLED`.
- **No stuck `PROCESSING`.** On worker startup, books orphaned in `PROCESSING` are
  reset to `PENDING` and re-enqueued so they resume.
- **Frontend.** The `FAILED` book screen offers «Попробовать снова» (retry) and
  «Вернуть монеты» (decline → refund); `CANCELLED` shows a refunded terminal state.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `page-pricing`: the page-tier surcharge is refunded **on user decline of a failed book**, not automatically on failure.
- `book-lifecycle`: add `FAILED` retry, decline→refund with terminal `CANCELLED`, and startup recovery of orphaned `PROCESSING`.
- `generation-progress`: failure no longer auto-refunds; a retry resets a `FAILED` book to `PENDING`.

## Impact

- **DB**: `BookStatus` gains `CANCELLED` (migration).
- **Backend**: processor `failAndRefund` → fail-only; startup requeue (OnModuleInit); `BooksService` + controller `retry` / `cancel`; coin refund moves to `cancel`.
- **Frontend**: `books/[id]` FAILED actions + CANCELLED state.
- **Behavior**: failed books retain coins until the user retries (free) or declines (refund).
