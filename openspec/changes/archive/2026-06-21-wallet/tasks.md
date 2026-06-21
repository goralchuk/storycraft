## 1. Backend — wallet API

- [x] 1.1 `CoinService`: add `listTransactions(user)` (resolve db user by email; `CoinTransaction` where userId, `orderBy createdAt desc`, take 100)
- [x] 1.2 `CoinService`: add `purchasePack(user, key)` — load `PriceItem`, require `active` && `category === 'PACK'` (else `BadRequestException`), `credit` the amount with a label, return `{ balance }`
- [x] 1.3 Add `CoinController` (`@Controller('coins')`, `JwtAuthGuard`): `GET /coins/transactions`, `POST /coins/purchase`; register it in `CoinModule`

## 2. Frontend — wallet screen

- [x] 2.1 `app/actions/wallet.ts`: `purchasePackAction(key)` → POST `/coins/purchase`, `revalidatePath('/wallet')`
- [x] 2.2 `app/(app)/wallet/page.tsx` (server): fetch `/users/me`, `/coins/transactions`, `getPricing()` (PACK only); render balance + starter-bonus cards, package grid (buy island), history list
- [x] 2.3 Package buy buttons as a small client island posting `purchasePackAction`; badges for popular/best-value packages

## 3. Verify & document

- [x] 3.1 Backend builds (`npm run build`); frontend `npm run lint` + `npm run build` clean
- [x] 3.2 Manual E2E: open `/wallet` → balance + packages + history render; buy a package → balance rises, history gains an entry; navbar badge updates on navigation
- [x] 3.3 Write `docs/phase-6-wallet.md`
