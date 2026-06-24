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

Step 2 SHALL let the user choose the book's visual style from the available style
templates **before** configuring heroes, and SHALL set the story topic, the page-tier
length (showing per-tier surcharges), and an optional free-text wish after heroes,
persisting them to the draft (the style as `Book.styleTemplateId`). The chosen style
SHALL be applied to hero image generation. For Template books these story settings
SHALL be frozen and only hero configuration editable.

#### Scenario: Style chosen before heroes and applied

- **WHEN** the user picks a book style and then generates a hero
- **THEN** the style is saved on the draft and the hero portrait is generated in that style

#### Scenario: Settings saved to draft

- **WHEN** the user sets style, topic, length, or wish on a Unique book
- **THEN** the values are saved on the draft

#### Scenario: Template freezes settings

- **WHEN** the book type is Template
- **THEN** style, topic, and length are locked (not editable) and only hero configuration can be changed

### Requirement: Step 2 — proceed and exit

Step 2 SHALL provide a primary action that saves the configuration and advances
to step 3 (generation), and a way to save and exit while keeping the draft.
Submission for generation happens in step 3, not step 2 — advancing SHALL NOT
charge or submit the book.

#### Scenario: Proceed to step 3

- **WHEN** the user confirms step 2 with a child selected
- **THEN** the configuration is saved and the wizard advances to the step-3 generation screen for that draft, with no charge and the book still a draft

#### Scenario: Save and exit

- **WHEN** the user leaves the wizard without proceeding
- **THEN** the draft and its saved configuration are retained for later resumption

### Requirement: Step 3 — generation indicator and layout

The step-3 screen SHALL show the wizard step indicator with step 3 active and
present the book's generation state (ready, in progress, done, or failed).

#### Scenario: Step 3 active

- **WHEN** the user views the generation screen for a book
- **THEN** the step indicator shows step 3 as active

### Requirement: Step 3 — start generation

For a configured draft, step 3 SHALL present a ready state with an action to start
generation. Starting SHALL charge the page-tier surcharge and submit the book,
moving it into the in-progress state. Insufficient coins SHALL keep the draft and
direct the user to top up.

#### Scenario: Start generation

- **WHEN** the user starts generation on a ready draft with sufficient coins
- **THEN** the page-tier surcharge is charged, the book is submitted, and it enters the in-progress state

#### Scenario: Insufficient coins at start

- **WHEN** the user starts generation but cannot afford the surcharge
- **THEN** the book remains a draft and the user is directed to top up

### Requirement: Step 3 — live progress

Step 3 SHALL show live generation progress read from the book's latest generation
record (current step and percentage), falling back to the book's own stage/progress
when no generation record is present, polling until a terminal status is reached.

#### Scenario: Progress advances from the generation record

- **WHEN** generation is running
- **THEN** step 3 shows the current step and percentage from the latest generation record and updates as it advances

### Requirement: Step 3 — completion and failure

When the book is done, step 3 SHALL present a completed state that opens the book
for reading and offers a return to the dashboard. When generation has failed,
step 3 SHALL show an error state with a way to try again.

#### Scenario: Done opens the reader

- **WHEN** the book reaches the done state
- **THEN** the user can open and read the finished book

#### Scenario: Failure offers retry

- **WHEN** generation has failed
- **THEN** an error is shown with an option to try again

