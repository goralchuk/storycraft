# Coin Wallet

## Purpose

Internal coin balance per user, an append-only transaction ledger, and an atomic debit/credit service with a balance guard.

## Requirements

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

### Requirement: User coin balance

The system SHALL maintain an integer coin `balance` on every `User`. New users SHALL start with a balance of `500`. The balance SHALL never be negative.

#### Scenario: New user receives starting balance

- **WHEN** a new user is created
- **THEN** their coin balance is `500`

### Requirement: Coin transaction ledger

The system SHALL record every change to a user's balance as a `CoinTransaction` with a `label`, an `amount` (positive integer), an `isIn` flag (true for credit, false for debit), a timestamp, and an optional `bookId`. Transactions SHALL be append-only.

#### Scenario: Debit writes a transaction

- **WHEN** coins are debited from a user
- **THEN** a `CoinTransaction` is recorded with `isIn = false` and the debited amount

#### Scenario: Credit writes a transaction

- **WHEN** coins are credited to a user
- **THEN** a `CoinTransaction` is recorded with `isIn = true` and the credited amount

### Requirement: Atomic debit with balance guard

The system SHALL debit coins and write the corresponding transaction in a single atomic operation. A debit SHALL be rejected when it would drive the balance below zero, leaving the balance and ledger unchanged and returning an insufficient-funds error.

#### Scenario: Sufficient balance is debited

- **WHEN** a user with balance `500` is debited `300`
- **THEN** the balance becomes `200` and a debit transaction is recorded

#### Scenario: Insufficient balance is rejected

- **WHEN** a user with balance `200` is debited `300`
- **THEN** an insufficient-funds error is returned, the balance stays `200`, and no transaction is recorded

### Requirement: Atomic credit

The system SHALL credit coins and write the corresponding transaction in a single atomic operation.

#### Scenario: Credit increases balance

- **WHEN** a user with balance `200` is credited `300`
- **THEN** the balance becomes `500` and a credit transaction is recorded

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
