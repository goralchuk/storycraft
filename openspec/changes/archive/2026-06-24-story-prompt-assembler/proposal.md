## Why

The story prompt currently carries only the child + template/topic text. The v2
pipeline needs a **deterministic assembler** that composes the full final prompt from
all sources — child profile, the MAIN hero (description + VL caption + personality),
companions, the theme, the chosen style, and per-size requirements — and that drives
the page structure (layout + which characters appear) from `PageLayoutTemplate`
instead of letting the model pick layouts ad hoc.

## What Changes

- **Assembled story prompt.** `StoryContext` gains the MAIN hero brief, companion
  briefs, the style prompt, the resolved page-layout, and the child age;
  `buildStoryPrompt` composes them into the blocks from `draft/promts/04-book-prompt.md`.
- **Template-driven page structure.** The worker resolves the `PageLayoutTemplate`
  for the book's `pageCount` and, after the story is generated, sets each page's
  `layout` and `featuresChild` from that template (cast `MAIN`/`ALL` ⇒ the child is
  shown), so layout is deterministic and matches the seeded design.
- **Heroes + style gathered by the worker.** The worker loads the child's live heroes
  once (MAIN + companions) and resolves the style (the first active `StyleTemplate`
  for now; per-book style selection arrives with the wizard in 9.10).

## Capabilities

### Modified Capabilities
- `generation-pipeline`: the final story prompt is assembled from child + heroes + theme + style + requirements, and per-page layout/cast is driven by the page-layout template.

## Impact

- **Backend**: `StoryContext` (+ hero/style/layout/age fields) and `buildStoryPrompt`
  (new blocks); the worker gathers heroes + style + layout and enforces the layout
  post-parse. No DB / frontend changes (style selection + `Book.styleTemplateId` land
  in 9.10).
- Prompt **content** (theme/style/requirements wording) is authored separately in
  `draft/promts/` — this builds the mechanism.
