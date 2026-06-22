## MODIFIED Requirements

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
