## Context

8.3 (description) and 8.4 (reference image) condition generation; this adds a
post-generation check. A live probe confirmed `qwen3-vl-flash` over the
OpenAI-compatible chat endpoint accepts two base64 data-URI images + text with
`response_format: json_object` and returns `{ "score": n }`. Local MinIO images are
not reachable by DashScope, so both images are sent as downscaled base64 data URIs
(reusing the 8.4 downscale helper).

## Goals / Non-Goals

**Goals:**
- Catch outlier child-facing pages and fix them with a single regeneration.
- Be cheap-ish and robust: bounded work (1 VL call + at most 1 regen per child page), fail-open.

**Non-Goals:**
- Multi-round regeneration / scoring the regenerated image again.
- QC of non-child pages or companions.
- A configurable VL model in `AppSettings` (kept as a constant for now).

## Decisions

**1. `ConsistencyChecker` contract + `QwenVisionChecker`.** An abstract token (like
`TextGenerator`/`ImageGenerator`) so it can be overridden with a stub in tests. The
Qwen impl calls `qwen3-vl-flash` (constant) with the reference + page data URIs and
parses `{ score }`.

**2. Thresholds (defaults).** Pass bar `QA_PASS = 7`; at most **one** regeneration per
page; the regenerated image is accepted without re-scoring (bounds cost).

**3. Inline in the illustration loop.** For each `featuresChild` page with a
reference: build the page data URI (downscale via the 8.4 helper), score; if below
`QA_PASS`, regenerate once with the same `ImageContext`. Store the final image.

**4. Fail-open.** Wrap the check/regci in try/catch → on any error keep the original
image and log a warning; never fail the book on QC.

**5. Tests.** The integration test overrides `ConsistencyChecker` with a stub that
returns a passing score, so no VL calls occur in tests.

## Risks / Trade-offs

- **Cost** → one VL call per child page (+ regen for failures); bounded and child-only.
- **VL scores are noisy** → single regen + fail-open avoids loops and wasted spend; not a guarantee, just a net.
- **VL model as constant** → acceptable now; can move to `AppSettings` later if needed.
