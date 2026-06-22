## 1. Checker contract + impl

- [x] 1.1 Add abstract `ConsistencyChecker { score({ referenceImage, pageImage }): Promise<number> }` to `ai/contracts.ts`
- [x] 1.2 Add `QwenVisionChecker` (qwen3-vl-flash, OpenAI-compatible chat, two data URIs → `{ score }`); robust score extraction (regex fallback for verbose/invalid JSON)
- [x] 1.3 Provide + export `ConsistencyChecker` in `AiModule`

## 2. Worker QC

- [x] 2.1 Reuse the downscale helper (`toDataUri`) to make a data URI from any stored image key
- [x] 2.2 Inject `ConsistencyChecker`; constant `QA_PASS = 7`
- [x] 2.3 For each `featuresChild` page with a reference: score the generated image; if `< QA_PASS`, regenerate once and keep the result; fail-open on any error

## 3. Tests

- [x] 3.1 Override `ConsistencyChecker` with a passing stub in the integration test

## 4. Verify + document

- [x] 4.1 `npm run build` + `npm run test:int` green
- [x] 4.2 Live: QC scored all three child-facing pages (9.5/10 each) after the parse fix; fail-open confirmed on the pre-fix run; regen path in place
- [x] 4.3 Document in `docs/phase-8-*.md`
