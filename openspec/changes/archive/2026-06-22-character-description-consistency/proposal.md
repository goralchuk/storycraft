## Why

The main character's appearance drifts between pages because every illustration is generated independently from only its own scene description. The child already has a MAIN hero whose `description` (appearance) and `style` the user can set — feeding that into every illustration that depicts the child is the cheapest, always-available consistency lever. (A stronger reference-**image** lever is a separate task, 8.4, because it needs base64 downscaling to fit DashScope's ~6 MB request limit.)

## What Changes

- The generation worker loads the book child's **MAIN hero** and derives a character description (hero `description` + `style`).
- For each page that depicts the child (`featuresChild`), the worker passes that character description to the illustrator, which prepends a "keep the main character's appearance consistent across the book" instruction to the image prompt.
- When the MAIN hero has no description, behavior is unchanged (no-op) — generation never depends on it.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `story-generation`: add that illustrations of the main character are conditioned on a consistent character description from the MAIN hero.

## Impact

- **Backend**: `ai/contracts.ts` (`ImageContext.character`), `tasks/book-generation.processor.ts` (load MAIN hero, pass character on `featuresChild` pages), `qwen`/`gemini` image generators (prepend the character instruction). Stub unaffected.
- **No API/DB change.**
