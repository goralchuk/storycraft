## ADDED Requirements

### Requirement: Reader renders page layouts

The reader SHALL render each page spread according to its `layout`: `IMAGE_ONLY`
shows the illustration with no text, `IMAGE_TEXT` shows the illustration with the
text, and `TEXT_ONLY` shows the text with no illustration.

#### Scenario: Image-only page hides text

- **WHEN** a page with layout `IMAGE_ONLY` is shown
- **THEN** the reader shows the illustration and no text block

#### Scenario: Text-only page hides image

- **WHEN** a page with layout `TEXT_ONLY` is shown
- **THEN** the reader shows the text and no illustration
