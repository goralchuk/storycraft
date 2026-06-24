## MODIFIED Requirements

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

### Requirement: Step 3 — live progress

Step 3 SHALL show live generation progress read from the book's latest generation
record (current step and percentage), falling back to the book's own stage/progress
when no generation record is present, polling until a terminal status is reached.

#### Scenario: Progress advances from the generation record

- **WHEN** generation is running
- **THEN** step 3 shows the current step and percentage from the latest generation record and updates as it advances
