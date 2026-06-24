## Why

The generator passes only the child's name into the prompts, so a name that reads
like an animal/object (e.g. «Лев» = "lion") gets drawn and written as that thing, and
the story/illustrations ignore the child's age and gender. We need the child's
profile (age, gender) in the prompts and an explicit "this is a human child, not an
animal" disambiguation — in both the story text prompt and the illustration prompt
(the illustration prompt embeds the resolved name, which is where «Лев» becomes a lion).

## What Changes

- **Child-profile resolver** (`ai/child-profile.ts`, reused by 9.5):
  - **Age** = years from `Child.birthDate`; if absent, the lower bound of the story
    theme's `ageRange`; kept in the prompt when known.
  - **Gender** = from `Child.gender` → `мальчик` / `девочка`; if unset/unknown → `ребёнок`.
  - A short `descriptor` (e.g. `мальчик, 3 года`).
- **Story text prompt** states the main character is a human child of that
  gender/age and that the name is a proper noun, not an animal/object.
- **Illustration prompt** carries the same disambiguation for child-facing pages
  (`childDescriptor` on `ImageContext`), so the embedded name isn't drawn literally.

## Capabilities

### Modified Capabilities
- `story-generation`: prompts carry the resolved child age/gender and disambiguate the main character as a human child (name is a proper noun, not an animal).

## Impact

- **Backend**: new `ai/child-profile.ts`; `StoryContext` += `childAge?`, `childGender?`;
  `ImageContext` += `childDescriptor?`; `story-prompt.ts` + image `buildPrompt`
  (qwen + gemini) add the disambiguation; the worker resolves the profile and threads it.
- **No DB / frontend changes** (age/gender already on `Child`; wizard makes them
  mandatory in 9.10).
