## Why

Phase 7 finished the coin schema (7.1–7.2), rules (7.3) and admin tuning (7.4).
7.5 proves the whole economy works end-to-end **before** any payment integration:
a written reference of the user scenarios / business logic to develop against, and
a repeatable integration test that exercises the coin flow without spending tokens
or wiping the database.

Writing the test surfaced one real gap: the generation worker sets `PROCESSING`
unconditionally at the start, so re-running a job on an already-`FAILED` book would
refund the page-tier surcharge a second time. We close that with an idempotent
job-claim.

## What Changes

- **Scenarios & business-logic doc** — `docs/SCENARIOS.md`, a living reference of the
  actors, the coin economy (charges / credits / refunds), and the main user journeys
  (onboarding, the 3-step wizard, generation, reader, wallet, children/heroes, admin
  pricing). We keep extending it as the product grows.
- **Integration test** — `backend/test/coin-economy.int-spec.ts`, run via a new
  `test:int` script (separate jest config). It drives the real services against the
  real dev DB with **stubbed** text/image/PDF/storage (no token spend, no network)
  and the queue disabled (the worker is invoked directly). It creates its own test
  user and **cleans up only that user** afterwards — it never drops or resets the DB.
  Coverage: starting balance, package purchase credit, book-type debit,
  companion/top-up debits, page-tier surcharge, completion (hero-counter reset),
  failure refund (+ tier-12 no-refund + refund-once), and an admin price change
  affecting the next charge.
- **Idempotent job-claim** — the worker claims a book only when it is `PENDING`
  (atomic `PENDING → PROCESSING`); a non-pending book is not reprocessed, so the
  refund happens at most once per submission.
- **Run docs** — `docs/running.md`: prerequisites and how to run the integration
  tests (and why they are dev-only).

## Capabilities

### Modified Capabilities
- `generation-progress`: add the idempotent job-claim requirement.

## Impact

- **Backend**: `book-generation.processor.ts` (claim guard); new `test/` integration
  spec + `test/jest-int.json` + `test:int` script. Tests live under `test/` and run
  only via dev scripts — they are not part of `build` / `start:prod`, so they never
  run in production.
- **Docs**: `docs/SCENARIOS.md`, `docs/running.md`.
- **No schema change.** No real AI calls; no DB reset — the test prunes only the
  test user it created and restores any price it changed.
