## ADDED Requirements

### Requirement: Retry a failed book for free

The system SHALL expose `POST /books/:id/retry` that, when the book is `FAILED`,
resets it to `PENDING` (clearing `stage` and setting `progress` 0) and re-enqueues
generation, without charging coins (the user already paid). A book that is not
`FAILED` SHALL be unaffected.

#### Scenario: Retry re-runs a failed book

- **WHEN** the user retries a `FAILED` book
- **THEN** the book becomes `PENDING`, generation is re-enqueued, and no coins are charged

#### Scenario: Retry of a non-failed book is a no-op

- **WHEN** retry is called on a book that is not `FAILED`
- **THEN** the book is unchanged and nothing is enqueued

### Requirement: Decline a failed book for a refund

The system SHALL expose `POST /books/:id/cancel` that, when the book is `FAILED`,
moves it to the terminal status `CANCELLED` and refunds the page-tier surcharge once
(per the page-pricing refund requirement). A book that is not `FAILED` SHALL be
unaffected, and a `CANCELLED` book SHALL NOT be refunded again or retried.

#### Scenario: Decline refunds and cancels

- **WHEN** the user declines a `FAILED` book
- **THEN** the book becomes `CANCELLED` and the page-tier surcharge is refunded once

#### Scenario: Cancelled is terminal

- **WHEN** retry or cancel is called on a `CANCELLED` book
- **THEN** the book stays `CANCELLED` and no coins move

### Requirement: Orphaned processing books recover on startup

On worker startup the system SHALL reset any book left in `PROCESSING` to `PENDING`
(clearing `stage`/`progress`) and re-enqueue it, so no book remains stuck in
`PROCESSING` after a crash or restart.

#### Scenario: Stuck processing book resumes

- **WHEN** the worker starts and a book is in `PROCESSING` from a previous run
- **THEN** the book is reset to `PENDING` and generation is re-enqueued
