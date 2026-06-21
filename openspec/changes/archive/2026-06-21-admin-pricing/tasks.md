## 1. Admin pricing screen (7.4)

- [x] 1.1 `app/(app)/admin/pricing/page.tsx` (server): guard to `role === 'ADMIN'` via `/users/me` (else redirect `/dashboard`); `getPricing()`; group items by category; render the editor
- [x] 1.2 Client editor island: per-item amount input + Save calling `updatePriceAction(key, amount)` in `useTransition`; disable while pending

## 2. Gated entry

- [x] 2.1 `(app)/layout.tsx`: include `role` in the `/users/me` type; pass `isAdmin` to `Navbar`
- [x] 2.2 `Navbar`: render an admin-only "⚙ Цены" link to `/admin/pricing`

## 3. Verify & document

- [x] 3.1 `npm run lint` + `npm run build` clean
- [x] 3.2 Manual: as admin, edit a price → it persists and the new amount is charged / shown on the wizard & wallet; non-admin is redirected from `/admin/pricing` and sees no link
- [x] 3.3 Write `docs/phase-7-admin-pricing.md`
