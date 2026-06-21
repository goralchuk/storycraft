# Wallet Screen

## Purpose

The frontend wallet — the user's coin balance, purchasable coin packages, and the
transaction history.

## Requirements

### Requirement: Wallet balance and packages

The `/wallet` screen SHALL show the user's current coin balance and the available
coin packages from the price catalog, each purchasable in one click.

#### Scenario: Balance and packages render

- **WHEN** the user opens the wallet
- **THEN** their current balance and the available coin packages are shown

#### Scenario: Buy a package

- **WHEN** the user buys a coin package
- **THEN** their balance increases by the package amount and the wallet reflects the new balance and a new history entry

### Requirement: Transaction history

The wallet SHALL list the user's coin transactions, newest first, showing each
entry's label, date, and signed amount.

#### Scenario: History lists transactions

- **WHEN** the user opens the wallet
- **THEN** their past coin operations are listed newest first
