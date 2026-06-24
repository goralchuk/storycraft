## 1. Base model default

- [x] 1.1 `AppSettings.imageModel` default → `qwen-image-2.0`; migration

## 2. VL caption wrapper

- [x] 2.1 Extract shared `ai/image-data-uri.ts` (`toDataUri(storage, key)`); processor uses it
- [x] 2.2 `ImageCaptioner` contract + `QwenImageCaptioner` (`qwen3-vl-flash`); register + export in `AiModule`

## 3. Hero prompt v2

- [x] 3.1 `GenerateHeroDto += styleId?`; resolve `StyleTemplate.prompt`
- [x] 3.2 `heroes.generate` builds the prompt from the child profile (MAIN → human-child disambiguation via `childDescriptor`; companions keep their nature) + style; saves description
- [x] 3.3 Caption the generated portrait (fail-open) → `Hero.imageCaption`

## 4. Verify + document

- [x] 4.1 `npm run build` + `npm run test:int` green; live: a MAIN hero «Лев» renders as a boy in the chosen style, with a saved caption
- [x] 4.2 Document in `docs/phase-9-hero-generation.md`
