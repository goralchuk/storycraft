## 1. Schema

- [x] 1.1 `Book.finishedAt DateTime?`; migration + `generate`

## 2. Worker orchestration

- [x] 2.1 On claim, create a `BookGeneration` (PROCESSING, startedAt, step HEROES); advance `currentStep`/`progress` per stage and write a `BookGenerationLog` per transition
- [x] 2.2 On DONE: `BookGeneration` → DONE + finishedAt; `Book.finishedAt`; create `BookTemplateHistory` (title/slots/pages + assembled `storyPrompt` + style/theme refs) and link `Book.templateHistoryId`
- [x] 2.3 On failure: `BookGeneration` → FAILED + error + failing stage; log
- [x] 2.4 `onModuleInit` closes orphaned `PROCESSING` generations (FAILED)

## 3. API

- [x] 3.1 `books.service.getOne` includes the latest `generation`

## 4. Verify + document

- [x] 4.1 `npm run build` + `npm run test:int` green (assert: generation + logs created; history + `finishedAt` on DONE; FAILED generation on failure)
- [x] 4.2 Document in `docs/phase-9-orchestration.md`
