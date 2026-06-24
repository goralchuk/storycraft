## MODIFIED Requirements

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
