## ADDED Requirements

### Requirement: Illustrator selects edit vs base model by reference presence

The image generator SHALL use the reference-conditioned edit model (`AppSettings.imageEditModel`) when an illustration request carries one or more reference images, and the base text-to-image model (`AppSettings.imageModel`) otherwise. Both models SHALL remain configurable via `AppSettings`.

#### Scenario: Reference present uses the edit model

- **WHEN** an illustration is requested with at least one reference image
- **THEN** the request is sent to the configured edit model

#### Scenario: No reference uses the base model

- **WHEN** an illustration is requested with no reference image
- **THEN** the request is sent to the configured base model
