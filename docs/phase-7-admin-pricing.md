# Phase 7.4 — Admin Pricing Screen

Makes the coin price catalog tunable from the app so the whole economy is testable
before payments. OpenSpec change: `admin-pricing`. Frontend-only — the backend
(`GET /pricing`, admin-only `PATCH /pricing/:key`, Redis cache) was already complete.

## What was built

### Admin screen — `app/(app)/admin/pricing/page.tsx` (server)

- Guarded to `role === 'ADMIN'` via `/users/me` (non-admins redirect to `/dashboard`).
  The backend `PATCH` also enforces admin (`RolesGuard` + `@Roles(ADMIN)`), so this is
  defense-in-depth plus hiding the screen.
- Loads the catalog with `getPricing()` and renders the editor.

### Editor — `PriceEditor.tsx` (client)

- Items grouped by category (Книги / Страницы / Герои / Пакеты монет).
- Each row: label + key + an amount input + Save. Save calls the existing
  `updatePriceAction(key, amount)` in a `useTransition`; the action PATCHes and
  `updateTag('pricing')`, so every screen reading `getPricing()` picks up the new
  amount and charges (`CoinService.priceOf`, DB-backed) use it immediately.
- Save is disabled until the amount changes; shows pending / saved states.

### Gated entry

- `(app)/layout.tsx` now includes `role` from `/users/me` and passes `isAdmin` to
  `Navbar`; the navbar shows an "⚙ Цены" link only for admins.

## Scope

- Edits **amount** only (matches `PATCH /pricing/:key`); keys, labels, categories,
  and the `active` flag stay seed-managed. Adding/removing prices is not in scope.

## Verification

- `npm run lint` + `npm run build` clean; `/admin/pricing` route registered.
- As admin: changing a price persists and is reflected on the wizard / wallet and in
  charges. A non-admin is redirected from `/admin/pricing` and sees no nav link.

## Notes

- Admin is seeded onto `goralchuk.r@gmail.com` (sign in once, then `npm run seed`).
- Next in Phase 7: 7.5 — full coin E2E without payments.
