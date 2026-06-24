## ADDED Requirements

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
