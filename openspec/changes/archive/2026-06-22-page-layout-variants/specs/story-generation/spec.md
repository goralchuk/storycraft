## ADDED Requirements

### Requirement: Pages have a model-chosen layout

The text generator SHALL assign each page a `layout` of `IMAGE_ONLY`, `IMAGE_TEXT`,
or `TEXT_ONLY`, and the worker SHALL store it on the page. The worker SHALL NOT
generate an illustration for `TEXT_ONLY` pages. The assembled PDF SHALL render each
page according to its layout (full image; image with text; or text only). An invalid
or missing layout SHALL default to `IMAGE_TEXT`.

#### Scenario: Text-only page has no illustration

- **WHEN** a page's layout is `TEXT_ONLY`
- **THEN** the worker stores the page with that layout and generates no illustration for it

#### Scenario: Image pages are illustrated

- **WHEN** a page's layout is `IMAGE_ONLY` or `IMAGE_TEXT`
- **THEN** the worker generates an illustration for it

#### Scenario: PDF renders by layout

- **WHEN** the PDF is assembled
- **THEN** each page is rendered according to its layout
