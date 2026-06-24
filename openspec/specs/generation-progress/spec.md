# Generation Progress

## Purpose

Named generation stages and a progress percentage reported by the worker and exposed on the book for the viewer to poll.
## Requirements
### Requirement: Generation runs once per submission

The generation worker SHALL claim a book for processing only when it is `PENDING`,
atomically transitioning it to `PROCESSING`. A book that is not `PENDING` (already
processing, done, failed, or cancelled) SHALL NOT be reprocessed. A failed book is
re-run only by an explicit retry, which first resets it to `PENDING`.

#### Scenario: Pending book is claimed once

- **WHEN** the worker processes a `PENDING` book
- **THEN** it transitions the book to `PROCESSING` and proceeds with generation

#### Scenario: A non-pending book is not reprocessed

- **WHEN** the worker receives a job for a book that is already `DONE` or `FAILED`
- **THEN** it does not reprocess the book and does not change the user's coins

### Requirement: Book carries a generation stage and progress

The system SHALL expose a generation `stage` (`HEROES | STORY | ILLUSTRATIONS | ASSEMBLE`, or none) and a `progress` percentage (0–100) on a book, returned by `GET /books/:id`. A freshly submitted draft SHALL have no stage and `progress` 0.

#### Scenario: Submitted book starts with no progress

- **WHEN** a draft is submitted
- **THEN** the book has `stage` cleared and `progress` 0

### Requirement: Worker advances stage and progress

While generating, the worker SHALL set the stage to `HEROES` while it prepares the
main-character reference, then `STORY` before writing text, then `ILLUSTRATIONS`
while producing images, then `ASSEMBLE` before building the PDF, and SHALL set
`progress` to 100 when the book reaches `DONE`. During the `ILLUSTRATIONS` stage,
`progress` SHALL be weighted by the pages that actually generate an image (a
`TEXT_ONLY` page generates no image and SHALL NOT advance the bar). Progress SHALL
be non-decreasing during a run.

#### Scenario: Heroes stage prepares the character reference

- **WHEN** the worker begins a run
- **THEN** it is at stage `HEROES` while it loads the main hero and prepares the reference image, before moving to `STORY`

#### Scenario: Progress reaches the illustrations stage

- **WHEN** the worker has written the story and is producing images
- **THEN** `GET /books/:id` reports stage `ILLUSTRATIONS` with `progress` greater than at the `STORY` stage

#### Scenario: Illustration progress tracks image work

- **WHEN** the worker produces images for a book that mixes image and `TEXT_ONLY` pages
- **THEN** `progress` advances only as image-generating pages complete and remains non-decreasing across `TEXT_ONLY` pages

#### Scenario: Completed book reports full progress

- **WHEN** a book reaches `DONE`
- **THEN** `progress` is 100

### Requirement: Failed generation retains the last stage

When generation fails, the system SHALL set the book status to `FAILED` and SHALL leave the last reached stage on the book (progress is not forced to 100).

#### Scenario: Failure keeps the stage

- **WHEN** generation fails during illustrations
- **THEN** the book status is `FAILED` and its stage remains `ILLUSTRATIONS`

### Requirement: Worker emits per-stage and per-call diagnostics

The generation worker SHALL log one entry per stage (tagged with the book id), a
summary when a book completes (elapsed time, page count, images generated,
regenerations), and an error entry naming the stage that failed and the elapsed
time when a run fails. Each external AI call (text, image, vision) SHALL be logged
with its kind, model, latency, and outcome.

#### Scenario: Failure is attributable from the logs

- **WHEN** generation fails during a stage
- **THEN** the worker logs an error naming that stage and the elapsed time, and the failing AI call is logged with its model and outcome

#### Scenario: Completion is summarized

- **WHEN** a book reaches `DONE`
- **THEN** the worker logs a summary with the elapsed time and the number of pages and images produced

### Requirement: A generation run is tracked by an orchestration record and log

The worker SHALL create a `BookGeneration` record for each run (status, current step,
progress, start/finish time) and SHALL write a `BookGenerationLog` entry at each stage
transition. The record SHALL end `DONE` on success or `FAILED` on error, and a failed
record SHALL carry the error and the stage at which it failed. The latest
`BookGeneration` for a book SHALL be returned by `GET /books/:id`.

#### Scenario: A run records its steps

- **WHEN** a book is generated successfully
- **THEN** a `BookGeneration` ends `DONE` and `BookGenerationLog` entries exist for the stages it passed through

#### Scenario: A failure is attributable in the record

- **WHEN** generation fails during a stage
- **THEN** the `BookGeneration` is `FAILED` with the error and the failing stage recorded

#### Scenario: Orphaned generations are closed on startup

- **WHEN** the worker starts and a `BookGeneration` was left `PROCESSING` by a crash
- **THEN** it is marked `FAILED` (alongside the book being requeued)

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

