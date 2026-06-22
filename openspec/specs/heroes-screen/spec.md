# heroes-screen Specification

## Purpose
TBD - created by archiving change russify-heroes-screen. Update Purpose after archive.
## Requirements
### Requirement: Heroes screen

The `/children/[id]/heroes` screen SHALL list the child's heroes as cards — each
showing the hero's avatar (image or name initial), name, role, remaining free
generations, and status — and SHALL offer the hero actions: generate an avatar,
top up generations when none remain, remove a companion (never the main hero), and
add a companion (when under the limit). The screen SHALL be presented in Russian and
use the application's design system.

#### Scenario: Heroes render

- **WHEN** the user opens `/children/[id]/heroes`
- **THEN** each hero appears as a card with avatar, name, role, free-generation count, and status, with the relevant actions

#### Scenario: Russian UI

- **WHEN** the heroes screen is shown
- **THEN** its labels, buttons and messages are in Russian

