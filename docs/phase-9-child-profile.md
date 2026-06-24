# Phase 9.4 — Child profile & species disambiguation

Result of ROADMAP task 9.4. The child's resolved age/gender now reach the prompts,
and the main character is explicitly disambiguated as a **human child** — fixing the
case where a name like «Лев» ("lion") was drawn and written as the animal. OpenSpec
change: `child-profile-disambiguation` (modifies `story-generation`).

## Profile resolver (`ai/child-profile.ts`)

Reused by the story prompt, the illustration prompt, and hero generation (9.5):

- **Age** = years from `Child.birthDate`; if absent, the lower bound of the story
  theme's `ageRange`; `null` only when neither is known.
- **Gender** = from `Child.gender` (tolerant match → `мальчик` / `девочка`); if
  unset/unknown → neutral `ребёнок`.
- **Descriptor** = e.g. `мальчик, 3 года` (Russian year declension), or `ребёнок`.

## Disambiguation in prompts

- **Story text** (`story-prompt.ts`): "Главный герой — ЧЕЛОВЕК-РЕБЁНОК (<descriptor>).
  Имя «<name>» — имя собственное, а НЕ животное и НЕ предмет…".
- **Illustration** (qwen + gemini `buildPrompt`, `ImageContext.childDescriptor`): same
  human-child line on `featuresChild` pages — the illustration prompt embeds the
  resolved name, which is exactly where «Лев» turned into a lion.

The worker resolves the profile once (from `child` + `template`) and threads
`childDescriptor` into both the `StoryContext` and each child-facing `ImageContext`.

## Verification

- Profile resolver checked: «Лев» (male, birthDate 3y) → `мальчик, 3 года`; no
  birthDate + theme `4–8` → `девочка, 4 года`; nothing → `ребёнок`.
- **Live visual proof** (same scene «Лев играет с мячиком в саду»):
  - **without** the disambiguation → a lion (the bug);
  - **with** it → a happy ~3-year-old boy.
- `npm run build` + `npm run test:int` green (12).

## Caveat discovered (tracked separately)

During the live check, `qwen-image-edit-plus-2025-12-15` (the 9.1 default) was found
to **require 1–3 input images** — it cannot do text-only generation, so it can't be
the sole default (reference-less pages would 400). The visual proof used
`qwen-image-2.0` (which supports text-only). The image-model default needs revisiting
(hybrid: edit model when references exist, base model otherwise) — see BACKLOG.
