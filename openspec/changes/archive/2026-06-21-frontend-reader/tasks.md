## 1. Reader route (server)

- [x] 1.1 Add `app/(app)/books/[id]/read/page.tsx` — auth guard; fetch `GET /books/:id`; redirect to `/books/[id]` unless status is DONE
- [x] 1.2 Build the cover (colour/icon, title, child) and resolve slot tokens into plain spread text; pass spreads + signed `pdfUrl` to the client `Reader`

## 2. Reader component (client)

- [x] 2.1 `Reader.tsx` — cover spread + one spread per page (illustration when present + text); prev/next navigation with a "стр X из N" indicator
- [x] 2.2 Top bar: title, "Скачать PDF" (anchor to `pdfUrl`, hidden when absent), and a close back to the dashboard

## 3. DONE hand-off (6.19 screen)

- [x] 3.1 `books/[id]/page.tsx` DONE branch: "Читать книгу" links to `/books/[id]/read`; remove the inline page list + `#read` anchor (and now-unused page rendering)

## 4. Verify & document

- [x] 4.1 `npm run lint` + `npm run build` clean
- [x] 4.2 Manual E2E: finished book → "Читать книгу" → spreads navigate, slots resolved, PDF downloads; non-DONE deep-link redirects
- [x] 4.3 Write `docs/phase-6-reader.md`
