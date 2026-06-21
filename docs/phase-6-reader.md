# Phase 6.20 — Book Reader

Adds the finished-book reader — the screen the prototype never had (FLOW §5.1).
Frontend-only: the backend already assembles a PDF at the ASSEMBLE stage and
`GET /books/:id` returns it as a signed `pdfUrl`, with pages carrying
slot-tokenized text + illustrations. OpenSpec change: `frontend-reader`.

## What was built

### Reader route — `app/(app)/books/[id]/read/page.tsx` (server)

- Auth guard; fetches `GET /books/:id`; redirects to `/books/[id]` for any status
  other than DONE (and 404 → dashboard, via `getOne`'s owner scoping).
- Derives the title (resolved slots → template/topic subject → child) and cover
  (template `coverColor`/`icon` or topic `icon`), resolves each page's `{{slot}}`
  tokens into plain text, and passes the cover, spreads (text + illustration),
  child, and signed `pdfUrl` to the client `Reader`.

### Reader component — `Reader.tsx` (client)

- Paged viewer on the design system: index 0 is the **cover** (colour/icon tile +
  title + child chip), indices 1..N are page **spreads** (illustration when present
  + text). Prev/next buttons with a "стр X из N" indicator; ends disabled.
- Top bar: "← На главную", and "⬇ Скачать PDF" linking the signed `pdfUrl`
  (hidden when the book has no PDF).

### DONE hand-off — `books/[id]/page.tsx`

- The DONE state's "Читать книгу" now links to `/books/[id]/read`. The 6.19
  stop-gap inline page list (and `#read` anchor) and its now-unused page types were
  removed.

## Decisions

- **Dedicated route** (not inline) keeps the step-3 screen about generation and
  gives reading a focused surface.
- **Slots resolved server-side** so the client reader stays presentational.
- **PDF = direct signed link** to the existing `pdfUrl`; no on-demand regeneration
  is needed because the worker builds it during ASSEMBLE. Hidden when absent.
- **Paged single-page viewer** (illustration + text) as the spread; a true
  two-facing-page layout was out of scope.

## Verification

- `npm run lint` and `npm run build` clean; `/books/[id]/read` route registered.
- Flow: finished book → "Читать книгу" → cover + spreads navigate with slots
  resolved → "Скачать PDF" downloads; a non-DONE deep-link redirects to `/books/[id]`.

## Notes / follow-ups

- Signed image/PDF URLs carry the storage 7-day TTL; the page re-signs on each load.
- Wallet (6.21) is the remaining Phase-6 item.
