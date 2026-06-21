## Context

`GET /pricing` returns the active catalog (Redis-cached); `PATCH /pricing/:key`
(JwtAuthGuard + RolesGuard + `@Roles(ADMIN)`) updates an amount and clears the cache.
`getMe` returns the full `User` row, so `/users/me` already includes `role`. The
frontend has `getPricing()` (cached under the `pricing` tag) and
`updatePriceAction(key, amount)` (PATCH + `updateTag('pricing')`), but no caller.
`CoinService.priceOf` reads the DB row, so a changed amount is charged immediately.

## Goals / Non-Goals

**Goals:**
- An admin can view and edit every price in-app; changes take effect everywhere.
- The screen is reachable (gated nav link) and access-controlled.

**Non-Goals:**
- Adding/removing prices or editing keys/labels/categories (seed-managed).
- Toggling `active` (all seeded items are active; out of scope).
- A general admin area beyond pricing (just this screen for now).

## Decisions

- **Server-guarded route.** `app/(app)/admin/pricing/page.tsx` fetches `/users/me`;
  if `role !== 'ADMIN'` it redirects to `/dashboard`. Backend `PATCH` also enforces
  admin, so the UI guard is defense-in-depth + hiding the screen.
- **Data source.** Use `getPricing()` (active catalog = all seeded items) and group by
  `category` (BOOK / PAGE / HERO / PACK) for a readable layout.
- **Edit amount only.** Each row is a small client island: a number input + Save that
  calls `updatePriceAction(key, amount)` inside `useTransition`; `updateTag('pricing')`
  gives read-your-own-writes so the list reflects the new value.
- **Gated nav link.** `(app)/layout.tsx` already fetches `/users/me`; thread
  `role` → pass `isAdmin` to `Navbar`, which renders an "⚙ Цены" link only for admins.

## Risks / Trade-offs

- [Role typing] → widen the layout's `/users/me` type to include `role`; harmless.
- [Cache vs DB] → reads go through the cached catalog (invalidated on update); charges
  use `priceOf` (DB) — both reflect the new amount after a save.

## Open Questions

- None blocking.
