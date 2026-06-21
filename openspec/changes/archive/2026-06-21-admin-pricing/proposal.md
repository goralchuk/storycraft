## Why

Backend pricing is complete — the seed covers every key (`BOOK_*`, `PAGE_*`,
`HERO_TOPUP`, `COMPANION`, `PACK_*`), `GET /pricing` serves a Redis-cached catalog,
and admin-only `PATCH /pricing/:key` updates an amount and invalidates the cache.
The frontend even has `updatePriceAction` (PATCH + `updateTag('pricing')`). But
**nothing calls it** — there is no admin UI, so prices can only be tuned by reseeding
or hand-calling the API. Phase 7.4 wires the screen so an admin can change any price
in-app and watch it take effect across every screen and charge — making the coin
logic fully testable before payments.

## What Changes

- **New admin-only `/admin/pricing` screen** (frontend): server-guarded to role
  `ADMIN` (via `/users/me`), lists the catalog grouped by category, and edits each
  item's amount inline through the existing `updatePriceAction`. Non-admins are
  redirected away.
- **Gated nav entry**: the navbar shows an admin link only for admins (role threaded
  from the app-shell layout).

## Capabilities

### New Capabilities
- `admin-pricing`: the admin price-catalog editor screen and its gated entry point.

## Impact

- **Frontend**: new `app/(app)/admin/pricing/page.tsx` + a small client editor island;
  `(app)/layout.tsx` passes the user `role` to `Navbar`; `Navbar` gains an
  admin-only link. Reuses `getPricing()` and `updatePriceAction`.
- **Backend**: none — `GET`/`PATCH /pricing` exist and `RolesGuard`/`@Roles(ADMIN)`
  already enforce admin server-side (the UI guard is convenience + discovery).
- **Scope**: edit **amount** only (matches `PATCH /pricing/:key`); keys/labels/
  categories stay seed-managed. Full coin E2E is 7.5; payments are Phase 9.
