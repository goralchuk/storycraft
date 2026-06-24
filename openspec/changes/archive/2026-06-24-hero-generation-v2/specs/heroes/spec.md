## MODIFIED Requirements

### Requirement: Metered avatar generation

The system SHALL expose `POST /heroes/:id/generate` (optional `style`, `styleId`, `description`) that generates the hero's avatar via the image generator, stores its `imageKey`, sets `status` to `DONE`, and decrements `freeAttempts` by one. When `freeAttempts` is already zero, it SHALL return the 402-style top-up-required error and SHALL NOT generate or change the hero.

The generation prompt SHALL be built from the child's resolved profile: a MAIN hero SHALL be disambiguated as a human child of the resolved gender/age (so a name like «Лев» is not drawn as an animal), while a companion keeps its own nature. When a `styleId` is given, the matching style template's prompt SHALL be applied. The description used SHALL be saved on the hero, and a vision-language caption of the generated portrait SHALL be stored on `Hero.imageCaption` (fail-open: a caption error SHALL NOT fail generation).

#### Scenario: Free generation consumes an attempt

- **WHEN** a hero with `freeAttempts` 3 is generated
- **THEN** an avatar `imageKey` is stored, `status` is `DONE`, and `freeAttempts` becomes 2

#### Scenario: Generation is blocked when attempts run out

- **WHEN** a hero with `freeAttempts` 0 is generated
- **THEN** the top-up-required error is returned, no avatar is generated, and `freeAttempts` stays 0

#### Scenario: MAIN hero is a human child in the chosen style

- **WHEN** a MAIN hero whose child is named «Лев» is generated with a chosen style
- **THEN** the prompt marks the hero as a human child of the resolved gender/age and applies the style, so the portrait is a child (not a lion)

#### Scenario: Generated portrait is captioned

- **WHEN** a hero avatar is generated
- **THEN** a VL caption of the portrait is stored on `Hero.imageCaption`, and a caption failure leaves generation successful
