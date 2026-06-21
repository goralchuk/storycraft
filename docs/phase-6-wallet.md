# Phase 6.21 — Wallet

Adds the wallet API and screen — the last Phase-6 item. Clears the navbar
`/wallet` 404 and gives every "пополнить" hint a real destination. OpenSpec
change: `wallet`.

## What was built

### Backend — wallet API (`coin` module)

- **`CoinService.listTransactions(user)`** — the user's `CoinTransaction` ledger,
  newest first, capped at 100.
- **`CoinService.purchasePack(user, key)`** — stub top-up: loads the `PriceItem`,
  requires it to be `active` and `category === 'PACK'` (else `BadRequestException`),
  credits its `amount` (reusing the atomic `credit`), and returns `{ balance }`.
- **`CoinController`** (`@Controller('coins')`, `JwtAuthGuard`):
  - `GET /coins/transactions`
  - `POST /coins/purchase` `{ key }`
  Registered in `CoinModule`. No schema change — `CoinTransaction`/`PriceItem` exist
  and `PACK_300/800/2000/5000` are seeded.

### Frontend — `/wallet`

- **`app/actions/wallet.ts`** — `purchasePackAction(key)` posts `/coins/purchase` and
  `revalidatePath('/wallet')`.
- **`app/(app)/wallet/page.tsx`** (server) — fetches `/users/me`, `/coins/transactions`,
  and `getPricing()` (PACK only). Renders the dark balance hero card + starter-bonus
  card, the "Пополнить баланс" package grid, and the "История операций" list
  (label, date, signed amount; credit vs debit colouring).
- **`PackageGrid.tsx`** (client island) — one-click buy buttons via `useTransition`
  (disabled while pending), with popular/best-value badges on `PACK_800`/`PACK_5000`.

## Decisions

- **Stub purchase credits `PriceItem.amount` directly** — no real payment. Real
  money → coins (Stripe) is Phase 7; the `key → credit` endpoint shape stays.
- **No ₽ pricing / bonus coins** (those are Phase 7); packages credit exactly the
  catalog amount. The prototype's "Заработать монеты" coming-soon column was skipped
  as decorative.
- **Balance refresh**: `revalidatePath('/wallet')` updates the page's balance and
  history; the navbar badge (app-layout `/users/me`) refreshes on next navigation.

## Verification

- Backend `npm run build`; frontend `npm run lint` + `npm run build` clean; `/wallet`
  route registered.
- Flow: open `/wallet` → balance + packages + history render; buy a package → balance
  rises and a credit entry appears in history.

## Notes / follow-ups

- Phase 7 replaces the stub credit with a Stripe-backed purchase.
- With 6.21 done, the Phase-6 frontend redesign (6.12–6.21) is complete.
