## 1. Data model & migration

- [ ] 1.1 Add `Role` enum (`USER | ADMIN`) and `User.role` (default `USER`) to `schema.prisma`
- [ ] 1.2 Add `User.balance` Int (default `500`) to `schema.prisma`
- [ ] 1.3 Add `CoinTransaction` model (`id`, `userId`, `label`, `amount` Int, `isIn` Boolean, `bookId` String?, `createdAt`) with relation to `User`
- [ ] 1.4 Add `PriceItem` model (`key` unique, `label`, `category`, `amount` Int, `active` Boolean default true, timestamps)
- [ ] 1.5 Run `prisma migrate dev` — migration applies clean

## 2. Seed

- [ ] 2.1 Seed all `PriceItem` rows (BOOK_UNIQUE 500, BOOK_TEMPLATE 300, PAGE_16 150, PAGE_20 300, PAGE_24 450, HERO_TOPUP 100, COMPANION 100, PACK_300, PACK_800, PACK_2000, PACK_5000) via idempotent upsert
- [ ] 2.2 Set `role = ADMIN` on the user with email `goralchuk.r@gmail.com` (if present); log whether it was applied
- [ ] 2.3 Run seed — PriceItem rows present; admin role set when the user exists

## 3. Roles & RBAC

- [ ] 3.1 Add `@Roles(...)` decorator (metadata key) under `auth/decorators`
- [ ] 3.2 Add `RolesGuard` that runs after `JwtAuthGuard`, loads the user's role from DB by `req.user.id`, and admits only matching roles (403 otherwise)
- [ ] 3.3 Apply `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(ADMIN)` to `SettingsController` (GET + PATCH)
- [ ] 3.4 Verify: non-admin → 403 on `/settings`; admin → 200; unauthenticated → 401

## 4. Coin service

- [ ] 4.1 Create `CoinModule` + `CoinService`
- [ ] 4.2 Implement `credit(userId, amount, label, bookId?)` — atomic balance update + `CoinTransaction` (isIn true) in one `prisma.$transaction`
- [ ] 4.3 Implement `debit(userId, amount, label, bookId?)` — atomic guard `balance - amount >= 0`, update + `CoinTransaction` (isIn false); throw insufficient-funds exception (402-style) otherwise
- [ ] 4.4 Add helper to resolve an amount from `PriceItem` by key (used by debit callers)
- [ ] 4.5 Verify: sufficient debit updates balance + ledger; insufficient debit leaves both unchanged and errors; credit increases balance + ledger

## 5. Pricing API + cache

- [ ] 5.1 Create `PricingModule` + `PricingService` with a Redis-backed cache (reuse existing Redis connection config; single key e.g. `pricing:active`)
- [ ] 5.2 `GET /pricing` (public, JWT-auth) — return active items from cache; on miss read DB and populate cache
- [ ] 5.3 `PATCH /pricing/:key` (admin-only via RolesGuard) — update `amount`, persist, then invalidate the cache key
- [ ] 5.4 Verify: first read populates cache, second read served from cache; admin PATCH reflects on next read; non-admin PATCH → 403

## 6. Frontend pricing access

- [ ] 6.1 Add a pricing fetch helper that calls `/pricing` through the Next.js data cache tagged `pricing`
- [ ] 6.2 Call `revalidateTag('pricing')` from the admin price-update path
- [ ] 6.3 Verify: screens reuse cached pricing without per-request DB hit; updated amount appears after admin change

## 7. Docs

- [ ] 7.1 Document `GET /pricing`, `PATCH /pricing/:key`, and the now-admin-only `/settings` in `docs/API.md`
