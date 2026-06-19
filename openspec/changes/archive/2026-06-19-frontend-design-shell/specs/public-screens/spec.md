## ADDED Requirements

### Requirement: Landing screen

The landing screen SHALL present the marketing hero (product promise and headline) with call-to-action buttons, styled to match the prototype. Its CTAs SHALL route an unauthenticated visitor into the auth flow.

#### Scenario: Landing CTA enters auth

- **WHEN** a visitor clicks a landing CTA ("Начать" / "Войти" / "Создать книгу бесплатно")
- **THEN** they are taken to the auth/sign-in flow

#### Scenario: Landing has no navbar

- **WHEN** the landing screen renders
- **THEN** the shared app navbar is not shown

### Requirement: Auth screen

The auth screen SHALL present the sign-in entry point styled to match the prototype, and on successful sign-in SHALL route the user onward (new user → onboarding, returning user → dashboard) per the existing auth callback logic.

#### Scenario: Successful sign-in routes onward

- **WHEN** a user completes sign-in
- **THEN** a new user (no name set) lands on onboarding and a returning user lands on the dashboard

### Requirement: Onboarding flow

The onboarding screen SHALL guide a new user through two steps — step 1 captures the user's name, step 2 adds a first child — styled to match the prototype, and SHALL offer a "skip for now" path.

#### Scenario: Complete onboarding

- **WHEN** the user enters a name in step 1 and adds a child in step 2
- **THEN** the name and child are saved and the user lands on the dashboard

#### Scenario: Skip onboarding

- **WHEN** the user chooses "skip for now"
- **THEN** they land on the dashboard in its empty state
