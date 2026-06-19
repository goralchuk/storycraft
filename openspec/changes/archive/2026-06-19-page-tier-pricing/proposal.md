## Why

The prototype lets a parent choose how long the book is — 12, 16, 20, or 24 pages — and charges a surcharge for the longer tiers (ROADMAP 6.10). Today the create form has a 5–10 "paragraph" slider with no price effect, and the book-type cost (UNIQUE/TEMPLATE, charged at draft creation in 6.7) is the only coin sink in the book flow. This change wires the page-tier surcharges so longer books cost more, completing the per-book pricing.

## What Changes

- **Page tiers replace the paragraph slider** — `Book.pageCount` now holds the chosen tier: `12` (included), `16` (+150), `20` (+300), `24` (+450). The 5–10 paragraph clamp is removed.
- **Surcharge charged once, at submit** — `POST /books/:id/submit` debits the page-tier surcharge (from `PriceItem` `PAGE_16`/`PAGE_20`/`PAGE_24`) atomically with the `DRAFT → PENDING` transition, then enqueues generation. Because submit only runs on a `DRAFT`, the surcharge is charged exactly once per book. The book-type cost is **not** re-charged. Tier `12` has no surcharge.
- **Insufficient coins keeps the draft** — if the user cannot afford the surcharge at submit, the 402-style error is returned and the book stays `DRAFT` (no transition, no enqueue), so they can lower the tier or buy coins.
- **Tier validation** — `PATCH /books/:id` accepts `pageCount` only in `{12, 16, 20, 24}`.
- **Frontend** — `/books/new` step 2 replaces the slider with a page-tier selector showing each tier's surcharge; insufficient coins on submit routes to the wallet placeholder (`/dashboard?error=coins`).

## Capabilities

### New Capabilities
- `page-pricing`: Book length as a priced page tier (12/16/20/24) with a surcharge charged once at submission, on top of the book-type cost.

### Modified Capabilities
<!-- book-lifecycle's submit gains the surcharge step, but its existing requirements (book-type charged once at creation; submit never re-charges the book-type cost) remain true — the surcharge is a separate, additional charge defined in the new capability. coin-wallet and pricing-catalog are consumed, not modified. -->

## Impact

- **Backend (NestJS + Prisma/Postgres)**: a page-tier → `PriceItem` key helper; `BooksService.updateDraft` validates the tier; `BooksService.submit` debits the surcharge via `CoinService` before transitioning and keeps the draft on insufficient funds. No schema/migration change (`pageCount` is reused). `docs/API.md` updated (submit surcharge, tier validation).
- **Frontend (Next.js App Router)**: `/books/new` step-2 page-tier selector replaces `ParagraphSlider` (which is removed if unused); `submitDraftAction` handles a 402 from submit by routing to `/dashboard?error=coins`.
- **Out of scope**: generation stages (6.11), the redesigned wizard/dashboard (6.12–6.19), the wallet screen (6.21); renaming `pageCount` (ROADMAP Tech Debt).
