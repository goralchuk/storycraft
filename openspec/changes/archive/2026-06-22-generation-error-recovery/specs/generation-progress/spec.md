## MODIFIED Requirements

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
