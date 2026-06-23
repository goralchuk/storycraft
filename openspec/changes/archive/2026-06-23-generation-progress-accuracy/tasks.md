## 1. Worker

- [x] 1.1 Move the main-hero lookup + reference-image prep into the `HEROES` stage (before `STORY`); bump `HEROES` progress once the reference is ready
- [x] 1.2 Weight the `30→90%` illustration band by image-generating pages (skip `TEXT_ONLY`); keep it non-decreasing and ending at `90` before `ASSEMBLE`

## 2. Verify + document

- [x] 2.1 `npm run build` + `npm run test:int` green (add a test: progress is non-decreasing through the stages and reaches 100)
- [x] 2.2 Document in `docs/phase-8-progress-accuracy.md`
