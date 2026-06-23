## ADDED Requirements

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
