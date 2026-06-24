# Phase 9.6 — Final-prompt assembler

Result of ROADMAP task 9.6. The story prompt is now assembled deterministically from
every source, and per-page layout/cast is driven by the page-layout template. OpenSpec
change: `story-prompt-assembler` (modifies `generation-pipeline`). Prompt **content**
(theme/style/requirements wording) is authored separately in `draft/promts/`.

## Assembled prompt

`StoryContext` gained `age`, `mainHero` / `companions` (`HeroBrief`), `stylePrompt`,
and `pageLayout` (`PageLayoutSlot[]`). `buildStoryPrompt` composes the blocks from
`draft/promts/04-book-prompt.md`:

- child name + profile disambiguation (9.4) + interests;
- **main hero** — description + portrait VL caption + personality (kept consistent);
- **companions** — role/name + brief each;
- **style** — the chosen style prompt;
- **page structure** — per-page `layout` + cast (who's in frame);
- **requirements** — exactly `pageCount` paragraphs, age-based length, story arc.

Verified the assembled prompt carries every block (live `buildStoryPrompt` dump with a
rich context: main hero, companion, style, structure, age all present).

## Template-driven page structure

The worker resolves the `PageLayoutTemplate` for the book's `pageCount` and, after the
story is generated, sets each page's `layout` and `featuresChild` from the template
(cast `MAIN`/`ALL` ⇒ the child is shown) — so layout is deterministic and matches the
seeded design, instead of an ad-hoc per-page model choice. When no template exists for
the size, the generated layout is kept.

## Heroes + style gathering

The worker loads the child's live heroes once (MAIN + companions) and builds briefs;
the style is the first active `StyleTemplate` (per-book style selection +
`Book.styleTemplateId` arrive with the wizard in 9.10).

## Verification

- `npm run build` + `npm run test:int` green (12).
- Assembled-prompt block check (all blocks present); pages follow the layout template.

## Notes

- Layout is now template-driven; the model's `layout` field is overridden post-parse.
- The assembled `storyPrompt` will be persisted on `BookTemplateHistory` in 9.7.
