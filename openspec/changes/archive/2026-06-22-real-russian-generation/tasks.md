## 1. Shared Russian story prompt

- [x] 1.1 Factor `STORY_SYSTEM_PROMPT` / `buildStoryPrompt` / `parseStory` into `ai/story-prompt.ts` (Russian; keeps slot tokens and the `{ title, slots, pages[] }` contract)
- [x] 1.2 Refactor `GeminiTextGenerator` to use the shared module

## 2. Qwen providers

- [x] 2.1 Add `QwenTextGenerator` (OpenAI-compatible DashScope endpoint, model from `AppSettings.textModel`)
- [x] 2.2 Add `QwenImageGenerator` (multimodal-generation endpoint → fetch OSS URL → upload to MinIO → return key)
- [x] 2.3 Register both in `AiModule` and add the `qwen` case to the text/image dispatchers
- [x] 2.4 Add `QWEN_API_KEY` to the env schema and `backend/.env`

## 3. Provider defaults → Qwen

- [x] 3.1 Change `AppSettings` schema `@default`s to `qwen` / `qwen3.7-plus` / `qwen-image-2.0`
- [x] 3.2 Migration sets the new defaults and UPDATEs the live singleton off the previous values
- [x] 3.3 Apply the migration and confirm the live row reads Qwen

## 4. PDF: Cyrillic font + embedded images

- [x] 4.1 Bundle `DejaVuSans.ttf` under `backend/src/pdf/fonts/`; copy into `dist` via `nest-cli.json` assets
- [x] 4.2 Register and select the font in `PdfService`
- [x] 4.3 Sign each illustration storage key (`storage.toUrl`) before handing it to the PDF builder

## 5. Verify end-to-end

- [x] 5.1 `npm run build` green
- [x] 5.2 Live: a real book reaches `DONE` with a Russian story + real Qwen illustrations (slots/tokens preserved)
- [x] 5.3 Live: the downloaded PDF embeds the illustrations and renders Cyrillic (re-run grew from 11 KB text-only to ~18 MB with images, no fetch warnings)
- [x] 5.4 Image-to-image probe: `qwen-image-2.0` accepts a reference image input + `seed` (informs change 8.3)
- [ ] 5.5 Document the result in `docs/phase-8-*.md`
