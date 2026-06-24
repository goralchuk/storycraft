## Why

The wizard picks a "drawing style" from a fixed `WritingStyle` enum **after** heroes,
and that style isn't actually applied to hero generation or the book. The agreed v2
flow is: child → **style (before heroes)** → heroes (generated in that style) → theme
→ generate. The style must be a real `StyleTemplate`, persisted on the book, and used
by hero generation and the assembler. Also, the step-3 poller should read the
`BookGeneration` record (9.7) rather than `Book.stage/progress`.

## What Changes

- **Per-book style.** `Book.styleTemplateId` (→ `StyleTemplate`); `GET /styles` lists
  active styles; `updateDraft` accepts `styleTemplateId`. The assembler uses the
  book's style (falling back to the first active one).
- **Wizard reorder.** Step 2 shows the **style** picker (real `StyleTemplate`s) right
  after the child and **before** heroes; the chosen `styleId` is passed to hero
  generation (so portraits are in that style) and saved on the draft. Theme / length /
  wish stay after heroes. The old `WritingStyle`-enum picker is removed.
- **Poller.** Step 3 reads the latest `BookGeneration` (`currentStep`/`progress`),
  falling back to `Book.stage`/`progress`.

## Capabilities

### Modified Capabilities
- `book-wizard`: step 2 selects a real book style before heroes, applies it to hero generation, and persists it on the book; step 3 progress is read from the generation record.
- `generation-pipeline`: the assembler uses the book's chosen style (else the first active style).

## Impact

- **DB**: `Book.styleTemplateId` (migration).
- **Backend**: `GET /styles`; `updateDraft` (+`styleTemplateId`); worker assembler reads the book style; `getOne` already returns `generation` (9.7).
- **Frontend**: `books/new` loads styles; `WizardStep2` reordered + real style picker + `styleId` threaded into hero generation and the draft; `books/[id]` poller reads the generation record.
