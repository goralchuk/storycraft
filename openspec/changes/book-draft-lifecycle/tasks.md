## 1. Data model & migration

- [x] 1.1 Add `DRAFT` to `BookStatus`; add `BookType` enum (`UNIQUE | TEMPLATE`) and `Book.bookType` (defaulted `UNIQUE`)
- [x] 1.2 Make `Book.childId` and `Book.templateId` nullable in `schema.prisma`
- [x] 1.3 Run `prisma migrate dev` — migration applies clean

## 2. Books service — draft lifecycle

- [x] 2.1 Import `CoinModule` into `BooksModule`; inject `CoinService` into `BooksService`
- [x] 2.2 `createDraft(user, { bookType, templateId? })` — return existing `DRAFT` if present (no charge); else create `DRAFT`, then debit `BOOK_UNIQUE`/`BOOK_TEMPLATE` via `CoinService` with the book id, deleting the draft and rethrowing if the debit fails
- [x] 2.3 `getDraft(user)` — return the user's current `DRAFT` (with config) or null
- [x] 2.4 Exclude `DRAFT` from `list(user)`
- [x] 2.5 `updateDraft(user, id, dto)` — update config fields; reject if the book is not `DRAFT`; never charge
- [x] 2.6 `submit(user, id)` — require `DRAFT` + `childId` set; transition to `PENDING`; enqueue generation; never charge
- [x] 2.7 Remove the eager `create`/`POST /books` path

## 3. Books controller

- [x] 3.1 `POST /books/draft`, `GET /books/draft`, `PATCH /books/:id`, `POST /books/:id/submit`; remove `POST /books`

## 4. Frontend — minimal vertical slice

- [x] 4.1 `/books/new` step 1 — type (unique/template) + template select; server action `createDraftAction` → `POST /books/draft`, then advance to config form
- [x] 4.2 Config form PATCHes the draft (`updateDraftAction`) and submit calls `submitBookAction` → `POST /books/:id/submit`; replace `createBookAction`
- [x] 4.3 Dashboard — "Continue draft" banner when `GET /books/draft` returns a draft, linking to resume at step 2

## 5. Docs

- [x] 5.1 Document `POST /books/draft`, `GET /books/draft`, `PATCH /books/:id`, `POST /books/:id/submit`, and removal of eager `POST /books` in `docs/API.md`

## 6. Verify

Verified against a live backend by driving the exact endpoints the server actions call (17/17 checks), plus a frontend production build (`/books/new`, `/dashboard` render as dynamic routes). Full click-through needs a Google session, which can't be automated here.

- [x] 6.1 Choose type → coins debited once, draft created, lands on config form (POST /books/draft: 500→200, one debit tx; resume returns step 2)
- [x] 6.2 Leave and return → dashboard shows "Continue draft"; resume restores config; balance unchanged (GET /books/draft resumes; second POST does not re-charge)
- [x] 6.3 Submit configured draft → book becomes `PENDING` and excluded from drafts; submit without child → 400; insufficient coins → 402 with no orphan book
