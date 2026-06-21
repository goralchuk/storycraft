## 1. Wizard shell & stepper

- [x] 1.1 Add a `WizardStepper` component (3 steps: Тип книги / Настройка / Генерация) highlighting the active step
- [x] 1.2 Rebuild `app/(app)/books/new/page.tsx` (server) — fetch `/books/draft`; no draft → step 1, draft → step 2; render stepper + footer layout

## 2. Step 1 — type & payment (6.17)

- [x] 2.1 Server: fetch `/templates` and `getPricing()`; pass type costs + templates to step-1 component
- [x] 2.2 `WizardStep1` (client): two type cards (Unique/Template) with prices; Template reveals the 6-template grid; selection state
- [x] 2.3 Footer "Оплатить и настроить · N 🪙" posts existing `createDraftAction`; insufficient coins → redirect (existing behaviour)
- [x] 2.4 Verify pay → DRAFT created → step 2; resuming an existing draft is free

## 3. Step 2 — child & heroes (6.18)

- [x] 3.1 Server: fetch draft, `/children`, selected child's `/children/:id/heroes`, `/topics`, `getPricing()`; pass to `WizardStep2`
- [x] 3.2 Child picker (required) — persists `childId` via `PATCH /books/:id`; "+" links to `/children`
- [x] 3.3 Hero cards: main + companions with status (IDLE/GENERATING/DONE), free-attempt counter, generate/regenerate, top-up, description; add-companion picker (role+name) and remove
- [x] 3.4 Wire hero inline actions to `app/actions/heroes.ts`, adding `revalidatePath('/books/new')`

## 4. Step 2 — settings & submit (6.18)

- [x] 4.1 Style picker (WATERCOLOR/ADVENTURE/FUNNY/GENTLE), topic picker (`/topics`), page-tier picker (12/16/20/24 with surcharges from pricing), special-wish textarea
- [x] 4.2 Template freeze: lock style/topic/pages with a notice when `bookType === 'TEMPLATE'`
- [x] 4.3 Extend `submitDraftAction` to also persist style/topic/wish; footer "К генерации →" saves + submits → `/books/[id]`; "Save & exit" → dashboard keeps draft
- [x] 4.4 Verify settings persist; template locks fields; submit lands on the progress page

## 5. Verify & document

- [x] 5.1 `npm run lint` + `npm run build` clean; confirm `/children/[id]/heroes` still works after shared-action change
- [x] 5.2 Manual E2E: type → pay → DRAFT → configure child/heroes/style/topic/pages → generate
- [x] 5.3 Write `docs/phase-6-book-wizard.md`
