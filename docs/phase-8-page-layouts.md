# Phase 8.6 — Page layout variants

Result of ROADMAP task 8.6. The story model now chooses a layout per page, so books
look like real picture books instead of one fixed template. OpenSpec change:
`page-layout-variants` (modifies `story-generation` and `book-reader`).

## What was delivered

- **Layouts.** Each page is `IMAGE_ONLY` (full illustration, no text), `IMAGE_TEXT`
  (≈⅔ image + ⅓ text), or `TEXT_ONLY` (text, no illustration), chosen by the model
  for variety.
- **Data model.** New enum `PageLayout` and `BookPage.layout` (default `IMAGE_TEXT`),
  migration `book_page_layout`.
- **Generation.** `GeneratedPage.layout`; the prompt asks for a per-page layout and
  `parseStory` validates it (defaults `IMAGE_TEXT`). The worker stores the layout and
  **skips image generation for `TEXT_ONLY` pages** (no illustration record, and one
  fewer image call).
- **PDF.** `PdfService` renders each page by layout: full-bleed image; image then
  text; or text only.
- **Reader.** `read/page.tsx` carries the layout into spreads and `Reader.tsx`
  renders the three layouts (image-only hides the text block; text-only hides the
  image and centers the text).

## Verification (live)

A 6-page book produced mixed layouts —
`IMAGE_TEXT, TEXT_ONLY, IMAGE_ONLY, IMAGE_TEXT, TEXT_ONLY, IMAGE_TEXT` — with the two
`TEXT_ONLY` pages carrying zero illustrations (assertion passed) and a mixed-layout
PDF assembled. Backend `npm run build` + `npm run test:int` (9 tests) green; frontend
`tsc --noEmit` clean.

## Notes

- `IMAGE_ONLY` pages still store their narrative text (not rendered); kept for data
  completeness.
- Layout choice is the model's; there is no per-template layout policy (that was
  considered and deferred).
