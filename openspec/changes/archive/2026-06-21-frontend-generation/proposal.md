## Why

Change C left the wizard ending at step 2 by submitting straight to the bare
`/books/[id]` progress page (its documented boundary). ROADMAP 6.19 needs the
wizard's **step 3**: a "ready → start generation" gate, live 4-stage progress,
and a done hand-off. Moving submission here also fixes a timing mismatch — the
page-tier surcharge should be charged when generation actually starts, exactly as
step 2's own copy promises ("спишется при запуске генерации"), not on leaving
step 2.

## What Changes

- **Step 2 hand-off.** "К генерации →" now **saves** the config (`PATCH /books/:id`)
  and advances to step 3 at `/books/[id]` with the book still a DRAFT — no charge
  yet. ("Сохранить и выйти" still keeps the draft and returns to the dashboard.)
- **Step 3 — generation (6.19):** redesigned `/books/[id]` on the Change A design
  system with the shared `WizardStepper` (step 3 active), one surface for the book
  in any state:
  - **Ready (DRAFT)** — "Всё готово к генерации" card + "✨ Сгенерировать книгу";
    starting runs `POST /books/:id/submit` (charges the page-tier surcharge, enqueues)
    → in-progress. Insufficient coins keeps the draft and redirects to top up.
  - **In progress (PENDING/PROCESSING)** — styled progress bar + the four named
    stages (heroes → story → illustrations → assemble) with done / current / pending
    visuals, auto-refreshing via the existing `StatusPoller`.
  - **Done** — "Книга готова" card (cover + child) with read / dashboard actions,
    plus the reading view (current inline pages, restyled) until 6.20's full reader.
  - **Failed** — styled error with a "try again" path.
- **Actions.** Replace `submitDraftAction` with `saveDraftAction` (PATCH → `/books/[id]`,
  used by step 2) and `generateBookAction` (POST `/books/:id/submit`, used by the
  step-3 ready button); remove the now-unused `submitDraftAction`.

## Capabilities

### Modified Capabilities
- `book-wizard`: the step-2 "proceed" action now advances to step 3 instead of
  submitting; new step-3 requirements (indicator, start generation, live progress,
  completion/failure).

<!-- Consumes generation-progress (stage/progress on GET /books/:id); no backend change. -->

## Impact

- **Frontend**: rewrite `app/(app)/books/[id]/page.tsx` (state-driven step-3 screen)
  + a small generate-button island; edit `WizardStep2` footer and `app/actions/books.ts`.
  Reuse `WizardStepper`, `StatusPoller`, `Avatar`, and the design system.
- **Backend**: none — consumes `GET /books/:id` (stage/progress), `PATCH /books/:id`,
  `POST /books/:id/submit`.
- **Scope boundary**: the full spread reader + on-demand PDF is 6.20; wallet is 6.21.
- **Visual source of truth**: `draft/design/StoryCraft.dc.html` (wizard step 3 ~614–650).
