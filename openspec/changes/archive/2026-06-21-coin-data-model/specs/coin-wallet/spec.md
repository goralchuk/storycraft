## ADDED Requirements

### Requirement: Coins are the sole monetization model

The system SHALL represent all user monetization state as three things only: a coin
balance on the user (`User.balance`), an append-only transaction ledger
(`CoinTransaction`), and a price catalog (`PriceItem`). The system SHALL NOT
maintain a subscription entity.

#### Scenario: No subscription state

- **WHEN** the data model is inspected
- **THEN** there is no subscription table or entity, and monetization state consists solely of the coin balance, the transaction ledger, and the price catalog

#### Scenario: Every balance change is a ledger entry

- **WHEN** a user's coin balance changes
- **THEN** a corresponding `CoinTransaction` records the change, so the balance is reconstructable from the ledger
