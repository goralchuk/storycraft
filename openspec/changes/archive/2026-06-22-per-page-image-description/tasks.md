## 1. Contracts

- [x] 1.1 Add `imageDescription: string` to `GeneratedPage` in `ai/contracts.ts`
- [x] 1.2 Replace `ImageContext.pageText` with `ImageContext.scene` (slot-resolved description)

## 2. Prompt + parsing

- [x] 2.1 `buildStoryPrompt`: ask for a per-page Russian `imageDescription` (scene, setting, mood), keeping the JSON contract
- [x] 2.2 `parseStory`: read `imageDescription` (default `''`)

## 3. Worker

- [x] 3.1 Store the (tokenized) `imageDescription` on `Illustration.prompt`
- [x] 3.2 Build the image from `resolveSlots(imageDescription || page.text, slots)` passed as `ImageContext.scene`

## 4. Image generators

- [x] 4.1 Update `qwen`, `gemini`, `stub` image generators to use `ctx.scene` directly (drop token-stripping); also updated the heroes service caller

## 5. Verify + document

- [x] 5.1 `npm run build` + `npm run test:int` green
- [x] 5.2 Live: a real book stores `imageDescription` on illustrations and the pictures reflect the described scene
- [x] 5.3 Document in `docs/phase-8-*.md`
