# Phase 8.2 — Per-page image descriptions

Result of ROADMAP task 8.2. The story model now emits a dedicated per-page scene
description that drives each illustration, instead of illustrating from the raw
page sentence. OpenSpec change: `per-page-image-description` (modifies capability
`story-generation`).

## What was delivered

- **Contract.** `GeneratedPage` gains `imageDescription` (a Russian scene
  description: action, setting, poses/emotions, background, lighting, mood).
  `ImageContext.pageText` is replaced by `ImageContext.scene` (the slot-resolved
  description the worker passes to the image provider).
- **Prompt.** `buildStoryPrompt` asks for `imageDescription` per page (using the
  same `{{child}}` / `{{friend}}` tokens); `parseStory` reads it with a `''`
  default.
- **Worker.** For each page the worker resolves slots in
  `imageDescription || text` and passes it as `scene`; it stores the **tokenized**
  `imageDescription` on `Illustration.prompt` (an existing column — no migration).
- **Generators.** `qwen`, `gemini` and `stub` image generators now use
  `ctx.scene` directly (no more brace-stripping of page text); the heroes service
  caller was updated to the new field name.

## Design notes

- **Fallback.** If the model omits `imageDescription`, the worker falls back to the
  page text, so a non-compliant response never breaks generation.
- **Privacy/tokens.** The DB keeps the tokenized description (like page text);
  slots are resolved only when sending to the image provider.
- The stored `Illustration.prompt` is also a foundation for 8.3 (consistency /
  regeneration) and debugging.

## Verification (live)

A real 3-page book was generated: `status=DONE`, and each illustration carried a
detailed Russian `imageDescription` in `Illustration.prompt`, e.g.
"Солнечный день в ярком зелёном лесу. {{child}} … идут по лесной тропинке",
"Вечерний закат окрашивает лес в тёплые золотистые тона …". Tokens were preserved
in the stored prompt and the images were generated from the resolved scene.
`npm run build` and `npm run test:int` (9 tests) stay green.
