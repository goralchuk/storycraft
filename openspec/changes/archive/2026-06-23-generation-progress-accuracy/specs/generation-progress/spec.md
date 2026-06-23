## MODIFIED Requirements

### Requirement: Worker advances stage and progress

While generating, the worker SHALL set the stage to `HEROES` while it prepares the
main-character reference, then `STORY` before writing text, then `ILLUSTRATIONS`
while producing images, then `ASSEMBLE` before building the PDF, and SHALL set
`progress` to 100 when the book reaches `DONE`. During the `ILLUSTRATIONS` stage,
`progress` SHALL be weighted by the pages that actually generate an image (a
`TEXT_ONLY` page generates no image and SHALL NOT advance the bar). Progress SHALL
be non-decreasing during a run.

#### Scenario: Heroes stage prepares the character reference

- **WHEN** the worker begins a run
- **THEN** it is at stage `HEROES` while it loads the main hero and prepares the reference image, before moving to `STORY`

#### Scenario: Progress reaches the illustrations stage

- **WHEN** the worker has written the story and is producing images
- **THEN** `GET /books/:id` reports stage `ILLUSTRATIONS` with `progress` greater than at the `STORY` stage

#### Scenario: Illustration progress tracks image work

- **WHEN** the worker produces images for a book that mixes image and `TEXT_ONLY` pages
- **THEN** `progress` advances only as image-generating pages complete and remains non-decreasing across `TEXT_ONLY` pages

#### Scenario: Completed book reports full progress

- **WHEN** a book reaches `DONE`
- **THEN** `progress` is 100
