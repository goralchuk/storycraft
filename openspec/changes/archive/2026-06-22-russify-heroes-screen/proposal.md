## Why

The heroes screen (`/children/[id]/heroes`) is the last un-redesigned page: it is in
English ("Heroes", "Generate", "Remove", …) with raw inline styles, while the rest of
the app is Russian and on the Tailwind design system. This is a presentation-only
cleanup — no behavior changes.

## What Changes

- Translate all heroes-screen UI strings to Russian (roles, statuses, buttons,
  errors, links).
- Restyle the page with the design-system tokens (cards, pill buttons, display font,
  muted text) to match the rest of the app; use the shared `Avatar` for heroes
  without an image.
- Keep the existing server actions and logic unchanged.

## Capabilities

### New Capabilities
- `heroes-screen`: the hero-management screen UI (roster + actions), in Russian and on the design system. Mirrors `children-screen` / `wallet-screen`.

### Modified Capabilities
<!-- none — the `heroes` capability (backend behavior) is unchanged -->

## Impact

- **Frontend only**: `app/(app)/children/[id]/heroes/page.tsx`. No backend, API, or
  data changes.
