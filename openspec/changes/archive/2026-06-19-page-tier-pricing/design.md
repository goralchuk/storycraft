## Context

`BooksService.updateDraft` currently clamps `pageCount` to 5–10 paragraphs (`clampParagraphs`); `submit` transitions `DRAFT → PENDING` and enqueues without charging. The coin economy provides `CoinService.debit` / `priceOf(key)` and a 402-style `InsufficientCoinsException`; `PriceItem` rows `PAGE_16`/`PAGE_20`/`PAGE_24` are seeded at 150/300/450. The book-type cost is already charged at draft creation (6.7). The frontend step-2 form (`/books/new`) uses a `ParagraphSlider`. The text generator produces `pageCount` pages, so the field already maps to book length.

## Goals / Non-Goals

**Goals:**
- Book length is one of 12/16/20/24, validated on configure.
- The longer tiers cost a surcharge, charged exactly once, at submit, on top of the book-type cost.
- Unaffordable surcharge leaves the draft intact for the user to adjust.

**Non-Goals:**
- Schema changes / renaming `pageCount` (reused as-is; rename is deferred Tech Debt).
- Refunds for lowering the tier; generation-stage UI; the redesign; the wallet screen.

## Decisions

**Charge at submit, not at selection.**
The surcharge is debited inside `submit`, immediately before the `DRAFT → PENDING` update. Rationale: `submit` runs only on a `DRAFT`, so the charge is inherently once-per-book — no need for an extra "already paid" marker, no double-charge on resume, and no refund logic when the user changes the tier during configuration. Alternative considered: charge the delta on each `PATCH` tier change — rejected for needing a paid-tier field and refund handling.

**Order: debit then transition.**
`submit` resolves the tier's `PriceItem` key; if there is a surcharge it calls `CoinService.debit(userId, amount, "Pages: <tier>", bookId)` first. Only if the debit succeeds does it update status to `PENDING` and enqueue. On `InsufficientCoinsException` the exception propagates as 402 and the book is untouched (still `DRAFT`). Rationale: the atomic debit guard already prevents overdraw; doing it first means a failed charge cannot leave a half-submitted book.

**Tier → key helper.**
A small pure map: `16 → PAGE_16`, `20 → PAGE_20`, `24 → PAGE_24`, `12 → none`. `updateDraft` validates membership in `{12,16,20,24}` (replacing `clampParagraphs`); an out-of-set value is a `BadRequestException`.

## Risks / Trade-offs

- **Existing books with `pageCount` 5–10** (paragraph-era data) → not user-visible here; submit only charges for 16/20/24, so legacy values incur no surcharge → Mitigation: none needed; new drafts use the tier selector.
- **Surcharge charged after book-type at a different step** → two separate debits per book (type at creation, pages at submit) → acceptable and matches the prototype's "pay as you go"; both reference the book id in the ledger.
- **User picks 24 then can't afford at submit** → blocked at submit rather than at selection → Mitigation: the selector shows surcharges so the cost is visible before clicking Generate; the 402 routes to the wallet.

## Migration Plan

No migration — `pageCount` is reused. Deploy backend + frontend together (the step-2 control changes). Rollback: revert code; no data changes.

## Open Questions

- None blocking. A future slice may show the running coin total (type + pages + heroes) in the wizard; out of scope here.
