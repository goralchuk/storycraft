# Phase 9.3 — Generation v2 data model

Result of ROADMAP task 9.3. Lays down the persistence for generation v2 — styles,
page layouts, a generation orchestrator + log, and a reusable story history — plus
seed placeholders. No business logic yet (9.4+ consumes the model). OpenSpec change:
`generation-data-model` (new capability `generation-pipeline`).

## New tables

| Table | Purpose |
|---|---|
| `StyleTemplate` | Visual style (a prompt fragment for image gen), chosen before heroes. |
| `PageLayoutTemplate` | Per-`pageCount` ordered layout: for each page its `layout` + which characters appear (`cast`) + `hasImage`. |
| `BookGeneration` | Orchestrator for one generation run: `status` (`GenerationStatus`), `currentStep`, `progress`, `error`, `startedAt`/`finishedAt`. |
| `BookGenerationLog` | Per-step log (`step`, `level`, `message`, `payload`). |
| `BookTemplateHistory` | Child-agnostic, tokenized story (`title`, `slots` schema, `pages`) + the assembled `storyPrompt` + `styleTemplateId`/`themeTemplateId` + `meta`. Re-render swaps the child slots. |

New enum `GenerationStatus { PENDING PROCESSING DONE FAILED }`.

## Modified models

- **`Hero`** += `imageCaption?`, `personality?`.
- **`Template`** (reused as the story **theme**) += `isCustomBase` — the scaffold used
  when the parent writes their own story.
- **`Book`** += `templateHistoryId?` + `templateHistory` relation, and a
  `generations` back-relation. (`finishedAt` is added in 9.7.)

## Seeds (placeholders — real prompts authored later)

- 2 `StyleTemplate` (`Акварель`, `Мультяшный`).
- `PageLayoutTemplate` for **12 / 16 / 20 / 24** — page 1 = cover (all heroes),
  ending features the main hero, middle alternates image / image+text / text-only.
- A custom-base `Template` (`tpl-custom`, `isCustomBase = true`).

## Verification

- `prisma migrate dev` (migration `generation_data_model`) + `prisma generate` +
  `npm run build` clean; `prisma db seed` runs.
- Fresh-DB catalog confirmed live: 2 active styles, page layouts for 12/16/20/24,
  1 custom theme.
- `npm run test:int` green (12).

## Notes

- `BookGeneration` / `BookGenerationLog` / `BookTemplateHistory` tables exist now but
  are populated by the worker in 9.6/9.7; this task only creates the model + seeds.
- The `slots` schema on `BookTemplateHistory` doubles as the token list; reuse
  overrides the child slot(s) per the agreed rule.
