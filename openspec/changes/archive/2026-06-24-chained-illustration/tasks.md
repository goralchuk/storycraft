## 1. Context + prompt

- [x] 1.1 `ImageContext` += `plot`; qwen + gemini `buildPrompt` include it

## 2. Worker chaining

- [x] 2.1 Prepare companion portraits (HEROES stage) + a rolling previous-page reference
- [x] 2.2 Per image page, build references by `cast` (hero(s) + previous page), capped at 3; set `plot`; update the previous-page reference after each image

## 3. Verify + document

- [x] 3.1 `npm run build` + `npm run test:int` green; live chain check (page B keeps the same child + style as page A)
- [x] 3.2 Document in `docs/phase-9-chained-illustration.md`
