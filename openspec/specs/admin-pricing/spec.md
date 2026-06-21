# Admin Pricing

## Purpose

The admin-only price-catalog editor — lets an admin tune coin prices in-app so the
economy is testable, with a role-gated entry point.

## Requirements

### Requirement: Admin price catalog editor

The `/admin/pricing` screen SHALL be accessible only to admin users and SHALL list
the coin price catalog grouped by category, letting an admin edit each item's
amount. A non-admin who opens it SHALL be redirected away.

#### Scenario: Admin edits a price

- **WHEN** an admin changes an item's amount and saves
- **THEN** the price is updated and subsequent reads and charges use the new amount

#### Scenario: Non-admin is blocked

- **WHEN** a non-admin opens `/admin/pricing`
- **THEN** they are redirected away from the screen

### Requirement: Gated admin entry point

The app navigation SHALL surface a link to the admin pricing screen only for admin
users.

#### Scenario: Admin sees the link

- **WHEN** an admin views the app navigation
- **THEN** a link to the admin pricing screen is shown

#### Scenario: Non-admin does not see the link

- **WHEN** a non-admin views the app navigation
- **THEN** no admin pricing link is shown
