## 1. Bounded worker

- [x] 1.1 `@Processor` options: `concurrency` + `limiter { max, duration }` from env (`GEN_CONCURRENCY`, `GEN_RATE_MAX`, `GEN_RATE_DURATION_MS`) with defaults; log config on startup
- [x] 1.2 Document the env vars in `.env.example`

## 2. Per-call retry/backoff

- [x] 2.1 `loggedCall` retries on retryable errors (429 / 5xx / timeout / network) with exponential backoff; non-retryable fail fast; retries logged

## 3. Verify + document

- [x] 3.1 `npm run build` + `npm run test:int` green; `loggedCall` retry verified (429-then-success retries and succeeds; non-retryable throws once)
- [x] 3.2 Document in `docs/phase-9-throughput.md`
