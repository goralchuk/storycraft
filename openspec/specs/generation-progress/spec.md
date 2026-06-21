# Generation Progress

## Purpose

Named generation stages and a progress percentage reported by the worker and exposed on the book for the viewer to poll.

## Requirements

### Requirement: Generation runs once per submission

The generation worker SHALL claim a book for processing only when it is `PENDING`,
atomically transitioning it to `PROCESSING`. A book that is not `PENDING` (already
processing, done, or failed) SHALL NOT be reprocessed. This guarantees the
page-tier surcharge refund-on-failure happens at most once per submission.

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

While generating, the worker SHALL set the stage to `HEROES`, then `STORY` before writing text, then `ILLUSTRATIONS` while producing images (with `progress` increasing as images complete), then `ASSEMBLE` before building the PDF, and SHALL set `progress` to 100 when the book reaches `DONE`. Progress SHALL be non-decreasing during a run.

#### Scenario: Progress reaches the illustrations stage

- **WHEN** the worker has written the story and is producing images
- **THEN** `GET /books/:id` reports stage `ILLUSTRATIONS` with `progress` greater than at the `STORY` stage

#### Scenario: Completed book reports full progress

- **WHEN** a book reaches `DONE`
- **THEN** `progress` is 100

#### Scenario: A re-run resets progress

- **WHEN** generation runs again for a book
- **THEN** the stage and progress are reset at the start of the run rather than continuing from a stale value

### Requirement: Failed generation retains the last stage

When generation fails, the system SHALL set the book status to `FAILED` and SHALL leave the last reached stage on the book (progress is not forced to 100).

#### Scenario: Failure keeps the stage

- **WHEN** generation fails during illustrations
- **THEN** the book status is `FAILED` and its stage remains `ILLUSTRATIONS`
