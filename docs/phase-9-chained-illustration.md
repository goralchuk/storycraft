# Phase 9.9 — Chained illustration

Result of ROADMAP task 9.9. Illustrations are now generated as a chain: each page is
conditioned on the relevant hero portraits + the previous page (for visual
continuity) + a short plot, on the multi-image edit model, with the VL quality check.
OpenSpec change: `chained-illustration` (modifies `story-generation`).

## What changed (worker)

Per image page the worker builds the reference set (capped at **3** — the edit
model's `1~3 image` limit), by the page's `cast` from the layout template:

- `MAIN`/`ALL` → the MAIN hero portrait;
- `EXTRA`/`ALL` → companion portraits;
- always → the **previous page's** generated image (downscaled), for cross-page
  continuity.

The hybrid selector (edit model when references present) then runs the edit model for
chained pages and the base model for reference-less ones. A short **plot** (the
resolved book title) is added to every image prompt for coherence. The VL QC against
the MAIN reference (regenerate-once) is unchanged.

`prevPageRef` is updated to the finished image after each page (carried across
`TEXT_ONLY` pages); companion portraits are prepared once in the HEROES stage.

## Verification

- `npm run build` + `npm run test:int` green (12).
- **Live chain check**: page A (base model, a boy in a garden) → page B (edit model
  conditioned on A, new scene with a puppy) kept the **same** child (hair, white
  shirt + denim overalls, red sneakers) and the same watercolor style — confirming
  cross-page character + style consistency.

## Notes

- Reference cap is 3 (edit model limit); priority order is hero(s) → companions →
  previous page, de-duplicated.
- True image-to-image denoising isn't used; multi-reference conditioning on the edit
  model gives the chaining effect within one API shape.
