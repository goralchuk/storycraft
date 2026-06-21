## Why

6.19 ends at a DONE celebration with a stop-gap inline page list. 6.20 delivers
the actual **book reader** — the screen the prototype never had (its documented
missing piece, FLOW §5.1). The backend already assembles a PDF at the ASSEMBLE
stage and `GET /books/:id` returns it as a signed `pdfUrl`, and the pages carry
slot-tokenized text + illustrations — so this is a frontend-only change: paged
HTML spreads plus a one-click PDF download.

## What Changes

- **New `/books/[id]/read` route (server).** Guards to DONE books the user owns
  (other statuses → the book's generation screen). Resolves slot tokens server-side
  and passes the cover, title, spreads (text + illustration), child, and signed
  `pdfUrl` to the client reader.
- **`Reader` client component.** A focused reading surface on the design system:
  a cover spread followed by one spread per page (illustration when present + the
  resolved text), prev/next navigation with a position indicator, a "Скачать PDF"
  action (the signed `pdfUrl`), and a close back to the dashboard.
- **6.19 DONE hand-off.** "Читать книгу" now links to `/books/[id]/read`; the
  inline stop-gap page list (and its `#read` anchor) is removed.

## Capabilities

### New Capabilities
- `book-reader`: the finished-book reader — paged HTML spreads from stored pages
  (slot-resolved text + illustrations) and a PDF download.

<!-- Backend unchanged: the PDF is built at ASSEMBLE and exposed as a signed pdfUrl by GET /books/:id. -->

## Impact

- **Frontend**: new `app/(app)/books/[id]/read/page.tsx` + a `Reader` client
  component; edit the DONE branch of `app/(app)/books/[id]/page.tsx`. Reuse `Avatar`
  and the design system.
- **Backend**: none — consumes `GET /books/:id` (pages, slots, `pdfUrl`).
- **Scope boundary**: wallet (6.21) is separate; insufficient-coins flows are untouched.
- **Visual source of truth**: no prototype reader exists — designed to match the
  Change A design system.
