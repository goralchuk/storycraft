## 1. Step-2 hand-off & actions

- [x] 1.1 `app/actions/books.ts`: add `saveDraftAction` (PATCH child/style/topic/pages/wish → redirect `/books/[id]`) and `generateBookAction` (POST `/books/:id/submit`, 402 → `/dashboard?error=coins`, else stay on `/books/[id]`); remove the unused `submitDraftAction`
- [x] 1.2 `WizardStep2` footer: "К генерации →" posts `saveDraftAction` (no submit); keep the child-required guard and "Сохранить и выйти"

## 2. Step-3 shell (6.19)

- [x] 2.1 Rewrite `app/(app)/books/[id]/page.tsx` (server) on the design system: render `WizardStepper active={3}` and branch by status (DRAFT / PENDING|PROCESSING / DONE / FAILED)

## 3. Ready state (DRAFT)

- [x] 3.1 "Всё готово к генерации" card (cover/icon, "оплачено" note) + a generate-button island posting `generateBookAction`
- [x] 3.2 Verify insufficient surcharge keeps the draft and redirects to top up

## 4. In-progress state (PENDING/PROCESSING)

- [x] 4.1 Styled progress bar (`progress`%) + four named stages (heroes→story→illustrations→assemble) with done (✓) / current (spinner) / pending (number) visuals
- [x] 4.2 Keep `StatusPoller` so the screen advances and lands on DONE automatically

## 5. Done & failed states

- [x] 5.1 DONE: "Книга готова" card (cover + child) with read / dashboard actions, plus the restyled inline reading view (pages + resolved slots) — placeholder until the 6.20 reader
- [x] 5.2 FAILED: styled error with a "create again" link

## 6. Verify & document

- [x] 6.1 `npm run lint` + `npm run build` clean
- [x] 6.2 Manual E2E: step 2 → save → ready → generate → progress advances → DONE opens the reading view; FAILED shows retry
- [x] 6.3 Write `docs/phase-6-generation.md`
