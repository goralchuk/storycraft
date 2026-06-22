## ADDED Requirements

### Requirement: Main-character illustrations use a reference image when available

When a book's child has a MAIN hero with a generated image, the generation worker SHALL pass a downscaled (≤1024×1024, compressed) reference image of that hero to the illustrator on every page that depicts the child (`featuresChild`), so the main character's appearance is conditioned on the actual reference. The reference SHALL be sent inline (base64) and SHALL be small enough to fit the image provider's request limit. When the MAIN hero has no image, or preparing the reference fails, the worker SHALL fall back to generating without a reference image.

#### Scenario: Child-facing pages use the hero reference image

- **WHEN** the worker illustrates a `featuresChild` page and the child's MAIN hero has a generated image
- **THEN** a downscaled base64 reference image is included in the illustration request

#### Scenario: Fallback when no hero image

- **WHEN** the child's MAIN hero has no image (or the reference cannot be prepared)
- **THEN** illustrations are generated without a reference image, without failing
