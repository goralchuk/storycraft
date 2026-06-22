## Why

Text-only character description (8.3) nudges consistency but does not lock the
main character's look. `qwen-image-2.0` accepts a **reference image** (verified by
live probe), which is a much stronger consistency lever. The reference must be sent
**inline as base64** (our MinIO is not reachable by DashScope) and the request body
is capped at ~6 MB, while hero portraits are 2048² (~5 MB → ~7 MB base64) — so the
reference must be downscaled first.

## What Changes

- The generation worker fetches the child's MAIN hero image, **downscales it**
  (max 1024×1024, JPEG q80, ~150–400 KB) into a base64 data URI, and passes it as a
  reference on every `featuresChild` page.
- The Qwen image generator includes the reference image in the request `content`
  alongside the prompt, so the illustrator conditions on the actual character.
- Add `sharp` for the downscale/compress step (prebuilt binaries, also reusable
  later for PDF image-size reduction).
- Graceful fallback: when the MAIN hero has no image, or fetch/resize fails,
  generation proceeds without a reference (description-only, as in 8.3).

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `story-generation`: add that main-character illustrations are conditioned on a downscaled reference image of the MAIN hero when available.

## Impact

- **Backend**: `ai/contracts.ts` (`ImageContext.referenceImage`), `tasks/book-generation.processor.ts` (fetch + downscale hero image → data URI, pass on `featuresChild` pages), `qwen-image.generator.ts` (send the reference in `content`). Gemini/stub ignore it.
- **Dependency**: add `sharp`.
- **No API/DB change.**
