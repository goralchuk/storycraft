# Phase 7.1–7.3 — Coin Data Model & Rules

Removes the dead subscription schema, locks the canonical coin data model, and
completes the coin business rules. OpenSpec changes: `coin-data-model` (7.1–7.2),
`coin-refund-on-failure` (7.3).

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

## 7.3 — Coin rules

The audit confirmed most coin rules already hold; only the refund was missing.

| Rule | Status |
|---|---|
| Every charge/credit flows through `CoinService` and writes a `CoinTransaction` | ✅ already (book type, page tier, companion, top-up, package purchase) |
| Hero free-attempt counters reset to 3 on book completion | ✅ already (`book-generation.processor.ts`) |
| Insufficient funds consistently returns 402 | ✅ already (`InsufficientCoinsException`; hero-generate 402 when out of attempts) |
| **Failed generation refunds the page-tier surcharge** | ✅ added (this change) |

### Refund on generation failure

The page-tier surcharge (`PAGE_16/20/24`) is charged at submit. If generation
fails, the worker now **refunds it**:

- `failAndRefund(book)` does a guarded transition `PENDING|PROCESSING → FAILED`
  via `updateMany`; the refund runs **only** when it flips exactly one row, so a
  retry / repeat failure of an already-terminal book never double-refunds.
- On that single transition, the page-tier amount is credited back with a
  `CoinTransaction` labeled `Refund: pages N` (linked to the book). Tier 12 has no
  surcharge, so nothing is refunded.
- The **book-type cost is not refunded** — the attempt consumed it; retry/recovery
  of a `FAILED` book is Phase 8.

Used in both failure paths (the defensive `!child` guard and the generation `catch`).

## Verification

- `prisma validate` clean; migration applied; backend `npm run build` clean.
- No remaining references to `Subscription` / its enums in `backend/src` or `frontend/src`.
- Refund: a failed paid generation credits the page-tier amount back and logs a
  `Refund: pages N` transaction; tier 12 refunds nothing.
