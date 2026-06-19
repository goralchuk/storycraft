## Context

The backend is NestJS + Prisma (Postgres via the `@prisma/adapter-pg` pattern), with Redis already in `docker-compose` and used by BullMQ. Auth is JWT (Passport): `JwtStrategy.validate` currently returns only `{ id, email }`, and `SettingsController` is guarded by `JwtAuthGuard` alone — any authenticated user can read/write settings. Seeding lives in `backend/prisma/seed.ts` (idempotent `upsert`s) and reads `DATABASE_URL` directly. This change adds the economic core (roles, coins, pricing) that the rest of Phase 6 builds on; it is backend-only plus a thin frontend pricing-fetch helper.

## Goals / Non-Goals

**Goals:**
- Add `Role` to `User` and a reusable `RolesGuard` + `@Roles` decorator; close the `/settings` hole.
- Add `User.balance` and an append-only `CoinTransaction` ledger with an atomic, guarded `CoinService`.
- Add a DB-backed `PriceItem` catalog as the single source of truth for coin amounts, with a Redis-cached public read and a cache-invalidating admin write.
- Give the frontend a cached pricing read keyed by a tag, refreshed on admin update.

**Non-Goals:**
- Real-money purchase of coin packages (Phase 7) — wallet "buy" stays a later stub.
- Charging for books/pages/heroes (6.10/6.9) and any UI screens — only the services/keys they depend on are built here.
- Earning coins via referrals/promos/marketplace (Phase 8).

## Decisions

**Role check loads from DB in the guard (not from the JWT).**
`RolesGuard` reads the user's current role from the DB by `req.user.id` rather than trusting a role claim in the token. Rationale: role rarely changes but must not be stale or forgeable, admin endpoints are low-traffic, and it avoids re-issuing tokens on role change. Alternative considered: embed `role` in the JWT payload (faster, no DB hit) — rejected for staleness/security on the few admin calls. `JwtAuthGuard` runs first to populate `req.user`; `RolesGuard` runs after.

**`PriceItem` is the single source of truth; no hardcoded amounts.**
`CoinService` and later charge sites resolve cost by key from `PriceItem`. Keys are stable identifiers (`BOOK_UNIQUE`, `PAGE_16`, `HERO_TOPUP`, `PACK_300`, …); only `amount`/`active` are editable. Rationale: prices change without deploys; admin API + cache invalidation is the supported path. A `category` groups items (`BOOK`, `PAGE`, `HERO`, `PACK`) for UI/filtering.

**Atomicity via a Prisma transaction.**
Debit/credit run as one `prisma.$transaction`: re-read balance, guard `balance - amount >= 0` for debit, update `User.balance`, and insert the `CoinTransaction`. Rationale: balance and ledger must never diverge; the guard inside the transaction prevents overdraw under concurrency. Insufficient funds throws a domain error mapped to HTTP `402`/`409` (decision: `402 Payment Required`-style via a dedicated exception) so callers can redirect to the wallet.

**Pricing cache: one Redis key, write-through invalidation.**
Cache the active catalog under a single key (e.g. `pricing:active`) reusing the existing Redis connection config. `GET /pricing` reads cache → on miss loads DB and sets the key; `PATCH /pricing/:key` writes DB then deletes the key. Rationale: the catalog is small and read-mostly; a single key keeps invalidation trivial. No TTL needed because writes always invalidate (a short safety TTL is acceptable).

**Frontend uses the Next.js data cache under a tag.**
The pricing fetch helper tags the request (e.g. `tag: 'pricing'`); the admin update path calls `revalidateTag('pricing')`. Rationale: matches the App Router SSR approach already in use and avoids a per-request round trip; the admin mutation is the single invalidation point.

**Seeding is idempotent and email-driven for admin.**
Extend `seed.ts` to upsert all `PriceItem` rows and to set `role = ADMIN` on the user with email `goralchuk.r@gmail.com` if present. New-user defaults (`balance = 500`, `role = USER`) live as Prisma schema defaults so signup needs no extra code.

## Risks / Trade-offs

- **Per-call DB read for role** → Mitigation: admin endpoints are rare; can later cache role or move to JWT claim if it ever matters.
- **Cache/DB drift if an invalidation is missed** → Mitigation: single invalidation point on write; optional short TTL as a backstop; cache is trivially rebuildable from DB.
- **Concurrent debits racing** → Mitigation: guard inside the `$transaction`; rely on row update + re-check so an overdraw fails rather than going negative.
- **Admin seeded only if the email exists** → Mitigation: seed logs whether the admin was set; document that the admin must sign in once before seeding (or re-run seed after first login).
- **Breaking change on `/settings`** → Mitigation: documented in proposal/API.md; only affects non-admins, who should not have had access.

## Migration Plan

1. Prisma migration: add `Role` enum, `User.role` (default `USER`) and `User.balance` (default `500`); create `CoinTransaction` and `PriceItem`.
2. Run `prisma migrate dev`; extend and run `seed.ts` (PriceItems + admin role).
3. Deploy backend (guard, coin service, pricing module). Rollback: revert migration (drops new columns/tables) and code; no destructive change to existing tables beyond added columns with defaults.

## Open Questions

- Exact HTTP status for insufficient funds — proposing `402`-style via a custom exception; confirm during implementation if a different code fits the frontend redirect better.
- Whether a small safety TTL on the pricing cache key is worth adding alongside write-through invalidation.
