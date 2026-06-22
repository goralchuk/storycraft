## Context

After 8.1, illustrations are generated from `ImageContext.pageText` (the page sentence), with tokens stripped to bare words. The story model can emit a far richer scene description per page. The `Illustration.prompt` column already exists and is unused — a natural home for the stored description. This change is contained to the AI contracts, the shared prompt, the worker, and the three image generators.

## Goals / Non-Goals

**Goals:**
- A dedicated per-page Russian scene description drives each illustration.
- The description is persisted (for debugging and future regeneration/QC in 8.3).

**Non-Goals:**
- Character consistency / reference images (8.3).
- Page layout variants (8.4).
- Any DB migration or API change.

## Decisions

**1. Contract shape.** Add `imageDescription: string` to `GeneratedPage`, and replace `ImageContext.pageText` with `ImageContext.scene` (the already slot-resolved description the worker passes in). The generators stop stripping tokens — the worker resolves slots once, centrally.

**2. Slot resolution + privacy.** The worker resolves slots in `imageDescription` before sending it to the image provider (consistent with how PDF text is resolved), and stores the **tokenized** `imageDescription` on `Illustration.prompt` (DB stays tokenized, like page text).

**3. Fallback.** If the model omits/empties `imageDescription`, the worker falls back to the page text, so generation never breaks on a non-compliant response.

**4. Prompt.** `buildStoryPrompt` asks for `imageDescription` per page (scene, setting, mood); `parseStory` reads it with a `''` default.

## Risks / Trade-offs

- **Model omits `imageDescription`** → handled by the page-text fallback.
- **Slightly larger text response / cost** → negligible vs image cost.
- **Stub generator** must accept the new `scene` field — updated to keep tests/stub provider working.
