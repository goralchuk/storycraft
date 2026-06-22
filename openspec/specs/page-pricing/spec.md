# Page Pricing

## Purpose

Book length as a priced page tier (12/16/20/24) with a surcharge charged once at submission, on top of the book-type cost.
## Requirements
### Requirement: Book length is a priced page tier

The system SHALL represent a book's length as a page tier of `12`, `16`, `20`, or `24` pages, stored in `Book.pageCount`. Tier `12` is the included default. `PATCH /books/:id` SHALL accept `pageCount` only when it is one of these tiers and SHALL reject any other value.

#### Scenario: Valid tier is accepted

- **WHEN** a user patches a draft with `pageCount` 20
- **THEN** the draft's `pageCount` becomes 20

#### Scenario: Invalid tier is rejected

- **WHEN** a user patches a draft with `pageCount` 13
- **THEN** the request is rejected and the draft is unchanged

### Requirement: Page-tier surcharge is charged once at submit

On `POST /books/:id/submit`, the system SHALL debit the page-tier surcharge for the draft's tier — `PAGE_16`, `PAGE_20`, or `PAGE_24` from the price catalog — before transitioning the book to `PENDING`. Tier `12` has no surcharge. The surcharge SHALL be charged at most once per book (submit runs only on a `DRAFT`), and the book-type cost SHALL NOT be re-charged.

#### Scenario: Larger tier debits its surcharge

- **WHEN** a user submits a `DRAFT` with `pageCount` 20 and enough coins
- **THEN** `PAGE_20` coins are debited, the book becomes `PENDING`, and a surcharge `CoinTransaction` referencing the book id is logged

#### Scenario: Included tier has no surcharge

- **WHEN** a user submits a `DRAFT` with `pageCount` 12
- **THEN** no surcharge is debited and the book becomes `PENDING`

### Requirement: Unaffordable surcharge keeps the draft

When the user cannot afford the page-tier surcharge at submit, the system SHALL return the insufficient-funds error, keep the book in `DRAFT`, and NOT enqueue generation.

#### Scenario: Insufficient coins blocks submission

- **WHEN** a user submits a `DRAFT` whose page-tier surcharge exceeds their balance
- **THEN** the insufficient-funds error is returned, the book stays `DRAFT`, and no generation job is enqueued

### Requirement: Page-tier surcharge is refunded on generation failure

When the user **declines** a `FAILED` book, the system SHALL refund the page-tier
surcharge that was charged at submit, crediting it back with a `CoinTransaction`
referencing the book, and move the book to `CANCELLED`. Generation failure by itself
SHALL NOT refund — a failed book keeps its coins so the user can retry for free. The
refund SHALL occur at most once, enforced by a guarded `FAILED → CANCELLED`
transition. Tier `12` has no surcharge and nothing to refund. The book-type cost
SHALL NOT be refunded.

#### Scenario: Decline refunds the surcharge

- **WHEN** the user declines a `FAILED` book submitted at page tier 20
- **THEN** the `PAGE_20` amount is credited back with a refund `CoinTransaction` referencing the book, and the book is `CANCELLED`

#### Scenario: Failure alone does not refund

- **WHEN** a book's generation fails
- **THEN** the book is `FAILED` and no coins are refunded

#### Scenario: Refund happens at most once

- **WHEN** a book that is already `CANCELLED` is declined again
- **THEN** no additional refund is credited

#### Scenario: Included tier has nothing to refund

- **WHEN** the user declines a `FAILED` book at page tier 12
- **THEN** the book becomes `CANCELLED` and no refund is credited

