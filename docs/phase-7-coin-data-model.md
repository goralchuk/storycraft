# Phase 7.1–7.2 — Coin Data Model

Removes the dead subscription schema and locks the canonical coin data model.
OpenSpec change: `coin-data-model`.

## 7.1 — Removed schema

The abandoned subscription design left dead schema, referenced nowhere in
`backend/src` or `frontend/src`. Dropped via migration
`20260621203743_drop_subscription`:

- `Subscription` model (one-to-one with `User`, held Stripe + plan fields)
- `SubscriptionPlan` enum (`FREE`/`BASIC`/`PRO`)
- `SubscriptionStatus` enum (`ACTIVE`/`CANCELED`/`PAST_DUE`/`TRIALING`)
- `User.subscription` relation

`Rating` and `Referral` are intentionally **kept** — reserved for Phase 10
(ratings, referral program).

## 7.2 — The coin data model (locked)

All user monetization state lives in exactly **three** tables. Nothing else holds
coin/price state.

### `User.balance` — current balance

| field | type | notes |
|---|---|---|
| `balance` | `Int` | coins on hand; `@default(500)` starting bonus; never negative |

The balance is the running total; it is always reconstructable from the ledger.

### `CoinTransaction` — append-only ledger

| field | type | notes |
|---|---|---|
| `id` | `String` | cuid |
| `userId` | `String` | owner (cascade delete) |
| `label` | `String` | human-readable reason (e.g. `Book (unique)`, `Покупка пакета · 800 🪙`) |
| `amount` | `Int` | positive magnitude of the change |
| `isIn` | `Boolean` | `true` = credit, `false` = debit |
| `bookId` | `String?` | optional link to the book that caused the change |
| `createdAt` | `DateTime` | timestamp |

Every balance change writes one row (via `CoinService.credit`/`debit`), so the
ledger is the audit trail and the balance is derivable from it.

### `PriceItem` — price catalog

| field | type | notes |
|---|---|---|
| `key` | `String` | primary key (e.g. `BOOK_UNIQUE`, `PAGE_16`, `HERO_TOPUP`, `COMPANION`, `PACK_800`) |
| `label` | `String` | display label |
| `category` | `String` | grouping (`BOOK` / `PAGE` / `HERO` / `PACK` …) |
| `amount` | `Int` | coin cost (for charges) or coins granted (for `PACK_*`) |
| `active` | `Boolean` | inactive keys are not resolvable/purchasable |
| `createdAt` / `updatedAt` | `DateTime` | |

Resolved on the backend via `CoinService.priceOf(key)` and on the frontend via
`getPricing()`. Seeded in `prisma/seed.ts`.

## Invariant

Monetization state = `User.balance` + `CoinTransaction` + `PriceItem`. No
subscription entity exists. This is the base the rest of Phase 7 (coin rules,
tunable pricing, full coin E2E) builds and tests on, ahead of payments (Phase 9).

## Verification

- `prisma validate` clean; migration applied; backend `npm run build` clean.
- No remaining references to `Subscription` / its enums in `backend/src` or `frontend/src`.
