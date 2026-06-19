## 1. Tailwind v4 + design tokens (6.12)

- [x] 1.1 Add `tailwindcss` v4 + `@tailwindcss/postcss` to `frontend` devDependencies and create `postcss.config.mjs`
- [x] 1.2 Replace starter `globals.css` with `@import "tailwindcss"` + `@theme` tokens (palette: bg `#fdf6ec`, ink `#3a322e`, primary `#e8825a`, purple/green accents; fonts; radii/shadows for pills and cards)
- [x] 1.3 Load Nunito (body) + Baloo 2 (headings/brand) via `next/font/google` in `layout.tsx` and bind to theme font tokens; remove Geist
- [x] 1.4 Verify `next dev` compiles and a sample theme utility (e.g. `bg-bg`, brand font) applies

## 2. App shell (6.12)

- [x] 2.1 Build decorative backdrop component (blurred blobs + floating ✦) from the prototype
- [x] 2.2 Build shared `Navbar` (brand → landing, links "Мои книги"/"Дети", coin-balance badge, "Создать книгу" CTA, avatar)
- [x] 2.3 Wire navbar coin balance to the authenticated user's balance (session / `GET /users/me`)
- [x] 2.4 Add an app-shell layout wrapping authenticated routes (navbar + backdrop); ensure landing/auth/onboarding opt out

## 3. Landing (6.13)

- [x] 3.1 Rebuild `app/page.tsx` landing: mini top bar, hero block + copy, CTAs routing to auth — no navbar
- [x] 3.2 Verify CTAs route to the auth/sign-in flow

## 4. Auth (6.13)

- [x] 4.1 Restyle `app/login/page.tsx` (auth screen) to the prototype; keep existing sign-in action
- [x] 4.2 Verify sign-in routes new user → onboarding, returning user → dashboard

## 5. Onboarding (6.14)

- [x] 5.1 Rebuild `app/onboarding/page.tsx` as 2 styled steps (name → first child) with "skip for now"
- [x] 5.2 Verify: complete flow saves name+child and lands on dashboard; skip lands on empty dashboard

## 6. Verify & document

- [x] 6.1 Manual E2E through the frontend: landing → auth → onboarding (+skip) → dashboard, navbar balance correct on authenticated screens
- [x] 6.2 Write `docs/phase-6-design-shell.md` summarizing the result
