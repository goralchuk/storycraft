## 1. Default model

- [x] 1.1 `AppSettings.imageModel` default → `qwen-image-edit-plus-2025-12-15`; migration

## 2. Multi-reference illustrator

- [x] 2.1 `ImageContext.referenceImage: string` → `referenceImages: string[]`
- [x] 2.2 `QwenImageGenerator`: build a content array with every reference image + `watermark:false`
- [x] 2.3 Update callers to the array shape: `book-generation.processor` (wrap the single hero ref), `gemini-image.generator` (no-op — doesn't read it), stub (no-op)

## 3. Verify + document

- [x] 3.1 `npm run build` + `npm run test:int` green; live probe confirms a generation from ≥2 reference images via the chosen model
- [x] 3.2 Document in `docs/phase-9-image-models.md` (probe findings + chosen default)
