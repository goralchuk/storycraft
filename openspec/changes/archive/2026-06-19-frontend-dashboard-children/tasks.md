## 1. Shared UI bits

- [x] 1.1 Add small shared components: `StatusBadge` (done/processing/failed) and `Avatar` (photo or initial) under `components/`

## 2. Dashboard (6.15)

- [x] 2.1 Rebuild `app/(app)/dashboard/page.tsx` header (greeting + create CTA) styled to the prototype; remove the old redundant session/sign-out scaffolding now that the shell handles it (logout moved onto the navbar avatar)
- [x] 2.2 Draft banner — show when `GET /books/draft` returns a draft; resume routes to `/books/new`
- [x] 2.3 Book grid + stat cards — stats (books, children) + responsive card grid with cover tile, title, child chip, page count, `StatusBadge`, and a "new book" tile
- [x] 2.4 Empty state — illustrated CTA when there are no books
- [x] 2.5 Verify three states render and resume/create CTAs route correctly

## 3. Children CRUD (6.16)

- [x] 3.1 Add `app/actions/children.ts` server actions: create, update, delete (surface has-books conflict), with `revalidatePath('/children')`
- [x] 3.2 Build `app/(app)/children/page.tsx` list (server component): fetch children + per-child heroes in parallel; render child cards (avatar, name, age/gender, interest chips, book/photo status) + add tile
- [x] 3.3 Inline add/edit child form (client component) wired to the create/update actions
- [x] 3.4 Delete control wired to the delete action; show the conflict message when the child has books

## 4. Child photo + heroes (6.16)

- [x] 4.1 Photo upload: client control → server action forwarding multipart to `POST /uploads`, then `PATCH /children/:id` with the returned `photoUrl`; card reflects photo present
- [x] 4.2 Saved-hero preview on each card (avatars) + link to existing `/children/:id/heroes`

## 5. Verify & document

- [x] 5.1 `npm run lint` + `npm run build` clean
- [x] 5.2 Manual E2E: dashboard 3 states; children add/edit/delete; photo upload persists; hero preview + link
- [x] 5.3 Write `docs/phase-6-dashboard-children.md`
