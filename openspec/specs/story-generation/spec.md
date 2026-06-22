# story-generation Specification

## Purpose
TBD - created by archiving change real-russian-generation. Update Purpose after archive.
## Requirements
### Requirement: Stories are generated in Russian

The text generator SHALL produce the story title and every page's text in Russian. Slot tokens (e.g. `{{child}}`, `{{friend}}`) and the JSON structure SHALL remain unchanged; only the natural-language content is Russian.

#### Scenario: Submitted book has Russian content

- **WHEN** a book is submitted and generation completes with the Qwen text provider
- **THEN** the stored title and page texts are written in Russian, with slot tokens preserved

### Requirement: Default AI providers are Qwen

The system SHALL default `AppSettings.textProvider` and `AppSettings.imageProvider` to `qwen`, with `textModel` `qwen3.7-plus` and `imageModel` `qwen-image-2.0`. A fresh database SHALL generate real books without manual configuration. Providers SHALL remain switchable at runtime via `AppSettings` (an admin MAY set them to `gemini` or `stub`).

#### Scenario: Fresh database uses Qwen

- **WHEN** the application initializes its `AppSettings` singleton on a new database
- **THEN** the text and image providers are `qwen` with models `qwen3.7-plus` and `qwen-image-2.0`

#### Scenario: Provider remains switchable

- **WHEN** an admin sets `textProvider`/`imageProvider` to `stub`
- **THEN** subsequent generations use the stub providers without a redeploy

### Requirement: Generated illustrations are persisted to our storage

The image generator SHALL store the generated image in the application's own object storage and SHALL return a storage key (not a third-party URL), so illustrations remain available after the provider's temporary URL expires.

#### Scenario: Qwen image is re-hosted

- **WHEN** the Qwen image provider returns a temporary OSS image URL
- **THEN** the system fetches the bytes and uploads them to its own storage, persisting a storage key on the illustration

### Requirement: PDF renders the book legibly

The assembled PDF SHALL render Russian (Cyrillic) text using an embedded Unicode font with Cyrillic glyphs, and SHALL embed each page's illustration by resolving its storage key to a fetchable (signed) URL before drawing.

#### Scenario: Russian text appears in the PDF

- **WHEN** a completed book with Russian content is assembled into a PDF
- **THEN** the title and page text are rendered as readable Cyrillic characters (not missing glyphs or placeholders)

#### Scenario: Illustrations appear in the PDF

- **WHEN** a completed book's pages have stored illustrations
- **THEN** each illustration is embedded in the PDF (the storage key is signed, not fetched verbatim)

### Requirement: Each page carries an illustration scene description

The text generator SHALL produce, for every page, an `imageDescription` — a detailed Russian description of the scene to illustrate (action, setting, mood) — in addition to the page text. The `imageDescription` MAY contain slot tokens and SHALL be stored on the page's illustration.

#### Scenario: Generated page includes a scene description

- **WHEN** a story is generated
- **THEN** each page has a non-empty `imageDescription` and it is saved on the page's illustration record

### Requirement: Illustrations are generated from the scene description

The generation worker SHALL build each illustration from the page's slot-resolved `imageDescription` rather than from the raw page text. When a page has no `imageDescription`, the worker SHALL fall back to the page text.

#### Scenario: Illustration uses the scene description

- **WHEN** the worker illustrates a page that has an `imageDescription`
- **THEN** the image prompt is derived from the resolved `imageDescription`, not the page sentence

#### Scenario: Fallback when no scene description

- **WHEN** a page has an empty `imageDescription`
- **THEN** the worker derives the image prompt from the page text instead

