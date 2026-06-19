## Why

AI-generated books need consistent characters: a hero whose look is fixed once and reused across pages and across books. The prototype models this as per-child heroes (a main hero + companions) with **metered avatar generation** — a few free tries, then paid top-ups — which is also a coin sink. This change adds child-owned heroes and their billing (ROADMAP 6.8–6.9), the foundation the wizard's hero step (6.18) and hero-driven illustration reuse build on.

## What Changes

- **Hero model** — a `Hero` owned by `Child`: one non-removable `MAIN` hero (derived from the child) plus up to 4 companions (`PET | SIBLING | FRIEND | MAGIC`), **max 5 per child**. Fields: `role`, `name`, `style`, `description`, `imageKey`, `freeAttempts` (default 3), `status` (`IDLE | GENERATING | DONE`).
- **Hero API** (`HeroesModule`):
  - `GET /children/:childId/heroes` — list heroes; lazily ensure the `MAIN` hero exists.
  - `POST /children/:childId/heroes` — add a companion; debits `COMPANION` (100); rejects a 5th hero and a second `MAIN`.
  - `DELETE /heroes/:id` — remove a companion; rejects deleting `MAIN`.
  - `POST /heroes/:id/generate` — generate the avatar (style + description → `ImageGenerator`), store `imageKey`, set `DONE`, **decrement `freeAttempts`**; when none remain, return the 402-style error (top-up required) and generate nothing.
  - `POST /heroes/:id/topup` — debit `HERO_TOPUP` (100), add 3 free attempts.
- **Reset on completion** — when a book reaches `DONE`, the worker resets `freeAttempts` to 3 for all heroes of that book's child.
- **Frontend (minimal, temporary styling)** — `/children/[id]/heroes`: list heroes with avatar + remaining free attempts; generate / add companion / remove / buy-3-more; an entry link from the dashboard.

Coin amounts come from the existing `PriceItem` keys `COMPANION` (100) and `HERO_TOPUP` (100). Insufficient coins returns the existing 402-style error for a later wallet redirect.

## Capabilities

### New Capabilities
- `heroes`: Child-owned hero characters (one main + companions, max 5) with metered, billable avatar generation — free attempts, paid top-ups, paid companions, and per-child reset on book completion.

### Modified Capabilities
<!-- coin-wallet, pricing-catalog, and book-lifecycle are consumed, not modified at the requirement level. -->

## Impact

- **Backend (NestJS + Prisma/Postgres)**: new `Hero` model + `HeroRole`/`HeroStatus` enums; a migration. New `HeroesModule` (`HeroesService`, controller) importing `CoinModule` and `AiModule` (`ImageGenerator`) + `StorageModule` (signed avatar URLs). The book-generation worker gains a hero-reset step on `DONE`. Documented in `docs/API.md`.
- **Frontend (Next.js App Router)**: a `/children/[id]/heroes` page + server actions (`generateHeroAction`, `addCompanionAction`, `removeHeroAction`, `topupHeroAction`); a dashboard entry link.
- **Out of scope** (later slices): feeding the child's real photo bytes into the avatar prompt (photo-conditioning); using hero avatars inside book illustration generation and targeted regeneration; the wizard step-2 hero panel (6.18); the redesigned children screen (6.16); the wallet screen (6.21).
