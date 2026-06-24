## ADDED Requirements

### Requirement: Deletions are soft

Application code SHALL NOT physically delete user-facing or generated records
(`Hero`, `Child`, `Book`, `BookPage`, `Illustration`). A deletion SHALL set a
`deletedAt` timestamp and keep the row. Physical deletion is a manual (operator)
action only.

#### Scenario: User removes a hero

- **WHEN** a user removes a generated hero
- **THEN** the hero row is marked `deletedAt` and retained, not physically deleted

#### Scenario: Failed-charge rollback keeps the row

- **WHEN** a draft book or companion hero is created and the coin charge then fails
- **THEN** the just-created row is soft-deleted (marked `deletedAt`), not physically deleted

### Requirement: Reads exclude soft-deleted rows

List and read queries SHALL return only rows with `deletedAt` null, and soft-deleted
rows SHALL NOT count toward limits (e.g. the per-child hero limit) or appear in
returned book pages and illustrations.

#### Scenario: Soft-deleted hero is hidden and uncounted

- **WHEN** a child's heroes are listed after one hero was soft-deleted
- **THEN** the soft-deleted hero is not returned and does not count toward the hero limit

#### Scenario: Book pages exclude soft-deleted

- **WHEN** a book is read after regeneration
- **THEN** only live pages and their live illustrations are returned

### Requirement: Regeneration does not hard-delete pages

When the worker regenerates a book, it SHALL update pages in place (by
`(bookId, pageNum)`) and soft-delete a page's prior illustration before creating the
new one, rather than physically deleting pages. A re-run SHALL leave no duplicate or
orphaned live rows.

#### Scenario: Re-run replaces pages in place

- **WHEN** generation runs again for a book that already has pages
- **THEN** each page is updated in place and its previous illustration is soft-deleted, with no duplicate live pages
