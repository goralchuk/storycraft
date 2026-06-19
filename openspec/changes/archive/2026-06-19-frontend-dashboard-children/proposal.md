## Why

The dashboard and children screens are still the unstyled placeholders from Phase 4. Now that the design system and app shell exist (Change A), Phase 6.15–6.16 redesigns these two authenticated hub screens to match the prototype, giving users a proper home and child-profile management. The navbar already 404s on `/children` until this lands.

## What Changes

- **Dashboard** (`app/(app)/dashboard`) redesigned to the prototype with three states:
  - **Draft banner** — when a paid `DRAFT` exists, a "продолжить" banner resumes the wizard.
  - **Book grid** — stat cards (books created, children, plan) + a responsive grid of book cards, each with a cover tile, title, child chip, page count, and a status badge (Готова / Создаётся… / Failed), plus a "new book" tile.
  - **Empty state** — illustrated CTA when the user has no books.
- **Children screen** — promote `/children` to a real list page with full CRUD:
  - Grid of child cards: avatar (photo or initial), name, age/gender, interest chips, book count, photo status, and an "edit" affordance.
  - Inline **add** form and **edit** form (name, birthDate, gender, interests), **delete** with the existing has-books guard surfaced.
  - **Photo upload** via the backend `/uploads` endpoint, persisting `Child.photoUrl`.
  - Each card previews the child's **saved heroes/avatars** and links to the existing per-child hero management page.
- Move/replace the current `children/[id]/heroes` linkage so the new list is the `/children` entry point.

## Capabilities

### New Capabilities
- `dashboard`: The authenticated home screen — draft-resume banner, book grid with statuses, and empty state.
- `children-screen`: The child-profile management screen — CRUD, photo upload, and saved-hero previews.

### Modified Capabilities
<!-- None: backend children/books/heroes/upload APIs are unchanged; this change consumes them. -->

## Impact

- **Frontend files**: `app/(app)/dashboard/page.tsx`; new `app/(app)/children/page.tsx` + child form/card client components; new server actions for child create/update/delete and photo upload; small shared UI bits (status badge, avatar).
- **Backend**: none — consumes existing `GET /books`, `GET /books/draft`, `GET/POST/PATCH/DELETE /children`, `GET children/:id/heroes`, `POST /uploads`.
- **Routing**: `/children` becomes a list page (currently only `/children/[id]/heroes` exists).
- **Visual source of truth**: `draft/design/StoryCraft.dc.html` (dashboard ~309–374, children ~672–742).
