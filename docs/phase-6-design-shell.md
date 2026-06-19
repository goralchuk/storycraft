# Phase 6.12–6.14 — Design System & App Shell

Ports the prototype's visual language (`draft/design/StoryCraft.dc.html`) into the
real Next.js frontend and rebuilds the three pre-auth screens. OpenSpec change:
`frontend-design-shell`.

## What was built

### Design system (6.12)

- **Tailwind v4** installed (`tailwindcss` + `@tailwindcss/postcss`) with
  `postcss.config.mjs`. No JS config file — tokens live in CSS via `@theme`.
- **`globals.css`** rewritten: `@import "tailwindcss"` plus an `@theme` block
  encoding the prototype palette and conventions:
  - surfaces/text: `bg #fdf6ec`, `surface #fff`, `ink #3a322e`, `ink-soft`,
    `muted`, `faint`, `border #f0e7db`, `field`.
  - brand/accents: `primary #e8825a`, `primary-dark`, `purple`, `purple-soft`,
    `green`, `green-soft`, `pink`, `peach`.
  - radii (`pill`, `card`) and shadows (`card`, `pop`, `primary`).
  - keyframes `floaty` / `floatySlow` / `pop` (+ `spin`/`blink`) with
    `.animate-*` helpers.
- **Fonts** via `next/font/google`: **Nunito** (body) and **Baloo 2**
  (headings/brand), bound to `--font-sans` / `--font-display`. Geist removed.
  Baloo 2 has no Cyrillic subset, so `--font-display` falls back to Nunito for
  Cyrillic headings (matches the prototype's actual behaviour).

### App shell (6.12)

- **`components/Backdrop.tsx`** — decorative blurred blobs + floating ✦.
- **`components/Navbar.tsx`** — brand (→ dashboard), nav links *Мои книги* /
  *Дети*, coin-balance badge (→ wallet), *✨ Создать книгу* CTA (→ `/books/new`),
  and avatar with the user's initial. Presentational; balance + name passed in.
- **Route group `app/(app)/`** — authenticated routes (`dashboard`, `children`,
  `books`) moved under it. Its `layout.tsx` enforces the session, fetches
  `GET /users/me` for the live balance/name, and wraps content in
  Backdrop + Navbar. Pre-auth screens (`/`, `/login`, `/onboarding`) sit outside
  the group, so they render **without** the navbar — satisfying "navbar hidden on
  landing/auth/onboarding". Route groups don't change URLs.

### Pre-auth screens (6.13–6.14)

- **Landing** (`app/page.tsx`) — mini top bar, hero (badge, headline, copy,
  social proof, floating storybook illustration), *Как это работает* 3-step row,
  templates showcase, and dark bottom CTA. All CTAs route to `/login`.
- **Auth** (`app/login/page.tsx`) — prototype sign-in card (Google button wired to
  the existing `googleLoginAction`; Apple/email shown as "скоро"; dev stub login
  kept behind `STUB_AUTH`).
- **Onboarding** (`app/onboarding/page.tsx`) — 2 styled steps with a progress bar:
  step 1 captures the name (`updateNameAction`), step 2 the first child
  (`addChildAction`), plus "Пропустить пока" (`skipChildAction`). Form fields kept
  aligned with the existing backend actions (name / birthDate / gender /
  interests); the photo upload is shown as a deferred placeholder.

## Notes & follow-ups

- The moved `dashboard` page still does its own session + `/users/me` check
  (now partly redundant with the `(app)` layout). It is intentionally left as-is
  here; it gets redesigned and cleaned up in Change B (6.15).
- The navbar links to `/wallet` (6.21) and `/children` (6.16), which don't exist
  yet — they'll 404 until those changes land.

## Verification

- `npm run lint` clean; `npm run build` succeeds (TypeScript clean; `/` and
  `/login` prerender as static, authenticated routes compile as dynamic).
- Ran `next dev` and confirmed the landing and auth screens render the expected
  RU content, and that the served Tailwind CSS contains the theme tokens
  (`--color-primary`, `#e8825a`, `#fdf6ec`).
- Full click-through of the authenticated flow (onboarding → dashboard with the
  navbar balance) requires the backend stack running and is exercised as the
  redesigned screens land in Changes B–D.
