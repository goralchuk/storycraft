## 1. Backend — page-tier pricing

- [x] 1.1 Add a page-tier helper: valid tiers `{12,16,20,24}` and tier → `PriceItem` key (`16→PAGE_16`, `20→PAGE_20`, `24→PAGE_24`, `12→none`)
- [x] 1.2 `updateDraft` — validate `pageCount` is a valid tier (`BadRequestException` otherwise); remove the 5–10 `clampParagraphs`
- [x] 1.3 `submit` — resolve the surcharge from `PriceItem` and `CoinService.debit(userId, amount, "Pages: <tier>", bookId)` before the `DRAFT → PENDING` transition; on `InsufficientCoinsException` leave the book `DRAFT` and surface 402

## 2. Frontend — page-tier selector

- [x] 2.1 `/books/new` step 2 — replace `ParagraphSlider` with a page-tier select (12 included / 16 +150 / 20 +300 / 24 +450) bound to the draft's `pageCount`
- [x] 2.2 `submitDraftAction` — on a 402 from submit, route to `/dashboard?error=coins`
- [x] 2.3 Remove `ParagraphSlider` if no longer used

## 3. Docs

- [x] 3.1 Update `docs/API.md` — `PATCH /books/:id` tier validation and `POST /books/:id/submit` page-tier surcharge (+402)

## 4. Verify

- [x] 4.1 PATCH tier 16/20/24 accepted; 13 rejected
- [x] 4.2 Submit tier 20 → `PAGE_20` (300) debited once, book `PENDING`; tier 12 → no surcharge, `PENDING`
- [x] 4.3 Submit a tier the user can't afford → 402, book stays `DRAFT`, no job enqueued; book-type cost never re-charged
