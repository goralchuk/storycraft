## 1. Remove dead subscription schema (7.1)

- [x] 1.1 `prisma/schema.prisma`: remove the `Subscription` model, the `SubscriptionPlan` and `SubscriptionStatus` enums, and the `User.subscription` relation field
- [x] 1.2 Generate the migration (`prisma migrate dev --name drop_subscription`) — DROP TABLE + enum types; regenerate the Prisma client
- [x] 1.3 Confirm no references remain (`backend/src`, `frontend/src`) and the backend builds

## 2. Lock & document the coin data model (7.2)

- [x] 2.1 Write `docs/phase-7-coin-data-model.md` — the three coin tables (`User.balance`, `CoinTransaction`, `PriceItem`), their fields, and the no-other-monetization-state invariant

## 3. Verify

- [x] 3.1 `prisma validate` + backend `npm run build` clean; `prisma migrate status` shows the new migration applied
