## Why

When a generation fails, the logs don't say enough to diagnose it: there's no
per-stage trace tied to the book, no timing, and the external AI calls (text /
image / vision) are invisible — a failure surfaces only as a thrown
`ServiceUnavailableException` with no record of which model/call was slow or broke.

## What Changes

- **Per-AI-call logging.** Each external AI call (text, image, vision) logs its
  kind, model, latency and outcome (`ok` / `failed` with the error), so a slow or
  failing provider call is visible in the logs.
- **Per-stage logging.** The worker logs one line per stage (`HEROES` / `STORY` /
  `ILLUSTRATIONS` / `ASSEMBLE`) tagged with the book id, a `DONE` summary
  (duration, pages, images, regenerations), and on failure an error line naming the
  stage that broke and the elapsed time.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `generation-progress`: the worker emits per-stage logs and a run summary/failure line; each external AI call is logged with model, latency and outcome.

## Impact

- **Backend**: new `ai/logged-call.ts` helper wrapping the three Qwen generators;
  `book-generation.processor` adds per-stage logs, a `DONE` summary and a failure log.
- **No DB / API / frontend changes.**
