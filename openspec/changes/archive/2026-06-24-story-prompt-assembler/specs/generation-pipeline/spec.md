## ADDED Requirements

### Requirement: The final story prompt is assembled from all sources

The generation worker SHALL build the story prompt deterministically from the child
profile, the MAIN hero (description, image caption, personality), the companion
heroes, the story theme, the chosen style, and per-size requirements. The chosen
style SHALL be a `StyleTemplate` (until per-book selection exists, the first active
one).

#### Scenario: Assembled prompt carries every block

- **WHEN** a book is generated for a child that has a MAIN hero and companions
- **THEN** the story prompt includes the child profile, the MAIN hero (with its caption/personality), the companions, the theme, and the style

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
