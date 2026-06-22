## Context

The generation pipeline (`book-generation.processor`) already calls a `TextGenerator` and `ImageGenerator` chosen at runtime from `AppSettings` via dispatchers. This change adds Qwen (DashScope) as the default provider, makes the story Russian, and makes the PDF render Cyrillic and embed illustrations — without touching the stage/progress flow, the API surface, or the data model. The Qwen key already exists (used by code review); endpoints/model ids were verified with live calls.

## Goals / Non-Goals

**Goals:**
- A submitted book reaches `DONE` with a real Russian story and real Qwen illustrations.
- The downloadable PDF renders the Russian title + page text legibly and embeds each illustration.
- A fresh database generates real books with no manual setup; providers stay runtime-switchable.

**Non-Goals:**
- Character consistency across pages (image-to-image / reference) — separate change 8.3.
- Richer per-page `imageDescription` — separate change 8.2.
- Pipeline reliability/retry hardening, progress accuracy, observability (later Phase 8 tasks).

## Decisions

**1. Qwen via the verified DashScope surfaces.**
Text uses the OpenAI-compatible base `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` (mirrors the Gemini text generator). Images use the native `…/api/v1/services/aigc/multimodal-generation/generation` endpoint (synchronous), which returns a temporary OSS image URL. Model ids come from `AppSettings` (`qwen3.7-plus`, `qwen-image-2.0`).

**2. Re-host generated images.**
The OSS URL is time-limited, so `QwenImageGenerator` fetches the bytes and uploads them to MinIO, returning a storage key — same persistence contract as the Gemini generator.

**3. Shared Russian prompt.**
`STORY_SYSTEM_PROMPT` / `buildStoryPrompt` / `parseStory` live in `ai/story-prompt.ts`, reused by both Qwen and Gemini text generators (two OpenAI-compatible consumers). Slot-token rules and the `{ title, slots, pages[] }` shape are unchanged.

**4. PDF: Cyrillic font + signed images.**
Bundle `DejaVuSans.ttf` under `backend/src/pdf/fonts/`, register and select it, and copy it into `dist` via `nest-cli.json` assets. The processor signs each illustration's storage key (`storage.toUrl`) before handing it to the PDF builder, fixing illustrations never embedding.

**5. Flip defaults via migration.**
Schema `@default`s move to qwen, and the migration `UPDATE`s the live singleton off the previous values to qwen, guarding on non-deliberate values so an admin override is preserved.

## Risks / Trade-offs

- **Real cost on every submission** → acceptable for the testing phase; integration tests stub the providers.
- **Heavy PDFs** → Qwen returns 2048² PNGs; a full book PDF can be ~100 MB. Downscale/JPEG is a later hardening item.
- **Wrong/unavailable model id or quota error** → the generators throw `ServiceUnavailableException`; the processor marks the book `FAILED` and refunds the page surcharge (existing behavior).
- **Model may slip language or page count** → tolerated by `parseStory`; stricter validation is deferred to the hardening tasks.
