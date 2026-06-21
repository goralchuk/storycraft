# Book Wizard

## Purpose

The redesigned multi-step book-creation wizard — step 1 (book type / template +
pay → DRAFT) and step 2 (main child, inline hero generation, story settings, and
template field-locking). Step 3 (generation/reader) is delivered separately.

## Requirements

### Requirement: Wizard step indicator

The book wizard SHALL present a three-step indicator (type → configuration →
generation) and reflect the user's current step.

#### Scenario: Step 1 active without a draft

- **WHEN** the user opens the wizard and has no DRAFT book
- **THEN** the wizard shows step 1 as active

#### Scenario: Step 2 active with a draft

- **WHEN** the user has a DRAFT book and opens the wizard
- **THEN** the wizard shows step 2 as active

### Requirement: Step 1 — book type and payment

Step 1 SHALL let the user choose a book type — Unique or Template — showing each
type's coin price from the pricing catalog. Choosing Template SHALL reveal a
template picker. Confirming SHALL debit the type cost and create a DRAFT, then
advance to step 2; an existing DRAFT SHALL be resumed without a second charge.

#### Scenario: Pay creates a draft and advances

- **WHEN** the user selects a type (and a template if Template) and confirms payment with sufficient coins
- **THEN** the type cost is debited, a DRAFT is created, and the wizard advances to step 2

#### Scenario: Insufficient coins

- **WHEN** the user confirms payment but lacks enough coins
- **THEN** no draft is charged into existence and the user is directed to top up

#### Scenario: Existing draft resumes free

- **WHEN** the user already has a DRAFT and opens the wizard
- **THEN** they continue that draft at step 2 without being charged again

### Requirement: Step 2 — child and hero configuration

Step 2 SHALL require selecting the main child, and SHALL let the user manage that
child's heroes inline: generate or regenerate a hero's image, top up generation
attempts, add a companion (with role and name) for the companion cost, and remove
a companion. Each hero SHALL show its remaining free-generation attempts and its
status (idle / generating / done).

#### Scenario: Select child

- **WHEN** the user picks a child as the main hero
- **THEN** that child is saved on the draft and the child's main hero is shown

#### Scenario: Generate a hero image

- **WHEN** the user triggers generation for a hero with attempts remaining
- **THEN** the hero image is generated and the hero shows the done state with one fewer attempt

#### Scenario: Out of attempts

- **WHEN** a hero has no free attempts left and the user tops up
- **THEN** the hero receives additional attempts (charged), allowing generation again

#### Scenario: Add and remove a companion

- **WHEN** the user adds a companion with a role and name
- **THEN** the companion is created (charged the companion cost) and can later be removed

### Requirement: Step 2 — story settings

Step 2 SHALL let the user set the illustration style, the story topic, the
page-tier length (showing per-tier surcharges), and an optional free-text wish,
persisting them to the draft. For Template books these story settings SHALL be
frozen and only hero configuration editable.

#### Scenario: Settings saved to draft

- **WHEN** the user sets style, topic, length, or wish on a Unique book
- **THEN** the values are saved on the draft

#### Scenario: Template freezes settings

- **WHEN** the book type is Template
- **THEN** style, topic, and length are locked (not editable) and only hero configuration can be changed

### Requirement: Step 2 — proceed and exit

Step 2 SHALL provide a primary action that saves the configuration and submits
the book for generation, and a way to save and exit while keeping the draft.

#### Scenario: Proceed to generation

- **WHEN** the user confirms step 2 with a child selected
- **THEN** the configuration is saved, the book is submitted for generation, and the user lands on the book's generation/progress view

#### Scenario: Save and exit

- **WHEN** the user leaves the wizard without submitting
- **THEN** the draft and its saved configuration are retained for later resumption
