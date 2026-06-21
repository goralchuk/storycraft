# StoryCraft — User Scenarios & Business Logic

Living reference for how the product behaves, used to develop and test against.
Keep it current as features land. Coin amounts below are the **seed defaults**
(`PriceItem`), tunable by an admin at `/admin/pricing`.

## Actors

- **User (parent)** — creates children profiles and books, spends coins.
- **Admin** — everything a user can, plus the price catalog editor (`role = ADMIN`).
- **Generation worker** — async BullMQ job that turns a submitted book into pages,
  illustrations and a PDF.

## Coin economy

All monetization state lives in three tables (see
[`phase-7-coin-data-model.md`](phase-7-coin-data-model.md)): `User.balance`,
`CoinTransaction` (append-only ledger), `PriceItem` (catalog). Every balance change
goes through `CoinService` and writes a ledger row; insufficient funds returns 402.
New users start with **500** coins.

| Event | Direction | Amount (key) | When |
|---|---|---|---|
| Signup bonus | — | 500 (`User.balance` default) | account creation |
| Create unique book | debit | 500 (`BOOK_UNIQUE`) | wizard step 1 (draft created) |
| Create template book | debit | 300 (`BOOK_TEMPLATE`) | wizard step 1 (draft created) |
| Page tier 16 / 20 / 24 | debit | 150 / 300 / 450 (`PAGE_16/20/24`) | step 3, at **submit** (generation start) |
| Page tier 12 | — | included | — |
| Add companion hero | debit | 100 (`COMPANION`) | wizard step 2 |
| Hero generations top-up (+3) | debit | 100 (`HERO_TOPUP`) | wizard step 2 / heroes screen |
| Buy coin package | credit | 300 / 800 / 2000 / 5000 (`PACK_*`) | wallet (stub; real money is Phase 9) |
| Generation failed | credit (refund) | the page-tier surcharge | worker failure |

Rules:
- **Pay-at-config:** the book-type cost is charged once when the draft is created;
  resuming an existing draft is free.
- **Surcharge at generation start:** the page-tier surcharge is charged at submit
  (step 3), matching the "charged when generation starts" promise.
- **Refund on failure:** if generation fails, the page-tier surcharge is refunded
  (once per submission). The book-type cost is **not** refunded (retry is Phase 8).
- **Hero counters:** each hero has 3 free image generations; +3 per top-up. On book
  completion, every hero of that child resets to 3 free generations.
- **Idempotent generation:** the worker processes a book only while it is `PENDING`;
  a re-run on a done/failed book is a no-op (so the refund cannot double-fire).

## User journeys

### Onboarding
New user signs in → if no name, `/onboarding` (2 steps: name, optional first child) →
dashboard. "Skip" lands on the empty dashboard.

### Dashboard
- **Empty** — illustrated CTA to create the first book.
- **Has books** — stat cards + book grid (cover, status badge, child chip).
- **Draft banner** — if a paid-but-unconfigured draft exists, "Продолжить" → wizard.

### Create-a-book wizard (3 steps)
1. **Type & payment** — Unique (`BOOK_UNIQUE`) vs Template (`BOOK_TEMPLATE`); Template
   reveals the template grid. "Оплатить и настроить" debits the type cost and creates
   the DRAFT (resumes an existing draft for free). Insufficient coins → top up.
2. **Configuration** — pick the main child (required; saved at once so the auto
   `MAIN` hero resolves). Manage heroes inline: generate/regenerate (free attempts),
   top-up (+3), add/remove companions. Choose style, topic, page tier (surcharge
   shown), and an optional wish. Template books freeze style/topic/pages. "К генерации"
   saves and advances to step 3.
3. **Generation** — ready → "Сгенерировать книгу" charges the page-tier surcharge and
   submits; live 4-stage progress (heroes → story → illustrations → assemble); on
   done, "Читать книгу"; on failure, retry (surcharge already refunded).

### Generation (worker)
`PENDING → PROCESSING` (claimed once) → write story → draw illustrations → assemble
PDF → `DONE` (progress 100, hero counters reset). Any failure → `FAILED` with the
surcharge refunded.

### Reader
`/books/[id]/read` (DONE only): cover + one spread per page (illustration + slot-
resolved text), prev/next, and a one-click PDF download.

### Wallet
Balance, coin packages (one-click stub credit reading `PriceItem`), and the
transaction history (newest first).

### Children & heroes
`/children` CRUD with photo upload and saved-hero previews; `/children/[id]/heroes`
manages a child's heroes (generate/top-up/companion).

### Admin pricing
`/admin/pricing` (ADMIN only) lists the catalog by category and edits each amount;
changes apply immediately to reads and charges.
