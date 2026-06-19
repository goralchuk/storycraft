# Phase 6 — Coin Economy, Heroes, Pricing Admin & Full Redesign

## Overview

Phase 6 turns StoryCraft into a paid product driven by an internal **coin** currency and rebuilds the user journey from the prototype flow (`draft/design/STORYCRAFT_FLOW.md`). It is delivered as a sequence of thin vertical slices via OpenSpec.

**Status: in progress.**

| Slice | Scope | Status |
|---|---|---|
| 6.1–6.6 | Coin economy foundation — roles/RBAC, coin wallet, pricing catalog | ✅ Done |
| 6.7 | Book DRAFT lifecycle — pay-at-config, resume, submit | ✅ Done |
| 6.8–6.9 | Heroes (child-owned, metered generation) | ⏳ Pending |
| 6.10 | Pricing wiring — page-tier surcharges | ⏳ Pending |
| 6.11 | Generation stages (4 named stages + progress) | ⏳ Pending |
| 6.12–6.19 | Design system + redesigned screens + 3-step wizard | ⏳ Pending |
| 6.20 | Book reader (HTML spreads + on-demand PDF) | ⏳ Pending |
| 6.21 | Wallet — balance, history, coin packages | ⏳ Pending |

OpenSpec changes (archived under `openspec/changes/archive/`):
- `coin-economy-foundation` → main specs `rbac`, `coin-wallet`, `pricing-catalog`
- `book-draft-lifecycle` → main spec `book-lifecycle`

---

## Completed Slices

### 6.1–6.6 — Coin economy foundation

The economic core the rest of the phase builds on: who can do what (roles), how balances move (coins + ledger), and where prices live (a cached, admin-editable catalog).

- **Roles & RBAC** — `Role` enum (`USER | ADMIN`) on `User`; `RolesGuard` + `@Roles` decorator. The role is read from the DB in the guard (not the JWT) so changes take effect without re-issuing tokens. `/settings` is now admin-only (was open to any authenticated user).
- **Coin wallet** — `User.balance` (Int, default **500** on signup) and an append-only `CoinTransaction` ledger (`label`, `amount`, `isIn`, optional `bookId`). `CoinService.debit/credit` are atomic via `prisma.$transaction`; the debit guard (`updateMany … balance >= amount`) is race-safe and rejects overdraw with a 402-style `InsufficientCoinsException`.
- **Pricing catalog** — `PriceItem` (`key`, `label`, `category`, `amount`, `active`), seeded with all costs and coin packages. `GET /pricing` is Redis-cached (single key `pricing:active`); admin `PATCH /pricing/:key` writes the DB and invalidates the cache. Coin amounts are resolved from `PriceItem` by key — no hardcoded prices.
- **Frontend pricing** — `getPricing()` reads `/pricing` through the Next.js data cache under the `pricing` tag; the admin update action calls `updateTag('pricing')` (this Next version splits `revalidateTag(tag, profile)` vs `updateTag(tag)` — the latter gives read-your-own-writes in a Server Action).

**Seeded price keys:** `BOOK_UNIQUE` 500 · `BOOK_TEMPLATE` 300 · `PAGE_16` 150 · `PAGE_20` 300 · `PAGE_24` 450 · `HERO_TOPUP` 100 · `COMPANION` 100 · packages `PACK_300/800/2000/5000`. The admin is seeded by email (`goralchuk.r@gmail.com`).

Verified live (Postgres + Redis): RBAC `401/403/200`; `GET /pricing` cached + Redis key present; admin `PATCH` reflects on next read; non-admin `PATCH` → 403; unknown key → 404; coin debit/overdraw/credit + `priceOf`.

### 6.7 — Book DRAFT lifecycle

Splits book creation into **pay → configure → submit**, backed by a `DRAFT` state, so paying for a book and finishing it are separate, resumable steps.

- **DRAFT state** — `DRAFT` added to `BookStatus`; `BookType` enum (`UNIQUE | TEMPLATE`) on `Book`; `childId`/`templateId` made nullable (child chosen at step 2, template only for `TEMPLATE` books).
- **Pay-at-config** — `POST /books/draft { bookType, templateId? }` debits the book-type cost once (`BOOK_UNIQUE`/`BOOK_TEMPLATE`) and logs a `CoinTransaction` tagged with the book id. Exactly **one active draft per user** — a second call resumes the existing draft without charging. On insufficient funds the just-created draft is rolled back (no orphan, no double charge).
- **Resume** — `GET /books/draft` returns the current draft (drives the dashboard "Continue draft" banner); `GET /books` excludes drafts.
- **Configure** — `PATCH /books/:id` updates draft config (`childId, topicId, pageCount, …`), DRAFT-only, never charges.
- **Submit** — `POST /books/:id/submit` validates a child is set, transitions `DRAFT → PENDING`, and enqueues generation. Never re-charges. The eager `POST /books` create path was removed.
- **Frontend** — `/books/new` step 1 (type + template → pay) then step 2 (config → generate); dashboard "Continue draft" banner. Styling is temporary pending the redesign (6.12+).

Verified live: 17/17 lifecycle checks (charge-once, resume without re-charge, list excludes drafts, submit gating, insufficient-funds no-orphan) against the exact endpoints the UI calls, plus a clean frontend production build (`/books/new`, `/dashboard` render as dynamic routes). Full browser click-through needs a Google sign-in session and was not automated.

---

## Project Structure Added

```
backend/src/
├── coin/
│   ├── coin.module.ts
│   ├── coin.service.ts                 # atomic debit/credit + priceOf(key)
│   └── insufficient-coins.exception.ts # 402-style
├── pricing/
│   ├── pricing.module.ts
│   ├── pricing.controller.ts           # GET /pricing, admin PATCH /pricing/:key
│   └── pricing.service.ts              # Redis cache (pricing:active) + invalidation
└── auth/
    ├── decorators/roles.decorator.ts   # @Roles(...)
    └── guards/roles.guard.ts           # DB-backed role check

frontend/src/
├── lib/pricing.ts                      # getPricing() via tagged data cache
└── app/actions/pricing.ts             # admin update → updateTag('pricing')
```

Migrations: `20260619024959_coin_economy_foundation`, `20260619031927_book_draft_lifecycle`.

Edited: `schema.prisma` (`Role`/`BookType` enums, `DRAFT` status, `User.role`/`balance`, `CoinTransaction`, `PriceItem`, nullable `Book.child/template`, `Book.bookType`); `seed.ts` (price items + admin role); `settings.controller.ts` (admin-only); `books.{controller,service,module}.ts` (draft lifecycle + `CoinModule`); `book-generation.processor.ts` (null-template/child tolerance); `app.module.ts` (`CoinModule`, `PricingModule`); `package.json` (`ioredis`); frontend `books/new/page.tsx`, `actions/books.ts`, `dashboard/page.tsx`; `docs/API.md`.

---

## API Endpoints Added / Changed

| Method | Path | Notes |
|---|---|---|
| GET | `/pricing` | Active catalog, Redis-cached |
| PATCH | `/pricing/:key` | 👑 admin — update amount + invalidate cache |
| GET/PATCH | `/settings` | now 👑 admin-only (was any authenticated user) |
| POST | `/books/draft` | pay + create DRAFT (one per user); 402 on insufficient coins |
| GET | `/books/draft` | resume current draft, or `null` |
| PATCH | `/books/:id` | configure a DRAFT (409 if not draft) |
| POST | `/books/:id/submit` | DRAFT → PENDING + enqueue (400 without child) |
| ~~POST~~ | ~~`/books`~~ | removed (replaced by the draft flow) |

Full details in `docs/API.md`.

---

## Key Decisions

- **Coins are the only internal spending currency.** Real money buys coin packages (Phase 7); there is no coin→fiat conversion. Subscriptions are dropped in favor of coins.
- **`PriceItem` is the single source of truth** for all costs; changing a price is an admin API call + cache invalidation, not a deploy.
- **Role checked from the DB in the guard**, not the JWT — safe against staleness/forgery on the few admin endpoints.
- **A draft is a `Book` in an earlier state** (nullable child/template) rather than a separate table — the wizard fields map 1:1 to `Book` columns.
- **Charge exactly once, at draft creation**; resume/configure/submit never re-charge; failed payment rolls the draft back.

---

## Out of Scope (later in Phase 6 / later phases)

Heroes (6.8–6.9), page-tier surcharges (6.10), generation-stage UI (6.11), the visual redesign and 3-step wizard (6.12–6.19), the book reader (6.20), and the wallet screen (6.21). Real-money coin purchases are Phase 7; referral/promo/marketplace coin earning is Phase 8.
