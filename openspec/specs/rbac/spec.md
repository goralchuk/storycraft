# RBAC

## Purpose

User roles (`USER`/`ADMIN`) and role-based authorization for admin-only API endpoints.

## Requirements

### Requirement: User roles

The system SHALL assign every `User` a role of either `USER` or `ADMIN`, defaulting to `USER`. The role SHALL be persisted on the `User` record.

#### Scenario: New user defaults to USER

- **WHEN** a new user is created through sign-up
- **THEN** their role is `USER`

#### Scenario: Designated admin is seeded

- **WHEN** the database seed runs
- **THEN** the user whose email is `goralchuk.r@gmail.com` has role `ADMIN`

### Requirement: Role-based authorization on admin endpoints

The system SHALL protect admin-only endpoints with a roles guard that admits a request only when the authenticated user's role is `ADMIN`. An authenticated non-admin SHALL receive `403 Forbidden`; an unauthenticated request SHALL receive `401 Unauthorized`.

#### Scenario: Admin reaches a protected endpoint

- **WHEN** a user with role `ADMIN` calls an admin-only endpoint with a valid token
- **THEN** the request is processed normally

#### Scenario: Non-admin is rejected

- **WHEN** a user with role `USER` calls an admin-only endpoint with a valid token
- **THEN** the response is `403 Forbidden`

#### Scenario: Unauthenticated request is rejected

- **WHEN** an admin-only endpoint is called without a valid token
- **THEN** the response is `401 Unauthorized`

### Requirement: Settings endpoints are admin-only

The system SHALL require the `ADMIN` role for all `/settings` endpoints (read and write), which previously were open to any authenticated user.

#### Scenario: Non-admin cannot read settings

- **WHEN** a user with role `USER` calls `GET /settings`
- **THEN** the response is `403 Forbidden`

#### Scenario: Admin can update settings

- **WHEN** a user with role `ADMIN` calls `PATCH /settings`
- **THEN** the settings are updated and returned
