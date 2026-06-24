## Why

Generated assets (heroes, books, illustrations, and the upcoming generation history)
are expensive and reusable, but the code hard-deletes rows today: a user removing a
hero, a child removal, the create→rollback paths on failed payment, and the page
re-gen `deleteMany` all physically destroy data. Per the project rule, **code must
never hard-delete** — a "delete" marks the row and keeps it; real deletion is manual
only.

## What Changes

- **Soft-delete field.** Add `deletedAt DateTime?` to `Hero`, `Child`, `Book`,
  `BookPage`, `Illustration`. A non-null `deletedAt` means the row is logically deleted.
- **Reads exclude soft-deleted.** List/read queries filter `deletedAt: null`;
  soft-deleted rows don't count toward limits (`MAX_HEROES`) and aren't returned.
- **User deletes become soft.** `heroes.remove` and `children.remove` set `deletedAt`
  instead of deleting (children no longer need the FK-conflict guard).
- **Rollbacks soft-delete.** `createDraft` / `addCompanion`, on a failed charge,
  soft-delete the just-created row (not a hard `.delete()`; avoids nested
  transactions while keeping the `CoinTransaction.bookId` link).
- **Page re-gen updates in place.** The worker upserts pages by `(bookId, pageNum)`
  and soft-deletes a page's prior illustration before creating the new one, instead
  of `bookPage.deleteMany`.

## Capabilities

### New Capabilities
- `data-retention`: code never hard-deletes; deletions are soft (a flag/timestamp), reads exclude soft-deleted, and physical deletion is manual only.

### Modified Capabilities
<!-- none -->

## Impact

- **DB**: `deletedAt` on `Hero`, `Child`, `Book`, `BookPage`, `Illustration` (migration).
- **Backend**: `heroes.service`, `children.service`, `books.service`,
  `book-generation.processor` (reads filtered; removes/rollbacks/re-gen soft).
- **No frontend changes** (lists already only receive live rows).
- **Scope note**: each entity filters its own `deletedAt`; deep cascade-hiding (a
  soft-deleted child also hiding its books) is out of scope for now.
