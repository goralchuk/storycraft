## Context

The coin economy is in place (`CoinService.debit`, `priceOf`, 402-style `InsufficientCoinsException`; `PriceItem` keys `COMPANION` and `HERO_TOPUP` both seeded at 100). Image generation is real and runtime-selected: `ImageGenerator.generateImage(ctx)` (Gemini/dispatching from `AppSettings`) returns a stored object key; `StorageService.toUrl` signs keys on read. `Child` CRUD exists. The book-generation worker (`BookGenerationProcessor`) sets a book `DONE` at the end. There is no hero concept and no children/heroes frontend page yet.

This slice adds child-owned heroes and their billing, plus a minimal page to exercise them. The polished wizard step-2 hero panel (6.18) and hero-driven illustration reuse are out of scope.

## Goals / Non-Goals

**Goals:**
- A `Hero` owned by `Child` (one `MAIN` + ≤4 companions, max 5), reusable across books.
- Metered avatar generation: 3 free per hero, paid `HERO_TOPUP` for 3 more, paid `COMPANION` to add one, reset to 3 on book completion.
- A minimal `/children/[id]/heroes` page so the flow is verifiable through the UI.

**Non-Goals:**
- Photo-conditioned avatars (sending the child's photo bytes to the model) — prompt is style + description only here.
- Using hero avatars inside book illustration generation / targeted regeneration.
- The redesigned children screen (6.16), wizard hero panel (6.18), wallet screen (6.21).

## Decisions

**Reuse `ImageGenerator.generateImage` with a crafted portrait prompt.**
`HeroesService` composes the `pageText` as a character-portrait description (`name`, `description`, `style`) and calls the existing generator; the returned key is stored as `Hero.imageKey`. Rationale: avoids touching the AI contract and both implementations for a thin slice. Alternative considered: add a dedicated `generateAvatar` method to the contract — deferred until photo-conditioning lands, which is when the contract genuinely needs to change.

**Consume the attempt atomically, refund on failure.**
`generate` first runs `updateMany({ where: { id, child owned by user, freeAttempts: { gt: 0 } }, data: { freeAttempts: { decrement: 1 }, status: GENERATING } })`. If `count === 0` it returns the top-up-required 402 (no generation). On a successful image it sets `imageKey` + `status DONE`; if the image call throws, it increments `freeAttempts` back and restores status. Rationale: the free-attempt count is the billable resource, so its decrement must be atomic and must not be spent on a failed generation.

**Create-then-debit with rollback for paid companions (matches the draft pattern).**
`addCompanion` validates the roster (role ≠ MAIN, < 5 heroes), creates the companion, then debits `COMPANION`; on `InsufficientCoinsException` it deletes the companion and rethrows. `topup` debits `HERO_TOPUP` then adds 3 attempts. Rationale: no orphaned hero on a failed charge; consistent with `createDraft`.

**`MAIN` is ensured lazily.**
`GET /children/:childId/heroes` creates the `MAIN` hero (free, `name` from the child) if absent, so the roster always has a main hero without coupling hero creation into `ChildrenService.create`. Exactly one `MAIN` is enforced by rejecting a second `MAIN` on add and by `ensureMain` checking first.

**Reset hook in the worker.**
After the book is set `DONE`, the processor runs `hero.updateMany({ where: { childId: book.childId }, data: { freeAttempts: 3 } })` (guarded when `childId` is null). Rationale: completion is the natural "you finished a book, here are fresh tries" moment, and the worker already owns the `DONE` transition.

**Ownership via the child relation.**
`/heroes/:id` routes resolve the hero through `child.user.email === user.email`; a hero not owned by the caller is a 404. Avatar `imageKey` is resolved to a signed URL on read via `StorageService.toUrl`.

## Risks / Trade-offs

- **Synchronous generation in the request** → the avatar call blocks the HTTP request for a few seconds. Acceptable for a minimal slice (single hero, manual click); the wizard slice can move it to a job if needed.
- **Portrait prompt without the photo** → avatars match style + description but not the child's actual face yet → Mitigation: photo-conditioning is an explicit follow-up; `imageKey`/prompt fields are the hooks.
- **Refund-on-failure race** → the decrement/refund are separate writes; worst case a crash mid-call leaves one attempt unspent-but-marked → Mitigation: the window is tiny and the cost is one free attempt, not coins; acceptable.
- **Reset breadth** → completion resets all the child's heroes, including companions not used in that book → matches the prototype's intent ("heroes get their free generations back"); accepted.

## Migration Plan

1. Prisma migration: add `HeroRole`/`HeroStatus` enums and the `Hero` model (FK to `Child`, `onDelete: Cascade`).
2. `prisma migrate dev`; no seed change (`COMPANION`/`HERO_TOPUP` already seeded).
3. Deploy backend + frontend together. Rollback: drop the `Hero` table/enums; no change to existing tables.

## Open Questions

- Should companions used in a specific book be linked to the `Book` (so generation/regeneration knows which companions appear)? Deferred to the wizard/illustration slices — heroes are child-owned here.
- Whether to move avatar generation to a background job — deferred; synchronous is fine at this scale.
