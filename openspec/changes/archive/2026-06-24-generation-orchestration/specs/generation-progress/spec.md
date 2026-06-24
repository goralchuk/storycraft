## ADDED Requirements

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
