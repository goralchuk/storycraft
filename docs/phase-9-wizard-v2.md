# Phase 9.10 — Wizard v2 (style before heroes) + poller on the generation record

Result of ROADMAP task 9.10 — the last of Phase 9. The wizard now picks a real book
**style before heroes**, applies it to hero generation and the book, and step 3 reads
live progress from the `BookGeneration` record. OpenSpec change: `wizard-v2`
(modifies `book-wizard`, `generation-pipeline`).

## Per-book style (backend)

- `Book.styleTemplateId` (→ `StyleTemplate`); migration.
- `GET /styles` lists active style templates.
- `updateDraft` accepts `styleTemplateId` (saved on the draft).
- The worker assembler uses the book's style (`book.styleTemplateId`), falling back to
  the first active style when none is set.

## Wizard reorder (frontend)

Step 2 order is now **child → style → heroes → theme → length → wish → generate**:

- The old `WritingStyle`-enum "Стиль рисовки" picker is removed; a real `StyleTemplate`
  picker ("Стиль книги") sits right after the child and **before** heroes.
- The chosen `styleId` is passed to `generateHeroAction` (so portraits are generated
  in that style) and persisted via `saveDraftAction` (`styleTemplateId`).
- `books/new` loads `/styles`; the `Draft` type carries `styleTemplateId`.

## Poller on the generation record

`books/[id]` reads the latest `generation` (`currentStep`/`progress`) returned by
`GET /books/:id` (9.7), falling back to `Book.stage`/`progress`. The progress bar and
stage list now reflect the orchestration record.

## Verification

- Backend `npm run build` + `npm run test:int` green (12); frontend `tsc --noEmit`
  clean.
- Styles are seeded (9.3) and exposed via `GET /styles`; the assembler picks the
  book's style with a safe fallback (covered by the existing generation tests).

## Notes

- Template books keep style/topic/length frozen; the style picker shows for Unique
  books (template→style linkage can come later).
- This completes Phase 9; a full end-to-end book run in the app is the natural next
  manual check.
