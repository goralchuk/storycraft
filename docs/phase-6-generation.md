# Phase 6.19 — Wizard Step 3 (Generation)

Adds the wizard's third step on top of Change C, and moves book submission out of
step 2 so generation (and its page-tier charge) starts here. OpenSpec change:
`frontend-generation`. The full spread reader + on-demand PDF is 6.20; the wallet
is 6.21.

## What was built

### Step-2 hand-off & actions — `app/actions/books.ts`

- `submitDraftAction` was replaced by two actions:
  - **`saveDraftAction`** — `PATCH /books/:id` (child/style/topic/pages/wish), then
    redirect to `/books/[id]`. The book stays a DRAFT; nothing is charged.
  - **`generateBookAction`** — `POST /books/:id/submit` (charges the page-tier
    surcharge, enqueues); 402 keeps the draft and redirects to `/dashboard?error=coins`,
    otherwise `revalidatePath('/books/:id')` to show the in-progress state.
- `WizardStep2`'s "К генерации →" now posts `saveDraftAction` (child-required guard
  and "Сохранить и выйти" unchanged).

### Step-3 screen — `app/(app)/books/[id]/page.tsx`

Rewritten on the Change A design system with `WizardStepper active={3}`. A single
status-driven surface (`getOne` returns the book in any state):

- **Ready (DRAFT)** — "Всё готово к генерации" card (cover colour/icon, paid badge,
  a surcharge note when `pageCount > 12`) + a `generateBookAction` form button. Link
  back to `/books/new` to keep tweaking.
- **In progress (PENDING/PROCESSING)** — progress bar (`progress`%) + the four named
  stages (Создаём героев → Пишем историю → Рисуем иллюстрации → Собираем книгу) with
  done (✓) / current (spinner) / pending (number) marks, derived from `stage`. The
  existing `StatusPoller` auto-refreshes until a terminal status.
- **Done** — "Книга готова! 🎉" card (cover + title + child chip) with "Читать книгу"
  (anchors to the reading view) and "На главную". The reading view is the inline page
  list, restyled (resolved slots + illustration) — a placeholder until the 6.20 reader.
- **Failed** — error card with a "Создать заново" link.

## Why submission moved to step 3

The ROADMAP describes step 3 as "start generation", the prototype has a dedicated
ready → generate screen, and step 2's own copy promises the volume surcharge is
charged "при запуске генерации". Charging at the step-3 button (not on leaving
step 2) makes all three line up.

## Verification

- `npm run lint` and `npm run build` clean.
- Flow: step 2 → save → ready → generate → progress advances → DONE shows the reading
  view; FAILED shows retry. A draft left at the ready screen is still resumable via
  the dashboard banner (→ `/books/new`).

## Notes / follow-ups

- 6.20 replaces the inline reading view with real HTML spreads + on-demand PDF.
- Insufficient-coins still routes to `/dashboard?error=coins` until the wallet (6.21).
