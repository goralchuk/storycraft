## Context

The backend wizard flow is complete: `POST /books/draft` debits the type cost and creates the single DRAFT (resumes if one exists); `PATCH /books/:id` saves config (childId, topicId, pageCount, writingStyle, promptText, fear); `POST /books/:id/submit` charges the page surcharge and enqueues generation. `GET /children/:id/heroes` auto-ensures a `MAIN` hero and returns heroes with signed `imageUrl`. Hero generate/topup/companion endpoints and their frontend actions already exist (`app/actions/heroes.ts`). Pricing is cached via `getPricing()`. Changes A/B shipped the theme, `Avatar`, and the existing `createDraftAction`/`submitDraftAction`.

## Goals / Non-Goals

**Goals:**
- Prototype-faithful 3-step stepper with step 1 (type+pay) and step 2 (config) fully working.
- Inline hero generation in step 2 driven by the existing hero endpoints.
- Template books lock style/topic/pages.

**Non-Goals:**
- Step 3 screen (ready + live 4-stage progress) and the reader — Change D. Step 2 submits to the existing `/books/[id]` page.
- Backend changes; new pricing/coin logic.
- A custom-topic free-form beyond the existing `promptText`/`fear` fields.

## Decisions

- **Single route, draft-driven step.** `app/(app)/books/new/page.tsx` (server) fetches `/books/draft`. No draft → render step 1; draft present → render step 2. This mirrors the current placeholder and the backend's one-draft model, avoiding extra step state in the URL. The stepper highlights the step accordingly.
- **Step 1 is light client UI over the existing action.** A client component toggles Unique/Template and (for Template) the template grid, then posts the existing `createDraftAction`. Prices come from `getPricing()` on the server and are passed in. No new action needed.
- **Step 2 is a client component fed server data.** The server fetches draft, children, topics, the selected child's heroes, and pricing, then renders `WizardStep2`. Picking a child persists immediately via `PATCH /books/:id` (so the main hero resolves and heroes can be generated); style/topic/pages/wish are kept in local state and saved on "К генерации →" (and on child change) via a save action, then `submitDraftAction` runs.
- **Hero inline actions reuse `app/actions/heroes.ts`.** Those currently `revalidatePath('/children/:id/heroes')`. Add `revalidatePath('/books/new')` to them (or a small wizard wrapper) so the wizard refreshes after generate/topup/add/remove. Generation is synchronous server-side (stub/live), so a revalidate reflects the new status.
- **Child-selection gate.** Heroes/settings are only meaningful once a child is chosen; the heroes section is shown after selection. Child selection is required before submit (backend enforces; UI guards too).
- **Template freeze.** For `bookType === 'TEMPLATE'`, the style/topic/pages controls render as a locked notice and are not sent; the draft keeps its defaults (pageCount 12). Only the heroes section is interactive.
- **Pricing display.** Type costs, companion cost, hero top-up, and page surcharges all read from `getPricing()` by key (`BOOK_UNIQUE`, `BOOK_TEMPLATE`, `COMPANION`, `HERO_TOPUP`, `PAGE_16/20/24`).

## Risks / Trade-offs

- [Saving step-2 settings then submitting needs two server round-trips] → Do the `PATCH` then `submit` inside one server action (extend/reuse `submitDraftAction`, which already PATCHes child+pageCount; add style/topic/wish to it). Keeps it atomic from the user's view.
- [Hero generate revalidation path coupling] → Adding `/books/new` revalidation to shared hero actions is low-risk; both call sites simply refresh. Verify the existing `/children/[id]/heroes` page still works.
- [No draft but user deep-links to step 2] → Server falls back to step 1 when no draft exists; submit guards on missing child.

## Open Questions

- None blocking. The custom-topic UX maps onto the existing `promptText`/`fear` free-text; a dedicated custom-topic flow can come later.
