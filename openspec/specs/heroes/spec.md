# Heroes

## Purpose

Child-owned hero characters (one main + companions, max 5) with metered, billable avatar generation — free attempts, paid top-ups, paid companions, and per-child reset on book completion. Heroes are reusable across books.
## Requirements
### Requirement: Child hero roster

The system SHALL let each `Child` own heroes: exactly one non-removable `MAIN` hero plus up to four companions (`PET | SIBLING | FRIEND | MAGIC`), for a maximum of five heroes per child. A hero has a `role`, `name`, optional `style`, optional `description`, optional `imageKey`, a `freeAttempts` count (default 3), and a `status` (`IDLE | GENERATING | DONE`). Heroes are owned by the child and reusable across books.

#### Scenario: Main hero is ensured

- **WHEN** the heroes of a child are listed and no `MAIN` hero exists
- **THEN** a `MAIN` hero derived from the child is created and returned, free of charge

#### Scenario: Fifth hero is rejected

- **WHEN** a child already has a `MAIN` hero and four companions and another companion is added
- **THEN** the request is rejected and no companion is created

### Requirement: Paid companions

The system SHALL expose `POST /children/:childId/heroes` to add a companion with a `role` and `name`. It SHALL debit `COMPANION` coins, reject adding a second `MAIN`, and reject exceeding the five-hero limit. When the balance is insufficient, it SHALL return the insufficient-funds error and create no companion.

#### Scenario: Adding a companion debits coins

- **WHEN** a user with enough coins adds a companion to a child with room
- **THEN** the companion is created with `freeAttempts` 3 and `COMPANION` coins are debited

#### Scenario: Insufficient coins blocks a companion

- **WHEN** a user without enough coins adds a companion
- **THEN** the insufficient-funds error is returned and no companion is created

### Requirement: Remove a companion

The system SHALL expose `DELETE /heroes/:id` to remove a companion. Deleting the `MAIN` hero SHALL be rejected.

#### Scenario: Companion is removed

- **WHEN** a user deletes one of their companions
- **THEN** the companion is removed

#### Scenario: Main hero cannot be deleted

- **WHEN** a user attempts to delete a `MAIN` hero
- **THEN** the request is rejected and the hero remains

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

### Requirement: Top up generations

The system SHALL expose `POST /heroes/:id/topup` that debits `HERO_TOPUP` coins and adds three free attempts to the hero. When the balance is insufficient, it SHALL return the insufficient-funds error and add no attempts.

#### Scenario: Top-up buys three attempts

- **WHEN** a user tops up a hero with `freeAttempts` 0
- **THEN** `HERO_TOPUP` coins are debited and `freeAttempts` becomes 3

### Requirement: Free attempts reset on book completion

The system SHALL reset `freeAttempts` to 3 for every hero of a book's child when that book reaches `DONE`.

#### Scenario: Completion refreshes the child's heroes

- **WHEN** a book for a child reaches status `DONE`
- **THEN** every hero of that child has `freeAttempts` reset to 3

