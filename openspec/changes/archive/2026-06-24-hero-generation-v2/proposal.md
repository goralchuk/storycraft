## Why

Hero generation is the heart of the v2 pipeline: the MAIN hero represents the child
and must be a recognizable human child in the chosen book style, with a saved
appearance description (and an optional VL caption) so later illustrations can stay
consistent. Two gaps block this:

- The 9.1 default image model `qwen-image-edit-plus-2025-12-15` **requires an input
  image** (it can't do text-only), so a from-scratch hero would 400. The base
  text-to-image default must be `qwen-image-2.0` (hybrid edit/base comes in 9.7).
- The hero prompt only passes the name, so a MAIN hero «Лев» is drawn as a lion, and
  the chosen style isn't applied.

## What Changes

- **Base image model default** → `qwen-image-2.0` (text-to-image capable). Still
  switchable via `AppSettings.imageModel`.
- **Hero prompt v2**: hero generation builds the prompt from the child profile
  (reusing 9.4's resolver) so a MAIN hero is disambiguated as a human child of the
  resolved gender/age; companions keep their own nature. The chosen **style** (a
  `StyleTemplate`, by `styleId`) is folded into the prompt. The description used is
  saved on the hero.
- **VL caption wrapper**: a new `ImageCaptioner` abstraction + Qwen `qwen3-vl-flash`
  implementation. After a hero image is generated, it is captioned (fail-open) and
  stored on `Hero.imageCaption`, so a future step can reuse a textual description of
  the actual portrait.

## Capabilities

### Modified Capabilities
- `heroes`: hero generation builds the prompt from the child profile (MAIN = human child of the resolved gender/age) in the chosen style, saves the description, and stores a VL caption of the generated portrait.
- `story-generation`: the default image model is `qwen-image-2.0` (text-to-image capable base).

## Impact

- **DB**: `AppSettings.imageModel` default → `qwen-image-2.0` (migration). `Hero.imageCaption` (added in 9.3) now populated.
- **Backend**: extract a shared `toDataUri` util; new `ImageCaptioner` (contract + Qwen impl, registered/exported in `AiModule`); `heroes.service.generate` reworked (profile + style + caption); `GenerateHeroDto += styleId?`.
- **No frontend changes** (style selection in the wizard is 9.10).
