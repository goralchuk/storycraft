## Why

`/wallet` is the last Phase-6 screen and currently 404s, yet the navbar coin badge
and every "пополнить" hint already point at it. The coin ledger and debit/credit
service exist, but nothing exposes the user's transaction history or a way to top
up. 6.21 adds the wallet API (history + a stub package purchase that reads
`PriceItem`) and the screen.

## What Changes

- **Backend — wallet API (new `CoinController`):**
  - `GET /coins/transactions` — the authenticated user's ledger, newest first.
  - `POST /coins/purchase` `{ key }` — stub top-up: validates an active `PACK`-category
    price, credits its `PriceItem.amount`, logs the credit, returns the new balance.
    Unknown / inactive / non-`PACK` keys are rejected.
- **Frontend — `/wallet` screen:**
  - Balance hero card + starter-bonus card.
  - "Пополнить баланс" grid of coin packages (`PACK_*` from `getPricing()`), each
    bought in one click via a `purchasePackAction` (POST `/coins/purchase`).
  - "История операций" — the transaction list, newest first (label, date, signed amount).

## Capabilities

### Modified Capabilities
- `coin-wallet`: add the transaction-history and coin-package-purchase endpoints
  (the balance/ledger/atomic debit-credit already exist).

### New Capabilities
- `wallet-screen`: the frontend wallet — balance, coin packages, and history.

## Impact

- **Backend**: `coin` module gains a `CoinController` + two `CoinService` methods
  (`listTransactions`, `purchasePack`); no schema change (`CoinTransaction` /
  `PriceItem` already exist; `PACK_*` are seeded).
- **Frontend**: new `app/(app)/wallet/page.tsx` + a small client island for the buy
  buttons + `app/actions/wallet.ts`. Clears the navbar `/wallet` 404 and gives the
  "пополнить" links a real destination.
- **Scope boundary**: real money → coins (Stripe) is Phase 7; purchase here is a
  stub instant credit. The prototype's "Заработать монеты" coming-soon column is
  decorative and out of scope.
- **Visual source of truth**: `draft/design/StoryCraft.dc.html` (wallet ~745–835).
