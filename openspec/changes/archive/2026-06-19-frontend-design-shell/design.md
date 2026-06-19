## Context

The frontend (Next.js 16 App Router, React 19) currently uses the default Next starter `globals.css` with no CSS framework. The accepted look lives in `draft/design/StoryCraft.dc.html`, a prototype built from inline styles on a custom DC framework. Phase 6.12–6.14 ports that into the real app: a Tailwind-based design system, a shared shell/navbar, and the three pre-auth screens. Backend coin/pricing/user APIs already exist and are consumed read-only here.

## Goals / Non-Goals

**Goals:**
- A single Tailwind v4 theme carrying the prototype's fonts, palette, and component conventions, reused by every later screen.
- A shared `Navbar` with live coin balance and an app-shell layout (decorative backdrop) that wraps authenticated routes and is absent on landing/auth/onboarding.
- Landing, auth, and onboarding rebuilt to match the prototype.

**Non-Goals:**
- Dashboard, children, wizard, reader, wallet screens (Changes B–D, later).
- Any backend change. No new pricing/coin logic.
- Real-money purchase, hero generation, PDF — out of scope.

## Decisions

- **Tailwind v4 via `@tailwindcss/postcss`**, configured with `@theme` tokens in `globals.css` rather than a JS config file (v4 idiom). Tokens: `--color-bg`, `--color-ink`, `--color-primary`, accent colors, plus font families. _Alternative_: CSS variables + hand-rolled component classes — rejected per roadmap calling for Tailwind and for velocity on later screens.
- **Fonts loaded via `next/font/google`** (Nunito, Baloo 2) and wired to Tailwind font-family tokens, replacing the current Geist fonts. Keeps font CSS self-hosted and avoids the prototype's external `<link>`.
- **App shell as a layout-level component.** Authenticated routes get the navbar + backdrop from a shared shell component; pre-auth routes (`/`, `/login`, `/onboarding`) opt out. Decision: keep the root `layout.tsx` minimal (html/body/theme) and place the shell where authenticated screens live, since landing/auth/onboarding must render without it. Exact placement (route group vs. per-page wrapper) chosen during implementation based on the current route tree.
- **Navbar balance** read from the existing session/`GET /users/me` flow already used elsewhere; rendered in a client component if it needs live refresh, otherwise from the server-fetched session.
- **Reuse existing actions/routing.** Auth callback and onboarding already have working server actions (`actions/auth.ts`, `actions/onboarding.ts`); this change restyles the screens and keeps their data flow.

## Risks / Trade-offs

- [Tailwind v4 + Next 16 PostCSS setup drift] → Follow the official `@tailwindcss/postcss` setup; verify `next dev` compiles and a sample utility class applies before porting screens.
- [Prototype uses inline RU copy and emoji] → Port copy verbatim from the prototype to stay faithful; keep emoji as-is.
- [Swapping Geist → Nunito/Baloo could affect later screens already coded] → Only pre-auth screens exist styled today; later changes build on the new theme, so the swap is low-risk now.

## Open Questions

- None blocking. Route-group vs per-page shell placement is an implementation detail resolved against the live route tree.
