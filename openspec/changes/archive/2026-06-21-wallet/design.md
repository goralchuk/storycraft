## Context

`CoinService` already credits/debits atomically and writes a `CoinTransaction`
(`label`, `amount`, `isIn`, `bookId?`, `createdAt`) per change, and resolves prices
from `PriceItem` via `priceOf`. `PriceItem` rows of category `PACK` are seeded
(`PACK_300/800/2000/5000`, `amount` = coins). `GET /users/me` returns the balance;
`PrismaModule` is global. There is no controller on the `coin` module yet.

## Goals / Non-Goals

**Goals:**
- Expose the user's transaction history and a one-click stub top-up.
- A wallet screen on the design system: balance, packages, history.

**Non-Goals:**
- Real payments (Stripe) — Phase 7; purchase is an instant stub credit.
- Bonus-coin packages or ₽ pricing (the prototype's ₽/bonus belong to Phase 7);
  packages credit exactly `PriceItem.amount`.
- The prototype's "Заработать монеты" coming-soon cards.

## Decisions

- **New `CoinController` on the existing module.** `GET /coins/transactions` and
  `POST /coins/purchase` behind `JwtAuthGuard`. Two `CoinService` methods resolve the
  db user by email (as other services do) and reuse `credit`.
- **Purchase guard.** `purchasePack(key)` loads the `PriceItem`; it must be `active`
  and `category === 'PACK'`, else `BadRequestException`. It credits `amount` with a
  label like `Покупка пакета · {amount} 🪙` and returns `{ balance }`.
- **History shape & order.** Newest-first (`orderBy createdAt desc`), capped at 100
  to keep the payload bounded. Returns the raw ledger fields; the screen formats them.
- **Frontend data.** The server page fetches `/users/me` (balance/name),
  `/coins/transactions`, and `getPricing()` (filtered to `PACK`). Buy buttons are a
  small client island posting `purchasePackAction`, which POSTs and
  `revalidatePath('/wallet')` so the balance and history refresh.

## Risks / Trade-offs

- [Navbar balance lag after purchase] → the wallet page's own balance card updates on
  `revalidatePath('/wallet')`; the navbar (app-layout `/users/me`) refreshes on the
  next navigation. Acceptable for a stub top-up.
- [Stub purchase has no payment] → intentional; Phase 7 replaces the credit with a
  Stripe-backed flow. The endpoint shape (key → credit) stays.

## Open Questions

- None blocking.
