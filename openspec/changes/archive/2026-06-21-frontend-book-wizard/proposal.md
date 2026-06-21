## Why

The book-creation flow is still the Phase-4 placeholder (`books/new`) with plain selects. The prototype's heart is a polished 3-step wizard: choose+pay for a book type, then configure heroes/style/topic/length. Phase 6.17–6.18 builds steps 1 and 2 on the Change A/B design system; step 3 (ready/progress screen + reader) is Change D, so for now step 2 submits to the existing `/books/[id]` progress page.

## What Changes

- **Wizard shell** — a redesigned `app/(app)/books/new` with the prototype's 3-step stepper header (Тип книги → Настройка → Генерация) and footer navigation.
- **Step 1 — type & payment (6.17):** two large cards, Unique (`BOOK_UNIQUE`) vs Template (`BOOK_TEMPLATE`), with live prices from `/pricing`. Choosing Template reveals the 6-template picker (`GET /templates`). The footer "Оплатить и настроить · N 🪙" runs the existing `createDraftAction` — debits upfront and creates the DRAFT (one draft per user; resumes the existing one for free). Insufficient coins → wallet/dashboard redirect.
- **Step 2 — configuration (6.18):** shown when a DRAFT exists.
  - **Child** picker (required for both book types); the main hero is that child's auto-ensured `MAIN` hero.
  - **Heroes** with inline generation: generate/regenerate (`POST /heroes/:id/generate`), top-up +3 attempts (`POST /heroes/:id/topup`), add companion with role+name (`POST /children/:id/heroes`, `COMPANION` cost), remove companion (`DELETE /heroes/:id`); free-attempt counters and IDLE/GENERATING/DONE status surfaced.
  - **Style** (`WritingStyle`: WATERCOLOR/ADVENTURE/FUNNY/GENTLE), **topic** (`GET /topics`), **page tier** (12/16/20/24 with surcharges from `/pricing`), and a free-text **special wish** (`promptText`)/**fear** — all saved via `PATCH /books/:id`.
  - **Template books freeze** style/topic/pages (locked notice); only heroes are editable.
  - Footer "К генерации →" saves config and submits via the existing `submitDraftAction` (→ `/books/[id]`); "Save & exit" keeps the draft.

## Capabilities

### New Capabilities
- `book-wizard`: The redesigned multi-step book-creation wizard — step 1 (type/template + pay→DRAFT) and step 2 (child, inline hero generation, style/topic/pages/wish, template field-locking).

### Modified Capabilities
<!-- None: backend books/heroes/pricing/topics/templates APIs are unchanged; this change consumes them. -->

## Impact

- **Frontend files**: rebuild `app/(app)/books/new/page.tsx`; new wizard step components (stepper, step-1, step-2, hero card) — mostly client components for the interactive step 2; extend `app/actions/heroes.ts` (or add wizard variants) so inline hero actions revalidate the wizard. Reuse `createDraftAction`/`submitDraftAction`, `getPricing`, and Change A/B components (Avatar, theme).
- **Backend**: none — consumes `GET /templates`, `GET /topics`, `GET /pricing`, `GET /children`, `GET /children/:id/heroes`, `POST /heroes/:id/generate|topup`, `POST/DELETE` heroes, `POST /books/draft`, `PATCH /books/:id`, `POST /books/:id/submit`.
- **Scope boundary**: step 3 (ready screen + live progress + reader hand-off) is Change D; step 2 currently ends by submitting to the existing `/books/[id]` page.
- **Visual source of truth**: `draft/design/StoryCraft.dc.html` (wizard ~376–668).
