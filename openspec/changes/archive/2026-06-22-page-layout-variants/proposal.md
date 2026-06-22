## Why

Every page currently renders with the same fixed layout (image on top, text below),
which makes books visually monotonous and looks unlike a real picture book. Letting
the story model choose a layout per page — full image, image + text, or text only —
adds variety, and text-only pages also skip image generation (cheaper).

## What Changes

- The story model assigns each page a `layout`: `IMAGE_ONLY` (full illustration, no
  text), `IMAGE_TEXT` (≈⅔ image + ⅓ text), or `TEXT_ONLY` (text, no illustration).
- `BookPage` gains a `layout` column (enum `PageLayout`, default `IMAGE_TEXT`).
- The worker stores the layout and **skips image generation for `TEXT_ONLY` pages**.
- The reader and the PDF render each page according to its layout.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `story-generation`: pages carry a model-chosen layout; `TEXT_ONLY` pages have no illustration; the PDF renders each layout.
- `book-reader`: the reader renders the three page layouts.

## Impact

- **DB**: new enum `PageLayout` + `BookPage.layout` (migration).
- **Backend**: `ai/contracts.ts` (`GeneratedPage.layout`), `ai/story-prompt.ts` (prompt + parse), `tasks/book-generation.processor.ts` (store layout, conditional image gen, pass layout to PDF), `pdf/pdf.service.ts` (render layouts). `GET /books/:id` already returns page fields, so `layout` flows through.
- **Frontend**: `books/[id]/read/page.tsx` (carry layout into spreads) and `Reader.tsx` (render layouts).
