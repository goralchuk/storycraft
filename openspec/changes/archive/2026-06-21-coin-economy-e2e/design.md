## Context

The coin economy spans `CoinService` (atomic credit/debit + ledger), `BooksService`
(book-type debit at draft, page-tier surcharge at submit), `HeroesService`
(companion/top-up debits), `PricingService` (catalog + admin update), and the
generation worker (hero-counter reset on completion, surcharge refund on failure).
AI text/image are abstract DI tokens (`TextGenerator`/`ImageGenerator`), as are
`PdfService` and `StorageService` — all overridable in a Nest `TestingModule`.
`AuthUser = { id, email }`; services key off `email`. The worker is a BullMQ
`@Processor`; its `process()` can be called directly.

## Goals / Non-Goals

**Goals:**
- A canonical scenarios/business-logic doc to develop against.
- A repeatable integration test of the coin flow: no token spend, no DB wipe,
  dev-only.

**Non-Goals:**
- HTTP/JWT-level e2e (drive services directly — simpler, still real integration).
- Real AI/MinIO; testing the generation *content* (that is Phase 8).
- Production test execution.

## Decisions

- **Service-layer integration.** Build the module from `AppModule` and override
  `TextGenerator`, `ImageGenerator`, `PdfService`, `StorageService` with fast fakes,
  and `TasksService.enqueueBookGeneration` with a no-op. Drive `BooksService` /
  `HeroesService` / `CoinService` / `PricingService` with a synthesized `AuthUser`;
  invoke `BookGenerationProcessor.process()` directly for completion / failure.
- **No token spend / no network.** The fakes return canned text, a placeholder image
  ref, an empty PDF buffer, and pass-through storage keys — nothing leaves the process.
- **No DB wipe.** The test creates one unique user (`inttest-<ts>@storycraft.test`,
  seeded with enough balance) and in `afterAll` deletes **only** that user (cascade)
  and restores any `PriceItem` amount it changed. It never truncates or resets.
- **Dev-only.** New `test/jest-int.json` (`testRegex: .int-spec.ts$`) and a
  `test:int` script (`--runInBand`, since the spec shares ordered DB state). `test/`
  is excluded from `nest build`, so integration tests cannot run in production.
- **Idempotent job-claim (fix).** Replace the worker's unconditional initial
  `PROCESSING` update with an atomic `updateMany` guard `status = PENDING → PROCESSING`;
  if it claims nothing, return early. This stops a re-run on a terminal book from
  resurrecting it and refunding the surcharge twice — making the 7.3 refund truly
  once-per-submission and letting the test assert it.

## Risks / Trade-offs

- [Mutating shared `PriceItem` in the price-change test] → capture the original amount
  and restore it in `afterAll`; reads use `priceOf` (DB) so the change is observable.
- [Requires Postgres + Redis up] → the app boots BullMQ/Redis and uses the real DB;
  documented in `docs/running.md`. MinIO and AI are not needed (overridden).
- [Ordered, shared-state spec] → run with `--runInBand`; each step asserts the exact
  balance and the latest ledger entry.

## Open Questions

- None blocking.
