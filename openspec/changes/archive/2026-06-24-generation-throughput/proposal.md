## Why

With ~100 users able to submit at once, generation must not overwhelm the external
AI provider or our process. The worker has no explicit concurrency cap or rate limit,
and a transient provider blip (HTTP 429 / 5xx / timeout) fails the whole book instead
of being retried. We reuse the existing BullMQ/Redis queue to bound throughput and add
per-call retry with backoff.

## What Changes

- **Bounded worker.** The generation worker runs with a configurable `concurrency`
  and a BullMQ `limiter` (max jobs per window), so only a bounded number of books
  generate at once and job starts are rate-limited. Tunable via env
  (`GEN_CONCURRENCY`, `GEN_RATE_MAX`, `GEN_RATE_DURATION_MS`) with sane defaults.
- **Per-call retry/backoff.** Every external AI call (via `loggedCall`) retries on a
  retryable error (HTTP 429 / 5xx, timeout, network) with exponential backoff
  (≈1s/3s), so a transient blip doesn't fail the book. Non-retryable errors fail fast.
- **Visibility.** The worker logs its concurrency/limiter config on startup; retries
  are logged.

Job-level retries are intentionally not used: a failed book is moved to `FAILED` and
the claim only takes `PENDING`, so a BullMQ job retry would be a no-op — transient
recovery belongs at the call level, permanent failures use the existing free user
retry (8.8).

## Capabilities

### Modified Capabilities
- `generation-progress`: generation throughput is bounded (worker concurrency + queue rate limiter) and transient AI-call errors are retried with backoff.

## Impact

- **Backend**: `book-generation.processor` `@Processor` options (concurrency + limiter from env); `loggedCall` gains retry/backoff; startup log of the config.
- **Env**: `GEN_CONCURRENCY`, `GEN_RATE_MAX`, `GEN_RATE_DURATION_MS` (optional, defaults) documented in `.env.example`.
- **No DB / frontend changes.**
