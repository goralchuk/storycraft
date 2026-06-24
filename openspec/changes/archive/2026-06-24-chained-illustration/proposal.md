## Why

Illustrating each page independently loses cross-page coherence — the setting and
secondary characters drift even when the hero is held by the reference. The concept
calls for a chain: condition each page on the relevant hero portraits plus the
previous page, with a short plot for context.

## What Changes

- **Chained references.** Per image page the worker assembles the reference set from
  the page's `cast` (layout template): MAIN hero for `MAIN`/`ALL`, companion portraits
  for `EXTRA`/`ALL`, and always the previous page's image for continuity — capped at 3
  (the edit model's `1~3 image` limit). The hybrid selector then uses the edit model
  for these multi-reference pages.
- **Plot context.** A short plot (the resolved book title) is added to every
  illustration prompt.
- VL quality control (regenerate-once against the MAIN reference) is retained.

## Capabilities

### Modified Capabilities
- `story-generation`: each illustration is chained on the relevant hero portraits and the previous page (capped at 3 references) with a short plot, for cross-page consistency.

## Impact

- **Backend**: `ImageContext` += `plot`; the worker prepares companion portraits, a
  plot, and a rolling previous-page reference, and builds per-page references by cast;
  qwen + gemini `buildPrompt` include the plot.
- **No DB / frontend changes.**
