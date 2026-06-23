# Phase 8.9 — Progress accuracy

Result of ROADMAP task 8.9. The reported `stage`/`progress` now reflects the real
work and stays non-decreasing within a run. OpenSpec change:
`generation-progress-accuracy` (modifies `generation-progress`).

## What was wrong (after 8.5/8.6)

- **`HEROES` stage did no work.** Heroes are pre-generated before submit, and the
  only hero-related prep at generation time — building the main-character reference
  image — happened mid-`ILLUSTRATIONS`. The poller sat on the `HEROES` step
  («Фиксируем образы персонажей») while nothing hero-related ran.
- **Illustration band weighted every page equally.** `TEXT_ONLY` pages (8.6)
  generate no image, but the `30→90%` band advanced one notch per page regardless,
  so a text-heavy book crawled and an image-heavy book under-reported the slow part.

## Changes (worker only)

- **`HEROES` does real work.** The main-hero lookup + reference-image prep
  (`toDataUri`) moved to the start of the run, under stage `HEROES` (`progress` 10),
  before `STORY`. The stage the poller sees now matches the work being done.
- **Image-weighted illustration progress.** The `30→90%` band is distributed over
  the pages that actually generate an image:

  ```
  imageTotal = pages where layout !== TEXT_ONLY
  progress   = 30 + round(60 * imageDone / imageTotal)
  ```

  `TEXT_ONLY` pages don't increment `imageDone`, so they don't move the bar (correct
  — they cost no image work) and progress stays non-decreasing. When a book has no
  image pages at all, the band collapses to `90` immediately, matching `ASSEMBLE`.

No DB / API / frontend changes — same `stage`/`progress` contract; the four stages
(`HEROES → STORY → ILLUSTRATIONS → ASSEMBLE`) and their labels are unchanged.

## Verification

- Integration test (new): the worker's `stage`/`progress` writes are recorded in
  order during a real run (mixed image / `TEXT_ONLY` layouts); progress is
  non-decreasing throughout and ends at `100`, and the four stages appear in order.
  10 tests green.
- Backend build + frontend `tsc --noEmit` clean.

## Notes

- Failure attribution still holds: `HEROES`/`STORY`/`ILLUSTRATIONS`/`ASSEMBLE` are
  entered before their work, so a failure leaves the correct last stage on the book
  (8.8).
- QC regeneration (8.5) happens within a page's image work, so it's already
  accounted for under that page's slice of the band.
