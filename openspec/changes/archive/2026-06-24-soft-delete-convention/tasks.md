## 1. Schema

- [x] 1.1 Add `deletedAt DateTime?` to `Hero`, `Child`, `Book`, `BookPage`, `Illustration`; migration + `generate`

## 2. Soft deletes + filtered reads

- [x] 2.1 `heroes.service` — `remove` soft-deletes; `list`/`ownedHero`/`ensureMain`/`addCompanion` count filter `deletedAt: null`; `addCompanion` rollback soft-deletes
- [x] 2.2 `children.service` — `remove` soft-deletes (drop FK-conflict guard); `list`/`update`/`remove` filter `deletedAt: null`
- [x] 2.3 `books.service` — `list`/`getDraft`/`getOne`/`requireDraft`/`retry`/`cancel` filter `deletedAt: null`; `getOne` includes only live pages + illustrations; `createDraft` rollback soft-deletes
- [x] 2.4 `book-generation.processor` — replace `bookPage.deleteMany` with upsert by `(bookId, pageNum)`; soft-delete a page's prior illustration before creating the new one; soft-delete leftover pages beyond the new count

## 3. Verify + document

- [x] 3.1 `npm run build` + `npm run test:int` green (re-gen idempotent; nothing hard-deleted)
- [x] 3.2 Document in `docs/phase-9-soft-delete.md`
