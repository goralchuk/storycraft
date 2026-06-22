# Phase 8.5 — Illustration quality control (qwen3-vl-flash)

Result of ROADMAP task 8.5. Adds a vision-language check-and-regenerate safety net
on top of the generation-time consistency levers (8.3 description, 8.4 reference
image). OpenSpec change: `illustration-quality-control` (modifies `story-generation`).

## What was delivered

- **`ConsistencyChecker` contract + `QwenVisionChecker`.** An abstract DI token
  (like the generators) so tests can override it. The Qwen impl calls
  `qwen3-vl-flash` over the OpenAI-compatible chat endpoint with two base64
  data-URI images (reference + page) and `response_format: json_object`, returning a
  1–10 score.
- **Worker QC.** After generating each `featuresChild` illustration, the worker
  downscales it (reusing the 8.4 `toDataUri` helper), scores it against the MAIN
  hero reference, logs the score, and — if it is below `QA_PASS = 7` — regenerates
  the page image **once** and keeps the result.
- **Robustness.** Score extraction tries strict JSON first, then falls back to a
  regex (`score: N`), because the VL model sometimes returns verbose/slightly
  malformed JSON even with `json_object`. The whole check is **fail-open**: any
  error (or no reference image) keeps the original image and never fails the book.
- **Tests.** The integration test overrides `ConsistencyChecker` with a passing
  stub, so no VL calls happen in tests.

## Defaults

- Pass bar `QA_PASS = 7`; at most **one** regeneration per page (accepted without
  re-scoring); QC runs on `featuresChild` pages only, and only when a reference
  image is available. VL model is a constant (`qwen3-vl-flash`).

## Verification (live)

First run surfaced a real bug — `qwen3-vl-flash` returned non-strict JSON on 2 of 3
pages (`QC skipped: SyntaxError …`), which fail-open handled (book still DONE). After
adding the regex fallback, a re-run scored all three child-facing pages cleanly
(9.5/10 each), so no regeneration was needed — consistent with the 8.4 reference
working. The regen path and fail-open are both in place. `npm run build` and
`npm run test:int` (9 tests) stay green.

## Notes / limitations

- Single-round QC (the regenerated image is not re-scored) to bound cost.
- Adds one VL call per child-facing page (plus a regeneration for low scorers).
- VL scoring is inherently noisy; this is a safety net, not a guarantee.
