## Why

The frontend pages are unstyled placeholders from earlier phases, while the accepted product look lives only in the prototype (`draft/design/StoryCraft.dc.html`). Phase 6 (6.12–6.14) calls for porting that warm, kid-friendly design system and rebuilding the app shell plus the pre-auth screens so the rest of the redesign (dashboard, children, wizard) can be built on a shared foundation.

## What Changes

- **Install and configure Tailwind v4** in the Next.js frontend, encoding the prototype's design tokens (fonts Nunito + Baloo 2; palette bg `#fdf6ec`, text `#3a322e`, primary `#e8825a`, accent purple/green; pill buttons, soft shadows, coin badge) as the shared theme.
- **App shell**: a layout that renders the decorative blurred-blob backdrop and a shared `Navbar` (brand, nav links "Мои книги"/"Дети", live coin-balance badge, "Создать книгу" CTA, user avatar). The navbar is hidden on the pre-auth/pre-navigation screens (landing, auth, onboarding).
- **Landing** redesigned: hero block with marketing copy and CTAs routing to auth.
- **Auth** screen redesigned to match the prototype's sign-in entry point.
- **Onboarding** redesigned as 2 steps (name → first child) with a "skip for now" path to an empty dashboard.
- The coin balance shown in the navbar reads the authenticated user's live balance.

## Capabilities

### New Capabilities
- `app-shell`: Shared navigation shell and visual design system — navbar (with live coin balance) and decorative layout that wrap authenticated screens and are hidden on pre-auth screens.
- `public-screens`: The pre-auth/onboarding screens (landing, auth, onboarding) and their navigation flow into the app.

### Modified Capabilities
<!-- None: existing backend specs (coins, pricing, etc.) are unchanged; this change consumes their APIs. -->

## Impact

- **Frontend dependencies**: adds `tailwindcss` v4 + PostCSS tooling.
- **Frontend files**: `frontend/src/app/layout.tsx`, `globals.css`, `page.tsx` (landing), `login/page.tsx` (auth), `onboarding/page.tsx`; new shared `Navbar` and layout-shell components.
- **Backend**: none — consumes existing `/users/me` (balance) and pricing/coins APIs read-only.
- **Visual source of truth**: `draft/design/StoryCraft.dc.html` and `draft/design/STORYCRAFT_FLOW.md`.
