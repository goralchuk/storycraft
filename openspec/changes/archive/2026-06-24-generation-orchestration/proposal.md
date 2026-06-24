## Why

Generation state lives only on the `Book` (stage/progress) and there's no durable,
queryable record of a run or its steps — so failures aren't auditable and the
generated story isn't kept as a reusable artifact. 9.3 added the tables
(`BookGeneration`, `BookGenerationLog`, `BookTemplateHistory`); 9.7 wires the worker
to use them.

## What Changes

- **Orchestration record.** On each run the worker creates a `BookGeneration`
  (`status`, `currentStep`, `progress`, `startedAt`/`finishedAt`, `error`) and advances
  it through the stages; it ends `DONE` or `FAILED` (with the error + the stage it
  failed at).
- **Per-step log.** Each stage transition writes a `BookGenerationLog` entry; a
  failure logs the failing stage — so a run is reconstructable from the DB.
- **Reusable history on success.** On `DONE` the worker creates a
  `BookTemplateHistory` (tokenized title/slots/pages + the assembled `storyPrompt` +
  style/theme refs) and links it on `Book.templateHistoryId`. `Book.finishedAt` is set.
- **Recovery.** Orphaned `PROCESSING` `BookGeneration`s are closed (`FAILED`) on
  startup alongside the existing book requeue.
- **API.** `GET /books/:id` includes the latest `generation` (state surfaced for the
  poller; the frontend switches to it in 9.10).

`Book.stage`/`progress` stay as-is (they drive claim/recovery and the current poller);
`BookGeneration` mirrors the live state and adds the durable log + history.

## Capabilities

### Modified Capabilities
- `generation-progress`: a run is tracked by a `BookGeneration` orchestration record + per-step `BookGenerationLog`, ending `DONE`/`FAILED` with the failing stage; the record is exposed on `GET /books/:id`.
- `generation-pipeline`: a completed run is persisted as a reusable `BookTemplateHistory` (tokenized story + assembled prompt + refs) linked to the book.

## Impact

- **DB**: `Book.finishedAt` (migration). `BookGeneration`/`BookGenerationLog`/`BookTemplateHistory` (from 9.3) now populated.
- **Backend**: worker (create/advance/finish `BookGeneration`, write logs, create history, set `finishedAt`); `onModuleInit` closes orphaned generations; `books.service.getOne` includes the latest generation.
- **No frontend changes** (poller switch is 9.10).
