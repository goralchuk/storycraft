## 1. Schema

- [x] 1.1 `AppSettings.imageEditModel` (default `qwen-image-edit-plus-2025-12-15`); migration + `generate`

## 2. Hybrid selection

- [x] 2.1 `QwenImageGenerator` picks `imageEditModel` when `referenceImages` is non-empty, else `imageModel`

## 3. Verify + document

- [x] 3.1 `npm run build` + `npm run test:int` green; live: edit model used with a reference, base model without (probed in 9.1)
- [x] 3.2 Document in `docs/phase-9-hybrid-image-model.md`
