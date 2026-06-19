## Why

While a book generates, the viewer only shows a coarse `PROCESSING` status — the user can't tell whether the AI is writing, drawing, or assembling, or how far along it is. The prototype's generation screen shows four named stages with a progress bar (ROADMAP 6.11). This change surfaces those stages and a progress percentage so the wait feels legible.

## What Changes

- **Stage + progress on the book** — add a `BookStage` enum (`HEROES | STORY | ILLUSTRATIONS | ASSEMBLE`) and `Book.stage` (nullable) + `Book.progress` (Int, default 0).
- **Worker reports progress** — the generation worker advances stage + progress as it runs: `HEROES` (~5%) on start, `STORY` (~15%) before text, `ILLUSTRATIONS` (~30→90%) incrementing per generated image, `ASSEMBLE` (~90%) before the PDF, and `progress` 100 on `DONE`. A failed run leaves the last stage; a (re)run resets stage/progress at the start.
- **Reset on submit** — submitting a draft clears `stage`/`progress`.
- **Exposed on read** — `GET /books/:id` returns `stage` and `progress` (scalar fields already serialized).
- **Frontend** — the book viewer, while `PENDING`/`PROCESSING`, shows the stage as a human label (Queued / Creating heroes / Writing the story / Drawing illustrations / Assembling the book) and a progress bar, on top of the existing poll.

## Capabilities

### New Capabilities
- `generation-progress`: Named generation stages and a progress percentage reported by the worker and exposed on the book for the viewer to poll.

### Modified Capabilities
<!-- book-lifecycle's submit additionally clears stage/progress, but its existing requirements are unchanged; the new behavior lives in this capability. -->

## Impact

- **Backend (NestJS + Prisma/Postgres)**: `BookStage` enum + `Book.stage`/`Book.progress`; a migration. `BookGenerationProcessor` writes stage/progress through the pipeline; `BooksService.submit` resets them. `docs/API.md` notes the new read fields.
- **Frontend (Next.js App Router)**: the `/books/[id]` viewer renders a stage label + progress bar while in progress (uses the existing `StatusPoller`).
- **Out of scope**: the visual redesign / polished wizard step-3 (6.12–6.19); moving generation off the synchronous worker; avatar generation inside the book pipeline (the `HEROES` stage is a brief "preparing characters" step — heroes are pre-generated and child-owned, 6.8–6.9).
