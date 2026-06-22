## ADDED Requirements

### Requirement: Each page carries an illustration scene description

The text generator SHALL produce, for every page, an `imageDescription` — a detailed Russian description of the scene to illustrate (action, setting, mood) — in addition to the page text. The `imageDescription` MAY contain slot tokens and SHALL be stored on the page's illustration.

#### Scenario: Generated page includes a scene description

- **WHEN** a story is generated
- **THEN** each page has a non-empty `imageDescription` and it is saved on the page's illustration record

### Requirement: Illustrations are generated from the scene description

The generation worker SHALL build each illustration from the page's slot-resolved `imageDescription` rather than from the raw page text. When a page has no `imageDescription`, the worker SHALL fall back to the page text.

#### Scenario: Illustration uses the scene description

- **WHEN** the worker illustrates a page that has an `imageDescription`
- **THEN** the image prompt is derived from the resolved `imageDescription`, not the page sentence

#### Scenario: Fallback when no scene description

- **WHEN** a page has an empty `imageDescription`
- **THEN** the worker derives the image prompt from the page text instead
