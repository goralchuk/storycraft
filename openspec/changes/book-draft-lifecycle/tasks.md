## 1. Data model & migration

- [ ] 1.1 Add `DRAFT` to `BookStatus`; add `BookType` enum (`UNIQUE | TEMPLATE`) and `Book.bookType` (defaulted `UNIQUE`)
- [ ] 1.2 Make `Book.childId` and `Book.templateId` nullable in `schema.prisma`
- [ ] 1.3 Run `prisma migrate dev` — migration applies clean

## 2. Books service — draft lifecycle

- [ ] 2.1 Import `CoinModule` into `BooksModule`; inject `CoinService` into `BooksService`
- [ ] 2.2 `createDraft(user, { bookType, templateId? })` — return existing `DRAFT` if present (no charge); else create `DRAFT`, then debit `BOOK_UNIQUE`/`BOOK_TEMPLATE` via `CoinService` with the book id, deleting the draft and rethrowing if the debit fails
- [ ] 2.3 `getDraft(user)` — return the user's current `DRAFT` (with config) or null
- [ ] 2.4 Exclude `DRAFT` from `list(user)`
- [ ] 2.5 `updateDraft(user, id, dto)` — update config fields; reject if the book is not `DRAFT`; never charge
- [ ] 2.6 `submit(user, id)` — require `DRAFT` + `childId` set; transition to `PENDING`; enqueue generation; never charge
- [ ] 2.7 Remove the eager `create`/`POST /books` path

## 3. Books controller

- [ ] 3.1 `POST /books/draft`, `GET /books/draft`, `PATCH /books/:id`, `POST /books/:id/submit`; remove `POST /books`

## 4. Frontend — minimal vertical slice

- [ ] 4.1 `/books/new` step 1 — type (unique/template) + template select; server action `createDraftAction` → `POST /books/draft`, then advance to config form
- [ ] 4.2 Config form PATCHes the draft (`updateDraftAction`) and submit calls `submitBookAction` → `POST /books/:id/submit`; replace `createBookAction`
- [ ] 4.3 Dashboard — "Continue draft" banner when `GET /books/draft` returns a draft, linking to resume at step 2

## 5. Docs

- [ ] 5.1 Document `POST /books/draft`, `GET /books/draft`, `PATCH /books/:id`, `POST /books/:id/submit`, and removal of eager `POST /books` in `docs/API.md`

## 6. Verify (through the UI)

- [ ] 6.1 Choose type → coins debited once, draft created, lands on config form
- [ ] 6.2 Leave and return → dashboard shows "Continue draft"; resume restores config; balance unchanged
- [ ] 6.3 Submit configured draft → book becomes `PENDING` and appears in the list; submit without child rejected; insufficient coins blocks draft creation
