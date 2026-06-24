## 1. Profile resolver

- [x] 1.1 `ai/child-profile.ts` — resolve age (birthDate → years, else theme `ageRange` lower bound) and gender (`мальчик`/`девочка`, else `ребёнок`) + a short descriptor

## 2. Thread into prompts

- [x] 2.1 `StoryContext` += `childDescriptor`; `story-prompt.ts` adds the human-child + proper-noun disambiguation
- [x] 2.2 `ImageContext` += `childDescriptor`; qwen + gemini image `buildPrompt` add the disambiguation on child-facing pages
- [x] 2.3 Worker resolves the profile from `child` + `template` and threads it into both contexts

## 3. Verify + document

- [x] 3.1 `npm run build` + `npm run test:int` green; live check: «Лев» renders as a boy with the disambiguation (a lion without it)
- [x] 3.2 Document in `docs/phase-9-child-profile.md`
