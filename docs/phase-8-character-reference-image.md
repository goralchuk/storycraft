# Phase 8.4 — Character consistency (reference image)

Result of ROADMAP task 8.4. Conditions child-facing illustrations on a downscaled
**reference image** of the MAIN hero — the stronger consistency lever on top of the
text description from 8.3. OpenSpec change: `character-reference-image` (modifies
capability `story-generation`).

## What was delivered

- **Reference, inline + downscaled.** The worker fetches the MAIN hero image,
  downscales it with `sharp` to ≤1024×1024 JPEG q80, and builds a base64 data URI.
  This is required because DashScope cannot reach our local MinIO (so the reference
  must be inlined) and the request body caps at ~6 MB.
- **Contract.** `ImageContext` gains `referenceImage` (data URI). The worker passes
  it on `featuresChild` pages (alongside the 8.3 character description).
- **Qwen generator.** When `referenceImage` is set, it is included in the request
  `content` (`[{ image }, { text }]`) so the illustrator conditions on the actual
  character. Gemini/stub ignore it.
- **Dependency.** Added `sharp` (prebuilt binaries; also reusable later for
  final-image / PDF size reduction).
- **Robust fallback.** If the MAIN hero has no image, or fetch/resize fails, the
  worker logs a warning and proceeds without a reference (description-only).

## Verification (live)

A MAIN hero portrait was generated (мальчик в полосатой тельняшке и красной
пиратской бандане), then a 3-page book. The reference downscaled from
**5,768,511 → 122,398 bytes** (base64 ~164 KB, vs the 6,291,456-byte limit), and all
three child-facing pages were generated with the reference image included. Hero and
page image URLs were reported for visual comparison. `npm run build` and
`npm run test:int` (9 tests) stay green.

## Notes / limitations

- Diffusion conditioning is not exact — VL-based quality control with regeneration
  (8.5) is the follow-up safety net.
- Only the MAIN character is referenced (companions out of scope).
- Final stored illustrations are still full-size (the heavy-PDF concern is tracked
  separately); `sharp` is now available to address it later.
