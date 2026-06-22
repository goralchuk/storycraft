## ADDED Requirements

### Requirement: Main-character illustrations use a consistent description

When a book's child has a MAIN hero with an appearance description, the generation worker SHALL condition every illustration that depicts the child (`featuresChild`) on that character description, instructing the illustrator to keep the main character's appearance consistent across the book. When the MAIN hero has no description, illustration behavior SHALL be unchanged.

#### Scenario: Child-facing pages carry the character description

- **WHEN** the worker illustrates a `featuresChild` page and the child's MAIN hero has a description
- **THEN** the image prompt includes that character description with a "keep appearance consistent" instruction

#### Scenario: No hero description is a no-op

- **WHEN** the child's MAIN hero has no description
- **THEN** illustrations are generated as before, without a character description
