## ADDED Requirements

### Requirement: Page-tier surcharge is refunded on generation failure

When a submitted book's generation fails, the system SHALL refund the page-tier
surcharge that was charged at submit, crediting it back with a `CoinTransaction`
referencing the book. The refund SHALL occur at most once per failed run — a re-run
or repeat failure of an already-terminal book SHALL NOT refund again. Tier `12` has
no surcharge and nothing to refund. The book-type cost SHALL NOT be refunded.

#### Scenario: Failure refunds the surcharge

- **WHEN** generation fails for a book submitted at page tier 20
- **THEN** the `PAGE_20` amount is credited back with a refund `CoinTransaction` referencing the book, and the book is `FAILED`

#### Scenario: Refund happens at most once

- **WHEN** an already-`FAILED` book's generation is processed again without a new submit
- **THEN** no additional refund is credited

#### Scenario: Included tier has nothing to refund

- **WHEN** generation fails for a book at page tier 12
- **THEN** no refund is credited and the book is `FAILED`
