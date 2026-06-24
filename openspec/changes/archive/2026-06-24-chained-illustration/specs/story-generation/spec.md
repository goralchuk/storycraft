## ADDED Requirements

### Requirement: Illustrations are chained for cross-page consistency

The worker SHALL condition each page's illustration on a set of reference images
assembled from the page's cast — the MAIN hero portrait when the child is shown,
companion portraits when companions are shown, and the previous page's generated
image for visual continuity — capped at three references (the edit model's limit). It
SHALL also include a short plot (the book title) in the illustration prompt.

#### Scenario: A later page keeps the hero and style

- **WHEN** a page is illustrated after an earlier page that depicts the child
- **THEN** the request includes the previous page (and the hero portrait) as references, so the child and style stay consistent across pages

#### Scenario: References are capped

- **WHEN** more than three references would apply to a page
- **THEN** at most three are sent (hero, companions, previous page, de-duplicated)
