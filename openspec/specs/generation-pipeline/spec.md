# generation-pipeline Specification

## Purpose
TBD - created by archiving change generation-data-model. Update Purpose after archive.
## Requirements
### Requirement: Book style is template-driven

The system SHALL provide a catalog of visual style templates (each a prompt fragment
used by image generation) and SHALL seed at least one active style template on a
fresh database, so a style can be chosen before heroes are generated.

#### Scenario: Fresh database has a style template

- **WHEN** the database is seeded
- **THEN** at least one active `StyleTemplate` exists

### Requirement: Page layout is defined per book size

The system SHALL provide a page-layout template per supported book size that defines,
for each page, its layout and which characters appear. A fresh database SHALL seed a
page-layout template for each supported size (12, 16, 20, 24).

#### Scenario: Fresh database has a layout for each size

- **WHEN** the database is seeded
- **THEN** a `PageLayoutTemplate` exists for each of page counts 12, 16, 20, and 24

### Requirement: A custom story-theme base exists

The story-theme catalog SHALL include a custom base entry, used as the scaffold when
the parent writes their own story rather than picking a preset theme.

#### Scenario: Fresh database has a custom theme base

- **WHEN** the database is seeded
- **THEN** a story theme marked as the custom base exists

### Requirement: The final story prompt is assembled from all sources

The generation worker SHALL build the story prompt deterministically from the child
profile, the MAIN hero (description, image caption, personality), the companion
heroes, the story theme, the chosen style, and per-size requirements. The chosen
style SHALL be the book's selected `StyleTemplate` (`Book.styleTemplateId`), falling
back to the first active style template when the book has none.

#### Scenario: Assembled prompt carries every block

- **WHEN** a book is generated for a child that has a MAIN hero and companions
- **THEN** the story prompt includes the child profile, the MAIN hero (with its caption/personality), the companions, the theme, and the style

#### Scenario: The book's chosen style is used

- **WHEN** a book has a selected style template
- **THEN** that style is used to assemble the prompt rather than the default

### Requirement: Page structure is driven by the page-layout template

The worker SHALL resolve the `PageLayoutTemplate` for the book's `pageCount` and SHALL
set each page's `layout` and whether the child is shown (`featuresChild`) from that
template's per-page `cast` (`MAIN` or `ALL` ⇒ the child is shown), rather than from an
ad-hoc model choice.

#### Scenario: Pages follow the layout template

- **WHEN** a book of a given `pageCount` is generated and a matching `PageLayoutTemplate` exists
- **THEN** each page's `layout` and `featuresChild` match the template's entry for that page number

#### Scenario: No template falls back to the generated layout

- **WHEN** no `PageLayoutTemplate` exists for the `pageCount`
- **THEN** the pages keep the layout chosen during generation

### Requirement: A completed run is persisted as a reusable story history

On successful completion the worker SHALL create a `BookTemplateHistory` containing
the tokenized story (title, slots, pages) and the assembled story prompt, with
references to the style and theme used, and SHALL link it on the book
(`Book.templateHistoryId`). The book SHALL record its completion time
(`Book.finishedAt`).

#### Scenario: History is created and linked on success

- **WHEN** a book finishes generating
- **THEN** a `BookTemplateHistory` with the tokenized story + assembled prompt exists and `Book.templateHistoryId` points to it, and `Book.finishedAt` is set

#### Scenario: No history on failure

- **WHEN** generation fails
- **THEN** no `BookTemplateHistory` is created for that run

