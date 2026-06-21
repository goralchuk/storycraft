## Context

`User.balance`, `CoinTransaction`, and `PriceItem` already hold all monetization
state, managed by `CoinService` (atomic credit/debit + ledger) and the price catalog
(`priceOf`, `getPricing`). The `Subscription` model + its two enums + `User.subscription`
are leftovers from the abandoned subscription model and are referenced nowhere in code
(verified across `backend/src` and `frontend/src`). The project uses Prisma 7 (pg
adapter; `url` in `prisma.config.ts`).

## Goals / Non-Goals

**Goals:**
- Remove the dead `Subscription` schema cleanly via a migration.
- Document the canonical three-table coin data model.

**Non-Goals:**
- Touching `Rating`/`Referral` (kept for Phase 10).
- Coin behavioural rules (7.3) or pricing tunability (7.4).
- Rewriting historical phase docs that mention subscriptions.

## Decisions

- **Schema removal.** Delete the `Subscription` model, `SubscriptionPlan` and
  `SubscriptionStatus` enums, and the `User.subscription` field. Run
  `prisma migrate dev --name drop_subscription` to generate + apply the migration
  (DROP TABLE "Subscription", DROP TYPE for both enums). Requires the dev DB up.
- **No code changes.** Nothing imports these types, so only the schema/migration and
  generated client change.
- **Documentation.** `docs/phase-7-coin-data-model.md` records the three coin tables,
  their fields, and the invariant that no other table holds monetization state — the
  reference for testing the economy before payments.

## Risks / Trade-offs

- [Destructive migration] → `Subscription` is unused and effectively empty; dropping it
  loses no real data. The init migration stays in history; the new migration is additive
  to the migration log.
- [Dev DB must be running to generate the migration] → if unavailable, author the
  migration SQL by hand under a new timestamped folder and `prisma migrate deploy`.

## Open Questions

- None blocking.
