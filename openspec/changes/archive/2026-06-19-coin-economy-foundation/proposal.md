## Why

Phase 6 turns StoryCraft into a paid product driven by an internal **coin** currency: every book, page tier, and hero generation costs coins. Before any wizard, wallet, or hero screen can be built, the backend needs the economic foundation — who can do what (roles), how balances move (coins + transactions), and where prices live so they can be changed without a deploy (a cached, admin-editable catalog). This change delivers that foundation (ROADMAP 6.1–6.6).

## What Changes

- **Roles & access control** — add a `Role` enum (`USER | ADMIN`) to `User`, a `RolesGuard` + `@Roles` decorator, and apply it to admin-only endpoints. The existing `/settings` endpoints (currently open to any authenticated user) become admin-only. One admin is seeded by email. **BREAKING**: `/settings` now returns `403` for non-admins.
- **Coin wallet** — `User.balance` (Int, default 500 on signup) and a `CoinTransaction` ledger (`label`, `amount`, `isIn`, optional `bookId`). A `CoinService` performs atomic debit/credit with a balance guard, rejecting overdraw with an insufficient-funds error and writing a transaction for every balance change.
- **Pricing catalog** — a `PriceItem` table (`key`, `label`, `category`, `amount`, `active`) seeded with all current costs and coin packages. Public `GET /pricing` serves the active catalog, cached in Redis. Admin-only `PATCH /pricing/:key` updates an amount and invalidates the cache.
- **Frontend pricing access** — the Next.js app reads `/pricing` through the data cache under a tag, so screens don't hit the API/DB per request; an admin price update triggers `revalidateTag` to refresh it.
- Coin amounts are read from `PriceItem` (single source of truth) — no hardcoded prices in the coin/book logic.

Out of scope (later phases): real-money purchase of coin packages (Phase 7), wizard/wallet/hero UI screens (later in Phase 6), earning coins via referrals/promos/marketplace (Phase 8).

## Capabilities

### New Capabilities
- `rbac`: User roles (`USER`/`ADMIN`) and role-based authorization for admin-only API endpoints.
- `coin-wallet`: Internal coin balance per user, an append-only transaction ledger, and an atomic debit/credit service with a balance guard.
- `pricing-catalog`: Admin-editable, DB-backed catalog of coin prices and packages, served via a cached public read API and a cache-invalidating admin write API, consumed by the frontend through a tagged data cache.

### Modified Capabilities
<!-- No existing capability specs in openspec/specs/ yet; all capabilities here are new. -->

## Impact

- **Backend (NestJS + Prisma/Postgres)**: new `prisma/schema.prisma` models (`CoinTransaction`, `PriceItem`), `User` additions (`role`, `balance`); a Prisma migration; seed updates (admin role by email, default coin balance, `PriceItem` rows). New `RbacModule`/guard, `CoinModule`/service, `PricingModule`/controller. `SettingsController` gains `@Roles(ADMIN)`.
- **Cache**: Redis (already in `docker-compose`) used to cache the pricing read; cache invalidated on admin write.
- **Frontend (Next.js App Router)**: a pricing fetch helper using the data cache + tag, and a `revalidateTag` call wired to the admin update path.
- **API**: new `GET /pricing`, `PATCH /pricing/:key`; `/settings` now admin-guarded. Documented in `docs/API.md`.
- **Consumers**: later Phase 6 subtasks (book pricing 6.10, heroes 6.9, wallet 6.21) depend on `CoinService` and `PriceItem` keys defined here.
