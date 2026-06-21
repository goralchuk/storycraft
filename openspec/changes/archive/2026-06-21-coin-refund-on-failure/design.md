## Context

`submit()` debits the page-tier surcharge (`PAGE_16/20/24`, label `Pages: N`,
bookId-linked) then sets the book `PENDING` and enqueues generation. The worker
(`BookGenerationProcessor`) sets `PROCESSING`, runs the four stages, and on any
error sets `FAILED` (no refund). The queue is added with no `attempts` config, so
BullMQ runs a single attempt; still, the refund must be safe under retries/re-runs.
`CoinService.credit(userId, amount, label, bookId?)` logs the transaction atomically.

## Goals / Non-Goals

**Goals:**
- Refund the page-tier surcharge exactly once when a paid generation fails.

**Non-Goals:**
- Refunding the book-type cost (Phase 8 retry covers the attempt).
- Re-submitting / recovering a `FAILED` book (Phase 8).
- Pricing tunability (7.4) or full E2E (7.5).

## Decisions

- **Idempotent refund via a guarded status transition.** Replace the worker's
  `book.update({ status: FAILED })` calls with an `updateMany` guarded on
  `status ∈ { PENDING, PROCESSING }`. Only when it flips exactly one row
  (`count === 1`) does the refund run. A repeat failure of an already-`FAILED` book
  flips nothing → no double refund; a fresh submit sets `PENDING` again, so a later
  failure can refund the new charge.
- **Helper `failAndRefund(book)`** used by both failure paths (the defensive
  `!child` guard and the `catch`). It performs the guarded transition, then for a
  surcharged tier resolves the amount via `CoinService.priceOf(PAGE_TIER_KEY[...])`
  and credits it with label `Refund: pages ${pageCount}` (bookId-linked).
- **Tier map in the worker.** A local `PAGE_TIER_KEY` (16/20/24 → key) mirrors the
  one in `books.service` (three entries; not worth a shared module yet).
- **Wiring.** Inject `CoinService` into the processor; `TasksModule` imports
  `CoinModule` (which exports `CoinService`).

## Risks / Trade-offs

- [Charge/refund key drift] → both maps are tiny and tier keys are stable; a comment
  cross-links them. Can be unified later if a third consumer appears.
- [Throw-after-refund in catch] → the refund runs before `throw err`, so BullMQ still
  records the failed job; the guard prevents a second refund if the job is retried.

## Open Questions

- None blocking.
