## ADDED Requirements

### Requirement: Child-facing illustrations are quality-checked and regenerated once

When a reference image is available, the generation worker SHALL score each
`featuresChild` illustration against the MAIN hero reference using a vision-language
model and, when the score is below the pass threshold, SHALL regenerate that page's
image once and keep the regenerated result. The check SHALL be fail-open: any error
in scoring SHALL leave the original image and SHALL NOT fail the book, and pages
without a reference image SHALL be left unchecked.

#### Scenario: Low-scoring page is regenerated once

- **WHEN** a `featuresChild` illustration scores below the pass threshold against the reference
- **THEN** the worker regenerates the page image once and stores the regenerated image

#### Scenario: Passing page is kept

- **WHEN** a `featuresChild` illustration scores at or above the threshold
- **THEN** the original image is kept and no regeneration occurs

#### Scenario: Checker failure is fail-open

- **WHEN** the vision-language check errors or no reference image is available
- **THEN** the original image is kept and generation continues without failing
