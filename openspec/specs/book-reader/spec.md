# Book Reader

## Purpose

The finished-book reader — paged HTML spreads built from stored pages
(slot-resolved text + illustrations) and a download of the assembled PDF.
## Requirements
### Requirement: Reader access

The reader at `/books/:id/read` SHALL be available only for a completed book the
user owns; any other status SHALL redirect to the book's generation screen.

#### Scenario: Open a completed book

- **WHEN** the user opens the reader for a book that is done
- **THEN** the reader renders the book

#### Scenario: Book not finished

- **WHEN** the user opens the reader for a book that is not done
- **THEN** they are redirected to the book's generation screen

### Requirement: Spread rendering

The reader SHALL present the book as a cover followed by one spread per page, each
showing the page illustration (when present) and its slot-resolved text, with
navigation between spreads and a position indicator.

#### Scenario: Navigate spreads

- **WHEN** the user moves to the next or previous spread
- **THEN** the reader shows that spread and updates the position indicator

#### Scenario: Slot tokens resolved

- **WHEN** a page's text contains slot tokens
- **THEN** the reader shows the resolved text (e.g. the child's name), not the raw tokens

### Requirement: PDF download

The reader SHALL offer a one-click download of the book's PDF when one is available.

#### Scenario: PDF available

- **WHEN** the finished book has an assembled PDF
- **THEN** the reader offers a download of it

#### Scenario: PDF absent

- **WHEN** the finished book has no PDF
- **THEN** the reader does not offer a PDF download

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

