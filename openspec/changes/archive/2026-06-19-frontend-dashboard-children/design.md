## Context

Change A delivered the Tailwind theme, the `(app)` shell (navbar + backdrop), and the pre-auth screens. The dashboard and `/children` are still Phase-4 placeholders. Backend APIs are complete: `GET /books` (excludes DRAFT, includes child+template+pageCount+status), `GET /books/draft`, children CRUD, `GET /children/:id/heroes`, and `POST /uploads` (multipart `file`, returns a URL). This change is frontend-only.

## Goals / Non-Goals

**Goals:**
- Dashboard with the prototype's three states (draft banner, book grid + stats, empty state).
- `/children` list page with full CRUD, photo upload, and saved-hero previews, reusing the theme.

**Non-Goals:**
- The 3-step wizard (Change C) and wallet (6.21). The "create" CTAs route to `/books/new` as they do today.
- Backend changes; hero generation/billing logic (lives on the existing `/children/[id]/heroes` page).
- Real cover images — book cards use the prototype's emoji/colour tiles keyed off template/topic.

## Decisions

- **Server components for data, small client islands for interactivity.** Dashboard and `/children` stay server components fetching via `apiFetch` (no-store). The add/edit child form and the photo upload are client components that call server actions; CRUD uses server actions in `app/actions/children.ts` with `revalidatePath('/children')`. _Alternative_: full client pages with fetch — rejected to keep the existing server-fetch + Bearer pattern.
- **Saved-hero previews fetched per child in parallel.** `/children` fetches `GET /children/:id/heroes` for each child concurrently (`Promise.all`). Small N; acceptable. Cards show hero avatars (imageUrl or initial) and link to `/children/:id/heroes` for management (kept as-is).
- **Photo upload flow.** Client sends the file to a server action that forwards multipart to `POST /uploads`, then `PATCH /children/:id` with the returned `photoUrl`. `apiFetch` currently forces `Content-Type: application/json`; the upload action will call the backend directly (or pass a FormData body without the JSON header) so multipart boundaries are preserved. Decided during implementation against the existing `api.ts` helper.
- **Status badge + avatar as tiny shared components** under `components/` (e.g. `StatusBadge`, `Avatar`) so dashboard and children reuse them and Change C/D can too.
- **Dashboard draft banner** uses the existing `GET /books/draft`; resume routes to `/books/new` (which already resumes the draft), matching current behaviour but restyled.
- **Stats** are derived client-free from the fetched lists (book count, children count); the "plan" stat shows a static Free tier label until plans exist.

## Risks / Trade-offs

- [Per-child hero fetches add requests] → N is small (handful of children); parallelised. Revisit with a batch endpoint only if it becomes a problem.
- [Multipart upload through Next server action] → Verify the boundary/header handling end-to-end with a real image before marking the task done; fall back to a route handler if the action proves awkward.
- [Book cover fidelity] → Emoji/colour tiles approximate the prototype; acceptable until real covers exist.

## Open Questions

- None blocking. Cover-image generation and plans are out of scope here.
