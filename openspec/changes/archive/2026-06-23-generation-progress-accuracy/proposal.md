## Why

The reported `stage`/`progress` no longer reflects the real work after 8.5/8.6:

- The `HEROES` stage does **no work** — heroes are pre-generated before submit, and
  the main-character reference (the only hero-related prep at generation time) is
  built mid-`ILLUSTRATIONS`. The poller sits at the `HEROES` step while nothing
  hero-related happens.
- The illustration band weights **every** page equally, but `TEXT_ONLY` pages (8.6)
  generate no image. A text-heavy book crawls the bar as if each page were an
  expensive illustration; an image-heavy book under-reports the slow part.

We want the stage to be truthful (the `HEROES` stage actually prepares the hero
reference) and the progress to track the expensive image work, while staying
non-decreasing within a run.

## What Changes

- **`HEROES` stage does real work.** Move the main-hero lookup + reference-image
  prep into the `HEROES` stage (before `STORY`), so the stage the poller sees
  matches the work being done.
- **Image-weighted illustration progress.** The `30→90%` illustration band is
  distributed over the pages that actually generate an image; `TEXT_ONLY` pages
  cost no image work and don't advance the bar. Progress stays non-decreasing.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `generation-progress`: the `HEROES` stage prepares the hero reference (real work); illustration progress is weighted by image-generating pages, not all pages.

## Impact

- **Backend**: `book-generation.processor` — hero/reference prep moves to the
  `HEROES` stage; the per-page progress update is weighted by image-generating pages.
- **No DB / API / frontend changes** (same `stage`/`progress` contract).
