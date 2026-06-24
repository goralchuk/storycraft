## Why

Generation v2 needs persistence for: a visual **style** chosen before heroes, a
per-size **page layout**, an **orchestration record + step log** so stages aren't
lost, and a **reusable story history** (tokenized story + assembled prompts) saved
alongside each book. This task lays down that data model and seed placeholders; the
behavior that fills it comes in 9.4–9.7. Prompt content (styles, themes, scaffolds)
is authored separately by the product owner.

## What Changes

- **New tables**
  - `StyleTemplate` — visual style (a prompt fragment) for image generation.
  - `PageLayoutTemplate` — per-`pageCount` ordered page layout (`layout` JSON).
  - `BookGeneration` — orchestration record (status/step/progress/error/timing).
  - `BookGenerationLog` — per-step log.
  - `BookTemplateHistory` — child-agnostic, tokenized story + slots schema + the
    assembled `storyPrompt` + style/theme refs (reusable; re-render swaps child slots).
- **New enum** `GenerationStatus { PENDING PROCESSING DONE FAILED }`.
- **Modified models**
  - `Hero` += `imageCaption?`, `personality?`.
  - `Template` (reused as the story **theme**) += `isCustomBase` (the base scaffold
    used when the parent writes their own story).
  - `Book` += `bookTemplateHistoryId?` + relation.
- **Seeds (placeholders)**: ≥1 `StyleTemplate`, a `PageLayoutTemplate` for each
  supported size (12/16/20/24), and a custom-base `Template`.

## Capabilities

### New Capabilities
- `generation-pipeline`: story style and page layout are template-driven, and a custom story-theme base exists — all available as a seeded catalog.

### Modified Capabilities
<!-- none -->

## Impact

- **DB**: 5 new tables + `GenerationStatus` enum; `Hero`/`Template`/`Book` columns (migration).
- **Backend**: `prisma/seed.ts` placeholders. No business logic yet (9.4+ consumes the model).
- **No frontend changes.**
