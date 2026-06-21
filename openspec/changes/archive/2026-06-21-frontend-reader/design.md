## Context

`GET /books/:id` (`getOne`) returns the book with `pages` (each `pageNum`, `text`,
`illustrations[]` with signed `imageUrl`), `slots`, `title`, `template`/`topic`
(cover colour/icon), `child`, and a signed `pdfUrl` (the PDF the worker assembles
at the ASSEMBLE stage). Page text is slot-tokenized (`{{child}}`); a `resolveSlots`
helper already exists in the book page. The 6.19 DONE state currently renders an
inline list of pages as a stop-gap.

## Goals / Non-Goals

**Goals:**
- A dedicated, focused reader for a finished book: cover + per-page spreads with
  navigation and a position indicator.
- One-click PDF download of the already-assembled file.

**Non-Goals:**
- Backend / PDF generation changes (the PDF exists; we link it).
- A true two-facing-page layout — a paged single-page viewer (illustration + text)
  reads cleanly and responsively and satisfies "HTML spreads (slots+images)".
- Editing, sharing, or re-generating the book; wallet (6.21).

## Decisions

- **Dedicated route, not inline.** `/books/[id]/read` keeps the step-3 screen about
  generation and gives reading its own surface. The DONE state links here and drops
  its inline page list.
- **Access guard.** The route redirects to `/books/[id]` unless the book is DONE
  (and owned — `getOne` already scopes by user and 404s otherwise).
- **Resolve slots server-side.** The server resolves `{{slot}}` tokens and passes
  plain text, so the client `Reader` stays presentational.
- **Spreads model.** Index 0 is the cover (colour/icon + title + child); indices
  1..N are pages (illustration when present + text). Navigation is prev/next with a
  "стр X из N" indicator; client `useState` holds the current index.
- **PDF = direct signed link.** "Скачать PDF" is an anchor to `pdfUrl`; when absent
  (e.g., assembly produced none) the button is hidden.

## Risks / Trade-offs

- [Signed `pdfUrl`/image URLs expire (7-day TTL)] → acceptable; the page is loaded
  fresh from `getOne`, which re-signs on each request.
- [Deep-link to the reader for a non-DONE book] → guarded by the status redirect.

## Open Questions

- None blocking.
