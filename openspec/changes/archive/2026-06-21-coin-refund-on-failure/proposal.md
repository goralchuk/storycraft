## Why

The page-tier surcharge (`PAGE_16/20/24`) is debited at submit — i.e. when
generation starts — but if generation fails, the worker only flips the book to
`FAILED`. The user keeps a debit for pages they never received, and a `FAILED`
book can't be re-submitted (submit requires `DRAFT`), so the surcharge is simply
lost. Phase 7.3 closes the coin rules by refunding it.

The 7.3 audit found the rest of the coin rules already hold: every charge/credit
flows through `CoinService` and writes a `CoinTransaction` (book type, page tier,
companion, top-up, package purchase); hero free-attempt counters reset to 3 on
book completion; and insufficient funds consistently returns 402. So this change
is just the missing refund.

## What Changes

- **Refund the page-tier surcharge on generation failure.** In the generation
  worker's failure paths, atomically transition the book `PENDING|PROCESSING →
  FAILED` and — only when that transition actually happens — credit the page-tier
  surcharge back via `CoinService.credit`, with a `CoinTransaction` referencing the
  book. The guard makes the refund happen **at most once per failed run** (a re-run
  or repeat failure of an already-terminal book does not refund again). Tier 12 has
  no surcharge and nothing to refund.
- **Book-type cost is not refunded** — the attempt consumed it; retry/recovery of a
  failed book is Phase 8 (generation hardening).

## Capabilities

### Modified Capabilities
- `page-pricing`: add the page-tier surcharge refund-on-failure requirement.

## Impact

- **Backend**: `book-generation.processor.ts` — replace the two `FAILED` updates with
  a guarded fail-and-refund helper; inject `CoinService` (import `CoinModule` into
  `TasksModule`). No schema change.
- **Coins**: a failed paid generation now leaves the user whole except for the
  book-type cost.
- **Scope boundary**: tunable pricing is 7.4; full coin E2E is 7.5; failed-book
  retry/recovery is Phase 8; payments are Phase 9.
