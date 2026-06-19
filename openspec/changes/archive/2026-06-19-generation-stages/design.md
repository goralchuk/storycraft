## Context

`BookGenerationProcessor.process` runs synchronously: set `PROCESSING` → `generateText` → loop generating one image per page (and persisting `BookPage` + `Illustration`) → build PDF → upload → set `DONE`; on error set `FAILED`. The viewer `/books/[id]` re-fetches `GET /books/:id` every 2.5s via `StatusPoller` while `PENDING`/`PROCESSING`. Books expose scalar fields directly, so adding columns surfaces them on read without controller changes.

## Goals / Non-Goals

**Goals:**
- A named `stage` and a 0–100 `progress` on the book, written by the worker and shown in the viewer.
- Progress that advances monotonically through the four prototype stages and reaches 100 on completion.

**Non-Goals:**
- Real-time push (SSE/WebSocket) — polling stays.
- Sub-step accuracy beyond per-image increments; moving generation off the worker; the redesign.

## Decisions

**Two scalar columns on `Book`, written inline by the worker.**
`stage` (`BookStage?`) + `progress` (`Int @default(0)`). The worker updates them at each step with a tiny `book.update`. Rationale: the simplest representation that the existing `GET /books/:id` already serializes; no new endpoint, no Task-row bookkeeping. Alternative considered: drive progress off the `Task` model — rejected as the worker doesn't use Task rows today and it adds a join for no UX gain.

**Progress budget across stages.**
`HEROES` 5%, `STORY` 15%, `ILLUSTRATIONS` 30→90% (per image: `30 + round(60 * done/total)`), `ASSEMBLE` 90%, `DONE` 100%. Rationale: illustrations dominate wall-clock time, so they get the widest band and per-image updates; the other stages are coarse markers. Monotonic by construction.

**`HEROES` is a brief preparing-characters marker.**
Heroes are pre-generated and child-owned (6.8–6.9); the book pipeline doesn't generate avatars. The `HEROES` stage is set at the very start (before text) so the UI mirrors the prototype's four-stage bar without implying avatar work here.

**Reset points.**
`submit` clears `stage`/`progress` (so a resumed/older draft doesn't show stale values). The worker also resets `stage = HEROES, progress = 5` at the start of `process`, making re-runs idempotent for progress too (it already deletes pages before regenerating).

**Failure leaves the stage.**
The `catch` sets `FAILED` only; it does not clear the stage or bump progress, so the UI can show where it failed.

## Risks / Trade-offs

- **Extra writes per image** → one small `book.update` per page → negligible at these page counts; acceptable for clearer UX.
- **Progress is approximate** → the bands are heuristic, not measured durations → fine for a progress indicator; users care about movement, not exactness.
- **Legacy in-flight books** during deploy → none mid-generation in dev; new columns default to null/0 and are populated on the next run.

## Migration Plan

1. Prisma migration: add `BookStage` enum and `Book.stage` (nullable) + `Book.progress` (`Int @default(0)`).
2. `prisma migrate dev`; no seed change.
3. Deploy backend + frontend together. Rollback: drop the columns/enum; viewer falls back to the status text.

## Open Questions

- None blocking. A later slice may switch polling to SSE for smoother updates; out of scope here.
