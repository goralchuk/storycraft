## ADDED Requirements

### Requirement: Dashboard draft banner

When the authenticated user has a paid book in `DRAFT` status, the dashboard SHALL show a banner offering to resume it, which navigates into the book wizard.

#### Scenario: Resume a draft

- **WHEN** the user has a `DRAFT` book and clicks the resume banner action
- **THEN** they are taken into the wizard to continue configuring that book

#### Scenario: No draft, no banner

- **WHEN** the user has no `DRAFT` book
- **THEN** the resume banner is not shown

### Requirement: Dashboard book grid

When the authenticated user has at least one book, the dashboard SHALL render a grid of book cards and a "new book" tile. Each book card SHALL show the title, the child it is for, the page count, and a status badge reflecting the book status (done / processing / failed).

#### Scenario: Books render with status

- **WHEN** the user has books in mixed statuses
- **THEN** each book appears as a card with its title, child, and a status badge matching its status

#### Scenario: New book tile

- **WHEN** the user clicks the "new book" tile
- **THEN** they are taken to the book wizard

### Requirement: Dashboard empty state

When the authenticated user has no books, the dashboard SHALL show an illustrated empty state with a call to action to create the first book.

#### Scenario: Empty state CTA

- **WHEN** a user with no books opens the dashboard
- **THEN** the empty state is shown and its CTA starts the book wizard
