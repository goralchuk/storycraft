## 1. Backend — per-book style

- [x] 1.1 `Book.styleTemplateId` (+ relation); migration + `generate`
- [x] 1.2 `GET /styles` lists active style templates
- [x] 1.3 `updateDraft` accepts `styleTemplateId`; draft returns it
- [x] 1.4 Worker assembler uses `book.styleTemplateId` (else first active style)

## 2. Frontend — wizard reorder

- [x] 2.1 `books/new` loads `/styles`; `Draft` += `styleTemplateId`
- [x] 2.2 `WizardStep2`: real `StyleTemplate` picker placed after child, before heroes; remove the `WritingStyle`-enum picker
- [x] 2.3 Thread `styleId` into `generateHeroAction` (hero portraits in the chosen style) and persist it via `saveDraftAction`

## 3. Frontend — poller

- [x] 3.1 `books/[id]` reads the latest `generation` (`currentStep`/`progress`), falling back to `stage`/`progress`

## 4. Verify + document

- [x] 4.1 `npm run build` + `npm run test:int` green; frontend `tsc --noEmit` clean
- [x] 4.2 Document in `docs/phase-9-wizard-v2.md`
