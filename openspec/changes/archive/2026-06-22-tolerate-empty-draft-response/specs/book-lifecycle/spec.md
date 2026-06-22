## MODIFIED Requirements

### Requirement: Resume the current draft

The system SHALL expose `GET /books/draft` returning the user's current `DRAFT` book (with its configuration), or an empty result when none exists. When there is no draft, the response SHALL be an HTTP 200 with an empty body, and clients SHALL tolerate the empty body (treating it as "no draft") rather than assume a JSON payload. The book list (`GET /books`) SHALL exclude `DRAFT` books.

#### Scenario: Draft persists across requests

- **WHEN** a user creates a draft, then later calls `GET /books/draft`
- **THEN** the same draft is returned with its saved configuration

#### Scenario: No draft returns an empty body clients tolerate

- **WHEN** a user with no draft calls `GET /books/draft`
- **THEN** the response is HTTP 200 with an empty body, and the client treats it as "no draft" without erroring

#### Scenario: List excludes drafts

- **WHEN** a user with a draft calls `GET /books`
- **THEN** the draft is not included in the returned list
