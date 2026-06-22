## 1. Data model

- [x] 1.1 Add enum `PageLayout { IMAGE_ONLY, IMAGE_TEXT, TEXT_ONLY }` and `BookPage.layout PageLayout @default(IMAGE_TEXT)`
- [x] 1.2 Migration (`book_page_layout`)

## 2. Generation

- [x] 2.1 `GeneratedPage.layout` in `ai/contracts.ts`
- [x] 2.2 `story-prompt`: ask for a per-page layout (variety); `parseStory` validates the enum, defaults `IMAGE_TEXT`
- [x] 2.3 Worker: store `layout`; skip image generation for `TEXT_ONLY`; pass layout into the PDF pages

## 3. PDF

- [x] 3.1 `PdfPage` gains `layout`; `PdfService` renders full-image / image+text / text-only

## 4. Reader (frontend)

- [x] 4.1 `read/page.tsx`: carry `layout` into spreads
- [x] 4.2 `Reader.tsx`: render the three layouts

## 5. Verify + document

- [x] 5.1 `npm run build` (backend) + `npm run test:int` green; frontend typecheck clean
- [x] 5.2 Live: 6-page book had mixed layouts (IMAGE_TEXT / IMAGE_ONLY / TEXT_ONLY); TEXT_ONLY pages had 0 illustrations; mixed-layout PDF assembled
- [x] 5.3 Document in `docs/phase-8-*.md`
