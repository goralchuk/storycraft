# Book Lifecycle

## Purpose

The book state machine from paid `DRAFT` through `PENDING` generation — draft creation with coin payment, single-active-draft, resume, configure-while-draft, and submit-to-generate. Coins are charged exactly once, at draft creation.

## Requirements

### Requirement: Book draft state

The system SHALL support a `DRAFT` book status representing a paid-but-unconfigured book. A book SHALL carry a `bookType` of `UNIQUE` or `TEMPLATE`. While a book is `DRAFT`, its `childId` and `templateId` MAY be unset (child is chosen during configuration; `templateId` applies only to `TEMPLATE` books).

#### Scenario: Draft has no child yet

- **WHEN** a draft is created before configuration
- **THEN** the book has status `DRAFT`, a `bookType`, and no `childId`

### Requirement: Pay-at-config draft creation

The system SHALL expose `POST /books/draft` accepting `bookType` and an optional `templateId`. It SHALL debit the book-type cost (`BOOK_UNIQUE` for `UNIQUE`, `BOOK_TEMPLATE` for `TEMPLATE`) from the user's coin balance using the catalog amount, create the book in `DRAFT`, and log a `CoinTransaction` referencing the book id. When the balance is insufficient, it SHALL return the insufficient-funds error and create no book.

#### Scenario: Unique draft debits 500

- **WHEN** a user with sufficient balance posts `{ "bookType": "UNIQUE" }`
- **THEN** a `DRAFT` book is created, `BOOK_UNIQUE` coins are debited, and a debit `CoinTransaction` referencing the book id is logged

#### Scenario: Template draft debits 300

- **WHEN** a user posts `{ "bookType": "TEMPLATE", "templateId": "<id>" }` with sufficient balance
- **THEN** a `DRAFT` book is created with that template and `BOOK_TEMPLATE` coins are debited

#### Scenario: Insufficient balance creates no draft

- **WHEN** a user without enough coins posts to `/books/draft`
- **THEN** the insufficient-funds error is returned, no book is created, and no coins are debited

### Requirement: One active draft per user

The system SHALL allow at most one active `DRAFT` per user. When a draft already exists, `POST /books/draft` SHALL return the existing draft without debiting coins again.

#### Scenario: Second draft request does not re-charge

- **WHEN** a user who already has a `DRAFT` posts to `/books/draft`
- **THEN** the existing draft is returned and no additional coins are debited

### Requirement: Resume the current draft

The system SHALL expose `GET /books/draft` returning the user's current `DRAFT` book (with its configuration), or an empty result when none exists. The book list (`GET /books`) SHALL exclude `DRAFT` books.

#### Scenario: Draft persists across requests

- **WHEN** a user creates a draft, then later calls `GET /books/draft`
- **THEN** the same draft is returned with its saved configuration

#### Scenario: List excludes drafts

- **WHEN** a user with a draft calls `GET /books`
- **THEN** the draft is not included in the returned list

### Requirement: Configure a draft without charging

The system SHALL expose `PATCH /books/:id` to update draft configuration fields (`childId`, `topicId`, `pageCount`, `promptText`, `writingStyle`, `fear`, `photoUrl`). The update SHALL be allowed only while the book is `DRAFT` and SHALL never debit coins.

#### Scenario: Saving step-2 fields does not charge

- **WHEN** a user patches their draft with a `childId` and other fields
- **THEN** the draft is updated and no coins are debited

#### Scenario: Patching a non-draft book is rejected

- **WHEN** a user patches a book whose status is not `DRAFT`
- **THEN** the request is rejected and the book is unchanged

### Requirement: Submit a draft for generation

The system SHALL expose `POST /books/:id/submit` which, for a `DRAFT` book with the required fields set (at least a child), transitions the book to `PENDING` and enqueues generation. It SHALL never re-charge the book-type cost. Submitting a draft missing required fields SHALL be rejected.

#### Scenario: Submit transitions and enqueues

- **WHEN** a user submits a configured `DRAFT` (child set)
- **THEN** the book becomes `PENDING`, a generation job is enqueued, and no coins are debited

#### Scenario: Submit without a child is rejected

- **WHEN** a user submits a `DRAFT` that has no `childId`
- **THEN** the request is rejected and the book stays `DRAFT`

### Requirement: Coins are debited exactly once per book

The system SHALL debit the book-type cost only at draft creation. Resume, configuration, and submission SHALL not debit the book-type cost again.

#### Scenario: Full lifecycle charges once

- **WHEN** a user creates a draft, patches it, leaves and resumes, then submits
- **THEN** the book-type cost appears as exactly one debit transaction for that book
