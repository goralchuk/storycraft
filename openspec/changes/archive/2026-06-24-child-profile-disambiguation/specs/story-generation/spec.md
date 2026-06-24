## ADDED Requirements

### Requirement: Prompts carry the child profile and disambiguate the species

The system SHALL resolve the child's age — from `Child.birthDate` (in years), or
failing that the lower bound of the story theme's age range — and gender — from
`Child.gender` (`мальчик`/`девочка`), or failing that the neutral `ребёнок`. It SHALL
include the resolved age (when known) and gender in both the story text prompt and
the illustration prompt for pages depicting the child, stating that the main
character is a human child (not an animal or object) and that the name is a proper
noun.

#### Scenario: Animal-like name renders as a human child

- **WHEN** a book is generated for a child whose name reads like an animal (e.g. «Лев»)
- **THEN** the story and child-facing illustration prompts state the main character is a human child of the resolved gender/age, so the name is not drawn or written as that animal

#### Scenario: Missing birth date falls back to the theme age range

- **WHEN** the child has no `birthDate`
- **THEN** the age used in the prompts is taken from the story theme's age range

#### Scenario: Missing gender uses a neutral term

- **WHEN** the child's gender is unset or unrecognized
- **THEN** the prompts refer to the main character with the neutral term `ребёнок`
