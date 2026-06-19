## 1. Data model & migration

- [x] 1.1 Add `BookStage` enum (`HEROES | STORY | ILLUSTRATIONS | ASSEMBLE`) and `Book.stage` (nullable) + `Book.progress` Int default 0
- [x] 1.2 Run `prisma migrate dev` — migration applies clean

## 2. Worker reports stage + progress

- [x] 2.1 At `process` start (with `PROCESSING`) set `stage = HEROES`, `progress = 5`
- [x] 2.2 Before text generation set `stage = STORY`, `progress = 15`
- [x] 2.3 Set `stage = ILLUSTRATIONS` and, per generated image, `progress = 30 + round(60 * done/total)`
- [x] 2.4 Before PDF assembly set `stage = ASSEMBLE`, `progress = 90`; on `DONE` set `progress = 100`
- [x] 2.5 On failure leave the stage (set only `FAILED`)

## 3. Reset on submit

- [x] 3.1 `BooksService.submit` clears `stage` (null) and sets `progress = 0`

## 4. Frontend — stage label + progress bar

- [x] 4.1 `/books/[id]` viewer: while `PENDING`/`PROCESSING`, render the stage as a label (Queued / Creating heroes / Writing the story / Drawing illustrations / Assembling the book) and a progress bar from `progress`; keep `StatusPoller`

## 5. Docs

- [x] 5.1 Note `stage` + `progress` read fields on `GET /books/:id` in `docs/API.md`

## 6. Verify

- [x] 6.1 Submit a (stub) book and observe stage advance STORY → ILLUSTRATIONS (progress rising) → ASSEMBLE → DONE at `progress` 100
- [x] 6.2 Submitted draft starts with `stage` null / `progress` 0; progress is non-decreasing through the run
- [x] 6.3 A forced failure sets `FAILED` and leaves the last stage
