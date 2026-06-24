## ADDED Requirements

### Requirement: Generation throughput is bounded

The generation worker SHALL run with a configurable concurrency limit and a queue
rate limiter (maximum jobs per time window), so that the number of books generated
concurrently and the rate of job starts are bounded and do not overwhelm the external
provider. The limits SHALL be configurable via environment variables with safe
defaults.

#### Scenario: Concurrency is capped

- **WHEN** more books are pending than the configured concurrency
- **THEN** at most the configured number generate at once and the rest wait in the queue

### Requirement: Transient AI-call errors are retried with backoff

Each external AI call SHALL be retried on a retryable error (HTTP 429 or 5xx, timeout,
or network failure) with exponential backoff, up to a bounded number of attempts; a
non-retryable error SHALL fail immediately. A transient blip SHALL NOT fail the book
on its own.

#### Scenario: A rate-limit error is retried

- **WHEN** an AI call returns HTTP 429 and then succeeds on retry
- **THEN** the call ultimately succeeds without failing the book

#### Scenario: A non-retryable error fails fast

- **WHEN** an AI call fails with a non-retryable error
- **THEN** it is not retried and the error propagates
