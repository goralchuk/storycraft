## ADDED Requirements

### Requirement: A completed run is persisted as a reusable story history

On successful completion the worker SHALL create a `BookTemplateHistory` containing
the tokenized story (title, slots, pages) and the assembled story prompt, with
references to the style and theme used, and SHALL link it on the book
(`Book.templateHistoryId`). The book SHALL record its completion time
(`Book.finishedAt`).

#### Scenario: History is created and linked on success

- **WHEN** a book finishes generating
- **THEN** a `BookTemplateHistory` with the tokenized story + assembled prompt exists and `Book.templateHistoryId` points to it, and `Book.finishedAt` is set

#### Scenario: No history on failure

- **WHEN** generation fails
- **THEN** no `BookTemplateHistory` is created for that run
