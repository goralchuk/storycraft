# Phase 6.15–6.16 — Dashboard & Children Screens

Redesigns the two authenticated hub screens to the prototype, on top of the
Change A design system / app shell. OpenSpec change: `frontend-dashboard-children`.

## What was built

### Shared components

- **`components/StatusBadge.tsx`** — book status pill: `DONE` → "● Готова",
  `PENDING`/`PROCESSING` → "◴ Создаётся…", `FAILED` → "⚠ Ошибка".
- **`components/Avatar.tsx`** — photo-or-initial avatar; initial circle colour is
  derived deterministically from the name. Used for children, heroes, and book
  child chips.

### Dashboard (6.15) — `app/(app)/dashboard/page.tsx`

Three states matching the prototype:

- **Draft banner** — shown when `GET /books/draft` returns a draft; "Продолжить"
  resumes via `/books/new`.
- **Book grid** — stat cards (books created, children, plan=Free) + a responsive
  grid of book cards (cover tile from `template.coverColor`/`icon` or `topic.icon`,
  derived title, child chip via `Avatar`, page count, `StatusBadge`) plus a
  "Новая книга" tile. Processing covers are dimmed.
- **Empty state** — illustrated CTA when the user has no books.

The greeting still reads `GET /users/me` for the name (and redirects nameless
users to onboarding). The old per-page sign-out / session-error scaffolding was
removed; **logout now lives on the navbar avatar** (Change A's `Navbar`), so it is
available on every authenticated screen.

### Children screen (6.16)

- **`app/(app)/children/page.tsx`** (server) — fetches `/children` and `/books`
  (for per-child book counts), then `GET /children/:id/heroes` for every child in
  parallel, and renders `ChildManager`.
- **`ChildManager.tsx`** (client) — header + "Добавить ребёнка"; inline **add**
  and per-card **edit** forms; **delete** with the has-books conflict surfaced as
  a banner; interest chips; **saved-hero preview** (stacked avatars) linking to
  the existing `/children/:id/heroes` management page; book/photo status line.
- **`app/actions/children.ts`** — `createChildAction`, `updateChildAction`,
  `deleteChildAction` (redirects with `?error=hasbooks` on 409), and
  `uploadChildPhotoAction`.

### Photo upload

`uploadChildPhotoAction` posts multipart directly to `POST /uploads/photo` with
the Bearer token (bypassing `apiFetch`, which forces JSON), then `PATCH`es the
child with the returned URL. The file input triggers the action on change.

## Notes & follow-ups

- **Signed-URL TTL (tech debt):** `Child.photoUrl` stores the signed MinIO URL
  returned by `/uploads/photo`, which expires after 7 days. The durable fix is to
  store the storage **key** and convert via `StorageService.toUrl` on read in
  `children.service` (as heroes already do) — deferred to keep this change
  frontend-only. Tracked as a follow-up.
- `/wallet` (navbar coin badge) still 404s until 6.21.
- Book cover tiles approximate the prototype with template colour + emoji; real
  cover images are out of scope.

## Verification

- `npm run lint` clean; `npm run build` succeeds (TypeScript clean; `/children`
  and `/dashboard` compile as dynamic routes).
- Dashboard state logic, children CRUD, and photo upload are wired to existing,
  already-tested backend endpoints. A full manual click-through (add/edit/delete,
  photo persistence, hero preview) exercises the running backend + MinIO stack.
