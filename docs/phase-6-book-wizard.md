# Phase 6.17–6.18 — Book Wizard (steps 1 & 2)

Replaces the Phase-4 placeholder `books/new` with the prototype's polished
3-step wizard, on top of the Change A design system. OpenSpec change:
`frontend-book-wizard`. Step 3 (ready/progress screen + reader) is Change D;
for now step 2 submits to the existing `/books/[id]` progress page.

## What was built

### Shared component

- **`components/WizardStepper.tsx`** — three-step header (Тип книги → Настройка →
  Генерация). `active` (1–3) highlights the current and prior steps.

### Single draft-driven route — `app/(app)/books/new/page.tsx`

Server component. Fetches `GET /books/draft` (plus `/users/me` for the balance
and the pricing catalog). The backend's one-draft-per-user model drives the step:

- **No draft → step 1.** Also fetches `GET /templates`; renders `WizardStep1`.
- **Draft present → step 2.** Fetches `/children`, `/topics`, and — only once a
  child is chosen — that child's `/children/:id/heroes`; renders `WizardStep2`.

### Step 1 — type & payment (6.17) — `WizardStep1.tsx` (client)

- Two type cards: **Уникальная** (`BOOK_UNIQUE`) vs **Шаблон** (`BOOK_TEMPLATE`),
  prices read from `getPricing()`. Choosing Template reveals the real template
  grid (`GET /templates`, cover colour/icon from the row).
- Footer "Оплатить и настроить · N 🪙" posts the existing `createDraftAction`
  (debits up-front, creates the DRAFT, resumes an existing one for free). The pay
  button is disabled when Template is picked without a template, or when the
  balance is below the cost (with an inline "пополнить" hint → `/wallet`).
  Insufficient coins server-side still bounce to `/dashboard?error=coins`.

### Step 2 — configuration (6.18) — `WizardStep2.tsx` (client)

- **Child picker** (required for both book types). Each child is a small form
  posting the new `saveChildAction` → `PATCH /books/:id { childId }` then
  `revalidatePath('/books/new')`, so the server reloads with that child's heroes
  and the auto-ensured `MAIN` hero resolves.
- **Heroes** grid with inline generation: per-hero status (IDLE/GENERATING/DONE),
  free-attempt counter (`/3`), an optional description textarea, generate /
  regenerate (`generateHeroAction`, now forwarding the description), top-up +3
  (`topupHeroAction`), add companion with name + role (`addCompanionAction`),
  remove companion (`removeHeroAction`). The shared hero actions now revalidate
  both `/children/:id/heroes` and `/books/new` via a `refreshHeroes` helper.
- **Story settings** (Unique only): illustration style (WATERCOLOR / ADVENTURE /
  FUNNY / GENTLE), topic (`GET /topics`), page tier (12/16/20/24 with surcharges
  from `PAGE_16/20/24`), and an optional special-wish textarea. Kept in local
  state, defaulted from the draft.
- **Template freeze**: for `TEMPLATE` books the story settings render as a locked
  notice and are omitted from submit; only heroes are editable.
- **Footer**: "К генерации →" posts the extended `submitDraftAction`
  (now persists `writingStyle`/`topicId`/`promptText` alongside child + pages,
  then `POST /books/:id/submit` → `/books/[id]`); disabled until a child is
  chosen. "Сохранить и выйти" → `/dashboard` keeps the draft.

## Server-action changes

- `app/actions/books.ts` — added `saveChildAction`; extended `submitDraftAction`
  to persist style/topic/wish.
- `app/actions/heroes.ts` — `refreshHeroes` revalidates the wizard too;
  `generateHeroAction` forwards an optional `description`.

## Verification

- `npm run lint` and `npm run build` clean.
- The existing `/children/[id]/heroes` page still uses the shared hero actions
  (now additionally revalidating `/books/new`, which is harmless there).

## Notes / follow-ups

- Step 3 (ready screen + live 4-stage progress + reader hand-off) is Change D.
- The navbar `/wallet` link (and the step-1 "пополнить" hint) 404s until 6.21.
