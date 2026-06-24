# Phase 9.5 — Hero generation v2

Result of ROADMAP task 9.5. The MAIN hero is now generated from the child's profile
(a human child, not an animal) in the chosen style, with the description saved and a
VL caption of the portrait stored. OpenSpec change: `hero-generation-v2` (modifies
`heroes` and `story-generation`).

## Base image model fix (carried over from 9.1)

The 9.1 default `qwen-image-edit-plus-2025-12-15` requires 1–3 input images and
**cannot do text-only** generation, so a from-scratch hero (no reference) would 400.
The base default is reverted to **`qwen-image-2.0`** (text-to-image capable; migration
`base_image_model`). The cheaper edit model returns as the reference-conditioned half
of a hybrid in 9.7. Still switchable via `AppSettings.imageModel`.

## Hero prompt v2

`heroes.generate`:
- Resolves the child profile (9.4's `resolveChildProfile`). A **MAIN** hero is
  disambiguated as a human child of the resolved gender/age via `childDescriptor`
  (so «Лев» is a boy, not a lion); **companions** keep their own nature.
- Applies the chosen **style**: `GenerateHeroDto.styleId` → the matching
  `StyleTemplate.prompt` (falls back to the free-text `style`).
- Saves the `description` used.

## VL caption wrapper

New `ImageCaptioner` contract + `QwenImageCaptioner` (`qwen3-vl-flash`), registered/
exported by `AiModule`. After a portrait is generated it is captioned (fail-open) and
stored on `Hero.imageCaption`. The shared `ai/image-data-uri.ts` (`toDataUri`,
extracted from the worker) inlines the image as base64 for the VL call.

## Verification

- Live (MAIN hero «Лев», Акварель style):
  - portrait renders a ~3-year-old **boy** in watercolor (not a lion);
  - the captioner returned a coherent Russian description
    («светло-русые кудрявые волосы, голубые глаза… мягкая жёлтая пижама…»).
- `npm run build` + `npm run test:int` green (12).

## Notes

- Style selection in the wizard (style chosen before heroes) is wired in 9.10; this
  task delivers the backend that accepts and applies the style.
- `toDataUri` is now shared by the worker (reference/QC) and hero captioning.
