## Context

The backend already reports a generation `stage` (HEROES → STORY → ILLUSTRATIONS →
ASSEMBLE) and `progress` (0–100) on `GET /books/:id` (`generation-progress`), and
`getOne` returns the book in any status — DRAFT included. `POST /books/:id/submit`
charges the page-tier surcharge once and enqueues generation; it keeps the draft on
402. The current `/books/[id]` page already polls via `StatusPoller` and renders
pages inline when DONE. Change C built the wizard up to step 2, whose footer
currently submits.

## Goals / Non-Goals

**Goals:**
- Prototype-faithful step-3 screen with ready → in-progress → done/failed states.
- Generation (and its page-tier charge) starts in step 3, not step 2.
- Live 4-stage progress reusing the existing poller.

**Non-Goals:**
- The full spread reader (HTML spreads from slots+images) and on-demand PDF — 6.20.
  DONE keeps the existing inline page list (lightly restyled) so reading doesn't regress.
- Backend / pricing changes.
- Wallet (6.21); the top-up redirect target stays `/dashboard?error=coins` for now.

## Decisions

- **Submit moves to step 3.** Step 2's primary action becomes `saveDraftAction`
  (PATCH the config, redirect to `/books/[id]`), leaving the book a DRAFT. The
  step-3 ready button calls `generateBookAction` (`POST /books/:id/submit`), so the
  surcharge is charged at generation start — matching the step-2 copy and the
  ROADMAP wording ("step 3 — start generation"). `submitDraftAction` is removed.
- **One state-driven surface.** `/books/[id]` renders by status: `DRAFT` → ready,
  `PENDING|PROCESSING` → in-progress, `DONE` → completed + reading view, `FAILED` →
  error. `getOne` already returns all states, so no new route is needed.
- **Stepper on step 3.** The screen shows `WizardStepper active={3}` for continuity
  with steps 1–2.
- **Reuse the poller.** `StatusPoller` stays for the in-progress state; the parent
  stops rendering it at a terminal status (existing behaviour).
- **Russian stage labels.** Map HEROES/STORY/ILLUSTRATIONS/ASSEMBLE to the
  prototype's Russian copy with done (✓) / current (spinner) / pending (number) marks.
- **No regression on reading.** DONE shows the completed card plus the current inline
  pages (restyled); 6.20 supersedes this with the real reader.

## Risks / Trade-offs

- [Resuming a saved-but-ungenerated draft] → the dashboard banner resumes at
  `/books/new` (step 2); the user re-confirms and lands on step 3 again. Consistent,
  if a small extra hop.
- [A DRAFT is now reachable at `/books/[id]` showing the generate gate] → acceptable;
  it is also surfaced by the dashboard draft banner, and submitting clears the draft.
- [Removing `submitDraftAction`] → low risk; only the step-2 footer used it, and it is
  replaced by `saveDraftAction` + `generateBookAction`.

## Open Questions

- None blocking. The "Читать книгу" CTA renders the inline reading view now and will
  point at the 6.20 reader once it exists.
