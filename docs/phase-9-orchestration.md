# Phase 9.7 — Generation orchestration + log + history

Result of ROADMAP task 9.7. Each generation run is now a durable, queryable record
with a per-step log, and a successful run is persisted as a reusable story history.
OpenSpec change: `generation-orchestration` (modifies `generation-progress` and
`generation-pipeline`).

## Orchestration record + log

The worker creates a `BookGeneration` on each run (`status`, `currentStep`,
`progress`, `startedAt`/`finishedAt`, `error`) and advances it through the stages,
writing a `BookGenerationLog` entry per transition (`HEROES → STORY → ILLUSTRATIONS →
ASSEMBLE → DONE`). It ends:
- **DONE** with `finishedAt`, or
- **FAILED** with the `error` and the `currentStep` where it broke.

So a run is reconstructable from the DB, and a failure is attributable without
grepping logs. `onModuleInit` also closes any `BookGeneration` left `PROCESSING` by a
crash (alongside the existing book requeue).

## Reusable history on success

On `DONE` the worker creates a `BookTemplateHistory` — the child-agnostic tokenized
story (`title`, `slots`, `pages`) plus the **assembled `storyPrompt`**
(`buildStoryPrompt(storyCtx)`) and the style/theme refs — and links it on
`Book.templateHistoryId`. `Book.finishedAt` is set. This is the artifact the template
catalog will reuse later.

## API

`GET /books/:id` now includes the latest `generation` (state for the poller /
diagnostics). The frontend poller switches to it with the wizard rework in 9.10;
`Book.stage`/`progress` are unchanged for now (they drive claim/recovery and the
current poller).

## Verification

- `npm run build` + `npm run test:int` green (12). New assertions:
  - on DONE: `BookGeneration` is `DONE` with `finishedAt`, ≥4 log steps,
    `Book.finishedAt` + `templateHistoryId` set, and the history has a non-empty
    `storyPrompt`;
  - on failure: the latest `BookGeneration` is `FAILED` with `currentStep`
    `ILLUSTRATIONS` and a non-empty `error`.

## Notes

- `BookGeneration.progress` is stage-granular (per-page smooth progress stays on
  `Book.progress`); the 9.10 poller can choose its source.
- Multiple runs (retries) create multiple `BookGeneration` rows — `getOne` returns the
  latest. The image-model **hybrid** (edit when references exist, base otherwise) is a
  separate follow-up change.
