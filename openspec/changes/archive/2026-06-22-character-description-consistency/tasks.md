## 1. Contract

- [x] 1.1 Add optional `character?: string` to `ImageContext` in `ai/contracts.ts`

## 2. Worker

- [x] 2.1 Load the book child's MAIN hero; build a character description from `description` (+ `style`)
- [x] 2.2 Pass `character` to `generateImage` on `featuresChild` pages (omit when empty)

## 3. Image generators

- [x] 3.1 `qwen` / `gemini` generators: when `ctx.character` is present, prepend a "keep the main character's appearance consistent across the book: <character>" instruction to the prompt
- [x] 3.2 Stub generator unaffected

## 4. Verify + document

- [x] 4.1 `npm run build` + `npm run test:int` green
- [x] 4.2 Live: a book whose MAIN hero has a vivid description generates child-facing pages that reflect it (image URLs reported for visual check)
- [x] 4.3 Document in `docs/phase-8-*.md`
