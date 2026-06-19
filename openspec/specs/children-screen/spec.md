# Children Screen

## Purpose

The child-profile management screen — CRUD, photo upload, and saved-hero previews.

## Requirements

### Requirement: Children list

The `/children` screen SHALL list the authenticated user's children as cards, each showing the child's avatar (photo or name initial), name, age/gender, and interest chips.

#### Scenario: Children render

- **WHEN** the user opens `/children`
- **THEN** each of their children appears as a card with avatar, name, age/gender, and interests

### Requirement: Child create, edit, delete

The children screen SHALL let the user add a child via an inline form, edit an existing child, and delete a child. Create and edit SHALL capture name, birth date, gender, and interests. Delete SHALL surface the backend guard when a child still has books.

#### Scenario: Add a child

- **WHEN** the user fills the inline add form and saves
- **THEN** the child is created and appears in the list

#### Scenario: Edit a child

- **WHEN** the user edits a child's fields and saves
- **THEN** the child's details are updated in the list

#### Scenario: Delete blocked by books

- **WHEN** the user deletes a child that still has books
- **THEN** the deletion is rejected and the user is informed the child has books

### Requirement: Child photo upload

The children screen SHALL let the user upload a photo for a child; the photo SHALL be stored via the backend upload endpoint and persisted as the child's `photoUrl`, and the card SHALL reflect that a photo is present.

#### Scenario: Upload a photo

- **WHEN** the user uploads a photo for a child
- **THEN** the photo is stored and the child's card shows the photo / photo-present status

### Requirement: Saved heroes preview

Each child card SHALL preview the child's saved heroes and link to that child's hero management page.

#### Scenario: Heroes preview and link

- **WHEN** a child has saved heroes
- **THEN** the card previews them and provides a link to manage that child's heroes
