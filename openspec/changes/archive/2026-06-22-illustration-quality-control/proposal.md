## Why

Even with a character description (8.3) and a reference image (8.4), the diffusion
model can still produce a page where the main character drifts. A vision-language
pass (`qwen3-vl-flash`, verified by live probe to score two base64 images and return
JSON) can catch those outliers and trigger a single regeneration — a quality safety
net on top of the generation-time levers.

## What Changes

- After generating a child-facing (`featuresChild`) illustration, the worker scores
  it against the MAIN hero reference image with `qwen3-vl-flash` (consistency/quality
  1–10).
- If the score is below the pass bar (**7**), the worker regenerates the page image
  **once** and keeps the result.
- QC only runs on `featuresChild` pages and only when a reference image is available;
  it is fail-open (any checker error → keep the original image, never fail the book).

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `story-generation`: add that child-facing illustrations are quality-checked against the reference and low-scoring pages are regenerated once.

## Impact

- **Backend**: new `ConsistencyChecker` contract + `QwenVisionChecker` (qwen3-vl-flash) in `ai/`; `AiModule` provides/exports it; `tasks/book-generation.processor.ts` runs the check + single regen; the integration test overrides the checker with a stub (no VL calls in tests).
- **Cost**: one VL call per child-facing page, plus a regeneration for low scorers.
- **No API/DB change.** VL model id is a constant (`qwen3-vl-flash`).
