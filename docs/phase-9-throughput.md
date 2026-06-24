# Phase 9.8 — Queue concurrency & rate limiting

Result of ROADMAP task 9.8. Generation throughput is bounded and transient provider
errors are retried, so concurrent users don't overwhelm the AI provider or our
process. OpenSpec change: `generation-throughput` (modifies `generation-progress`).
Reuses the existing BullMQ/Redis queue.

## Bounded worker

The `@Processor` now sets `concurrency` and a BullMQ `limiter` (max jobs per window),
tunable via env with safe defaults:

| Env | Default | Meaning |
|---|---|---|
| `GEN_CONCURRENCY` | 3 | books generated in parallel |
| `GEN_RATE_MAX` | 30 | max job starts per window |
| `GEN_RATE_DURATION_MS` | 60000 | the window |

So at most N books run at once and job starts are rate-limited; the rest wait in the
queue. The worker logs the config on startup
(`worker concurrency=3, rate-limit=30/60000ms`).

## Per-call retry/backoff

`loggedCall` (which wraps every external AI call — text/image/vision/caption) now
retries on a **retryable** error with exponential backoff (≈1s, then 3s; up to 3
attempts): HTTP 429, HTTP 5xx, timeout, or network error. A **non-retryable** error
(e.g. 400) fails immediately. A transient blip no longer fails the whole book.

Job-level retries are deliberately not used: a failed book becomes `FAILED` and the
claim only takes `PENDING`, so a BullMQ job retry would be a no-op — transient
recovery is at the call level, permanent failures use the free user retry (8.8).

## Verification

- `npm run build` + `npm run test:int` green (12).
- `loggedCall` retry verified directly: a `(429)`-then-success call retried and
  succeeded in 3 attempts (~4s of backoff); a `(400)` call threw on the first attempt
  with no retry.

## Notes

- The limiter bounds book-job starts (a proxy for provider load); the per-call retry
  absorbs brief rate-limit/5xx blips. For finer global API-call rate control, a
  dedicated token bucket can be added later if needed.
