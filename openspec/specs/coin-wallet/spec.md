# Coin Wallet

## Purpose

Internal coin balance per user, an append-only transaction ledger, and an atomic debit/credit service with a balance guard.

## Requirements

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
