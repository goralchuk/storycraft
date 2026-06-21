## 1. Refund on failure (7.3)

- [x] 1.1 `TasksModule`: import `CoinModule`; inject `CoinService` into `BookGenerationProcessor`
- [x] 1.2 Add a `failAndRefund(book)` helper: guarded transition `PENDING|PROCESSING → FAILED` via `updateMany`; on `count === 1` and a surcharged tier, `credit` the page-tier amount back (label `Refund: pages N`, bookId-linked)
- [x] 1.3 Use `failAndRefund` in both failure paths (the `!child` guard and the `catch`), replacing the bare `FAILED` updates; keep `throw err` after refund in the catch

## 2. Verify

- [x] 2.1 Backend `npm run build` clean
- [x] 2.2 Manual: submit a 20-page book, force a generation failure → balance regains `PAGE_20`, a `Refund: pages 20` `CoinTransaction` is logged, book is `FAILED`; a 12-page failure refunds nothing
- [x] 2.3 Update `docs/phase-7-coin-data-model.md` (or a short `docs/phase-7-coin-rules.md`) noting the refund rule and the audit-confirmed rules
