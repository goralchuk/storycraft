## Why

Phase 6 left the coin economy working, but the schema still carries the abandoned
`Subscription` model (+ `SubscriptionPlan`/`SubscriptionStatus` enums + the
`User.subscription` relation) from the pre-coin design. It is dead — referenced
nowhere in `backend/src` or `frontend/src` — and misleads anyone reading the DB.
Phase 7 starts by removing it and locking/documenting the canonical coin data
model, so the remaining coin work (7.3–7.5) builds on a clean, well-defined base
that is fully testable without a payment provider.

## What Changes

- **Remove dead schema.** Drop the `Subscription` model, the `SubscriptionPlan`
  and `SubscriptionStatus` enums, and the `User.subscription` relation; generate the
  Prisma migration (DROP table + types). `Rating` and `Referral` are **kept**
  (reserved for Phase 10 ratings/referrals).
- **Lock & document the coin data model.** The single source of monetization state
  is three tables — `User.balance` (current balance), `CoinTransaction` (append-only
  ledger), `PriceItem` (price catalog) — captured in `docs/phase-7-coin-data-model.md`.

## Capabilities

### Modified Capabilities
- `coin-wallet`: add a requirement that coins (balance + ledger + catalog) are the
  sole monetization model and there is no subscription entity.

## Impact

- **Backend**: `prisma/schema.prisma` (remove model/enums/relation) + a new migration.
  No application code references `Subscription`, so no `src` changes.
- **Docs**: new `docs/phase-7-coin-data-model.md`; the stale "Subscription" mentions
  in older phase docs are historical and left as-is.
- **DB**: dropping `Subscription` is destructive but the table is unused (empty in any
  real flow); the migration removes the table and its enum types.
- **Scope boundary**: coin *rules* (refunds, counter resets, 402 consistency) are 7.3;
  tunable pricing is 7.4; full coin E2E is 7.5. Payments remain Phase 9.
