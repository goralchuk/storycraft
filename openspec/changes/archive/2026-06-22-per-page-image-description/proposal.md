## Why

Illustrations are currently generated from the raw page **text** (a sentence with slot tokens stripped to bare words like "child"). That is a weak image prompt — it lacks scene, composition, mood and appearance cues, so pictures often don't match what the page depicts. The story model can do much better if it emits an explicit per-page scene description for the illustrator.

## What Changes

- The text generator emits a per-page **`imageDescription`** — a detailed Russian scene description (what happens, where, mood/lighting) — alongside the page text, keeping the existing `{ title, slots, pages[] }` contract.
- The generation worker stores each page's `imageDescription` on `Illustration.prompt` (an existing, currently-unused field) and builds the illustration from the **slot-resolved scene description** instead of the page text.
- The image-generator contract carries a `scene` (the resolved description) instead of the raw page text; stub/Qwen/Gemini generators use it directly.
- No schema migration (the `Illustration.prompt` column already exists); the page text, slots and stage/progress flow are unchanged.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `story-generation`: add that each page carries an illustration scene description and that illustrations are generated from it.

## Impact

- **Backend**: `ai/contracts.ts` (`GeneratedPage.imageDescription`, `ImageContext.scene`), `ai/story-prompt.ts` (prompt + `parseStory`), `tasks/book-generation.processor.ts` (store prompt, pass scene), and the three image generators (`qwen`, `gemini`, `stub`).
- **No API/DB change.**
