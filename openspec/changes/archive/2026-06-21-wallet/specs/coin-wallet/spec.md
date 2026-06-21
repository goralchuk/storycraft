## ADDED Requirements

### Requirement: Transaction history endpoint

The system SHALL expose the authenticated user's coin transactions, newest first,
each with its label, amount, direction (credit or debit), timestamp, and optional
book reference.

#### Scenario: List own transactions

- **WHEN** a user requests their coin transactions
- **THEN** their ledger entries are returned newest first

### Requirement: Coin package purchase

The system SHALL provide a stub top-up that credits a coin package's amount from
the price catalog and logs the transaction, returning the new balance. Only active
`PACK`-category prices SHALL be purchasable; any other key SHALL be rejected
without changing the balance.

#### Scenario: Purchase credits coins

- **WHEN** a user purchases a valid coin package
- **THEN** their balance increases by the package amount and a credit transaction is recorded

#### Scenario: Invalid package rejected

- **WHEN** a user attempts to purchase a non-package or unknown price key
- **THEN** the request is rejected and the balance is unchanged
