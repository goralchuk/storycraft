## 1. Context + prompt

- [x] 1.1 `StoryContext` += `mainHero?`, `companions?`, `stylePrompt?`, `pageLayout?`, `age?` (+ `HeroBrief`, `PageLayoutSlot` types)
- [x] 1.2 `buildStoryPrompt` assembles the blocks (hero / companions / style / requirements / page structure) per `draft/promts/04-book-prompt.md`

## 2. Worker assembly

- [x] 2.1 Load the child's live heroes once (MAIN + companions) → hero briefs; resolve the style (first active `StyleTemplate`); resolve `PageLayoutTemplate` for `pageCount`
- [x] 2.2 After generation, set each page's `layout` + `featuresChild` from the page-layout template (cast `MAIN`/`ALL` ⇒ child shown)

## 3. Verify + document

- [x] 3.1 `npm run build` + `npm run test:int` green; assembled prompt carries all blocks; pages follow the layout template
- [x] 3.2 Document in `docs/phase-9-prompt-assembler.md`
