## 1. Data model & migration

- [ ] 1.1 Add `HeroRole` (`MAIN | PET | SIBLING | FRIEND | MAGIC`) and `HeroStatus` (`IDLE | GENERATING | DONE`) enums
- [ ] 1.2 Add `Hero` model — FK to `Child` (`onDelete: Cascade`): `role`, `name`, `style?`, `description?`, `imageKey?`, `freeAttempts` Int default 3, `status` default `IDLE`, timestamps; add `heroes Hero[]` to `Child`
- [ ] 1.3 Run `prisma migrate dev` — migration applies clean

## 2. Heroes service

- [ ] 2.1 Create `HeroesModule` (imports `CoinModule`, `AiModule`, `StorageModule`) + `HeroesService`
- [ ] 2.2 `list(user, childId)` — verify child ownership; lazily ensure a `MAIN` hero (free, name from child); resolve `imageKey` to signed URLs
- [ ] 2.3 `addCompanion(user, childId, { role, name })` — reject `MAIN`/5-hero limit; create then debit `COMPANION`, rollback on insufficient funds
- [ ] 2.4 `remove(user, id)` — reject deleting `MAIN`; delete companion (owned by user)
- [ ] 2.5 `generate(user, id, { style?, description? })` — atomic attempt consume (`freeAttempts > 0` → decrement + `GENERATING`, else 402); generate avatar via `ImageGenerator`; set `imageKey` + `DONE`; refund attempt + restore status on failure
- [ ] 2.6 `topup(user, id)` — debit `HERO_TOPUP`, add 3 free attempts

## 3. Heroes controller

- [ ] 3.1 `GET /children/:childId/heroes`, `POST /children/:childId/heroes`, `DELETE /heroes/:id`, `POST /heroes/:id/generate`, `POST /heroes/:id/topup`; register `HeroesModule` in `app.module`

## 4. Reset on book completion

- [ ] 4.1 In `BookGenerationProcessor`, after a book reaches `DONE`, reset `freeAttempts` to 3 for all heroes of `book.childId` (guard null)

## 5. Frontend — minimal vertical slice

- [ ] 5.1 `/children/[id]/heroes` page — list heroes (avatar/placeholder, role, remaining attempts); per-hero Generate; Add companion (role + name); Remove companion; Buy 3 more when out
- [ ] 5.2 Server actions `generateHeroAction` / `addCompanionAction` / `removeHeroAction` / `topupHeroAction` (revalidate the page); insufficient-coins → dashboard `?error=coins`
- [ ] 5.3 Dashboard — minimal per-child list with a "Heroes" link to `/children/[id]/heroes`

## 6. Docs

- [ ] 6.1 Document the five hero endpoints and the coin costs (`COMPANION`, `HERO_TOPUP`) in `docs/API.md`

## 7. Verify

- [ ] 7.1 List a child → `MAIN` hero auto-created (free); 3 free generations, 4th → 402 top-up-required; topup (−100) → 3 more; generation stores an avatar
- [ ] 7.2 Add companion (−100); 5th companion rejected; remove companion; `MAIN` cannot be deleted; insufficient coins blocks add
- [ ] 7.3 Complete a book for the child → that child's heroes reset to 3 free attempts
