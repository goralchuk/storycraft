# Phase 8.1 — Real generation in Russian (Qwen)

Result of ROADMAP task 8.1. Stands up real book generation on the Qwen family so
a submitted book reaches `DONE` with a real Russian story and real illustrations,
viewable in the reader and as a PDF. OpenSpec change: `real-russian-generation`
(capability `story-generation`).

## What was delivered

- **Qwen providers.** New `QwenTextGenerator` (DashScope OpenAI-compatible
  `…/compatible-mode/v1/chat/completions`) and `QwenImageGenerator` (native
  `…/api/v1/services/aigc/multimodal-generation/generation`, synchronous).
  Registered in `AiModule` and selectable via the existing dispatchers
  (`stub` ↔ `qwen` ↔ `gemini`).
- **Models** (from `AppSettings`): text `qwen3.7-plus`, image `qwen-image-2.0`.
- **Russian story.** The prompt was moved to a shared `ai/story-prompt.ts`
  (`STORY_SYSTEM_PROMPT` / `buildStoryPrompt` / `parseStory`), reused by both the
  Qwen and Gemini text generators. It instructs Russian output while keeping the
  slot-token contract (`{{child}}`, `{{friend}}`) and the `{ title, slots, pages[] }`
  JSON shape.
- **Image re-hosting.** Qwen returns a temporary Alibaba OSS image URL; the
  generator fetches the bytes and uploads them to our MinIO, returning a storage
  key (same persistence contract as the Gemini generator).
- **PDF.** Embedded a Cyrillic Unicode font (`DejaVuSans.ttf`, bundled under
  `src/pdf/fonts/`, copied into `dist` via `nest-cli.json` assets) so Russian text
  renders. Fixed a bug where the PDF builder received raw storage keys: the
  processor now signs each illustration key (`storage.toUrl`) before embedding, so
  illustrations actually appear in the PDF.
- **Defaults.** `AppSettings` schema `@default`s moved to qwen; a migration
  (`appsettings_qwen_defaults`) sets the new defaults and flips the live singleton
  off the previous values. `QWEN_API_KEY` added to the env schema and
  `backend/.env`.

## Configuration

- `QWEN_API_KEY` in `backend/.env` (the same DashScope key used by code review).
- Endpoints are international DashScope (`dashscope-intl.aliyuncs.com`).
- Providers/models are runtime-switchable via `AppSettings` (admin); `gemini` and
  `stub` remain available.

## Verification (live)

- A real 3-page book generated end-to-end: `status=DONE`, `progress=100`, real
  Russian title + page text, slots/tokens preserved, 3 Qwen illustrations stored
  in MinIO and shown in the reader. ~90–100s for 3 pages.
- PDF: after the signed-image fix the downloaded PDF grew from ~11 KB (text-only)
  to ~18 MB (images embedded) with no image-fetch warnings, and renders Cyrillic.
- Integration tests (`npm run test:int`, 9 tests) stay green — they stub the
  providers, so no tokens are spent and Qwen wiring does not affect them.

## Image-to-image probe (informs 8.3)

A live probe confirmed `qwen-image-2.0` (multimodal-generation) **accepts an input
image** in the `content` array alongside text (reference / image-to-image) and
**accepts a `seed` parameter** — both returned HTTP 200 with a generated image. So
character consistency in 8.3 can pass the MAIN hero's `imageKey` as a reference +
detailed character description + scene text (+ optional previous page, + seed).
Note: classic `denoising_strength` does not apply to this surface — consistency is
controlled by the reference image, prompt and seed.

## Known limitations (deferred)

- **PDF size.** Qwen returns 2048² PNGs; a full 16–24 page book PDF can reach
  ~100 MB. Downscaling / JPEG is a hardening item.
- **Model compliance.** The model may occasionally bake the real name into the
  title or vary page count; tolerated by `parseStory`, stricter validation is left
  to later hardening tasks.
- Character consistency across pages (8.3) and richer per-page `imageDescription`
  (8.2) are separate, not-yet-started tasks.
