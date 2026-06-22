## Why

Today the generation pipeline runs against stub providers, so submitted books get placeholder text and fake images instead of a real story — no book had ever been generated. The default AI models in `AppSettings` were non-functional placeholders, the prompts were written in English, the PDF used a font with no Cyrillic glyphs, and the PDF builder was handed raw storage keys instead of fetchable URLs (so illustrations never embedded). The product could not show a real, readable Russian book — which is the core promise.

## What Changes

- Add **Qwen** (Alibaba DashScope) as a text and image provider and make it the default for both, with model ids `qwen3.7-plus` (text) and `qwen-image-2.0` (images). Gemini and stub remain selectable.
- Rewrite the story prompt so the model writes the title and page text in **Russian**, factored into a shared module reused by the OpenAI-compatible text providers.
- The Qwen image provider calls DashScope's `multimodal-generation` API, then **re-hosts** the returned temporary OSS image into our own MinIO and returns a storage key.
- Embed a Cyrillic Unicode font in the PDF, and **sign illustration storage keys** before embedding them so images actually appear in the PDF.
- Update the live `AppSettings` row and the schema defaults so a fresh database generates real Russian books out of the box.
- Provider selection remains runtime-switchable via `AppSettings`; slot-tokenization (`{{child}}`) and the existing stage/progress flow are unchanged.

## Capabilities

### New Capabilities
- `story-generation`: the content contract for generated books — language of the story, the default AI providers/models used, persistence of generated illustrations, and legible rendering of the generated content (including the PDF).

### Modified Capabilities
<!-- none: stage/progress, reader UI, and lifecycle behavior are unchanged -->

## Impact

- **Backend**: new `QwenTextGenerator` / `QwenImageGenerator`, shared `story-prompt` module, dispatcher + `AiModule` wiring; `AppSettings` schema defaults + a data migration; `pdf.service` font + signed-image fix; the processor signs illustration keys for the PDF; a bundled font asset.
- **Config**: requires `QWEN_API_KEY` in `backend/.env` (copied from the root key used by code review).
- **Runtime cost**: real Qwen calls now incur cost on every submission; integration tests stub the providers so they are unaffected.
- **No API surface change**: endpoints and the book data model are unchanged.
