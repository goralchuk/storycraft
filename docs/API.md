# API Reference

Base URL: `http://localhost:3001` (development)

All protected endpoints require a Bearer JWT in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

---

## Authentication

### `POST /auth/stub-login`
Returns a JWT for the hardcoded stub user. Development only.

**Response `200`**
```json
{
  "access_token": "<jwt>",
  "user": {
    "id": "stub-user-id",
    "email": "test@storycraft.local",
    "name": "Test User"
  }
}
```

---

### `GET /auth/google`
Redirects the browser to Google OAuth consent screen.

---

### `GET /auth/google/callback`
OAuth callback. Passport validates the Google token, then redirects to:
```
<FRONTEND_URL>/auth/callback?token=<jwt>
```

---

### `POST /auth/google/token`
Called server-side by NextAuth after Google OAuth completes on the frontend.

**Body**
```json
{
  "googleId": "string",
  "email": "string",
  "name": "string"
}
```

**Response `200`**
```json
{ "access_token": "<jwt>" }
```

---

### `GET /auth/me` 🔒
Returns the JWT payload of the currently authenticated user.

**Response `200`**
```json
{
  "sub": "string",
  "email": "string"
}
```

---

## Users

All endpoints require authentication.

### `GET /users/me` 🔒
Returns the full profile of the current user.

**Response `200`**
```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "avatarUrl": "string | null"
}
```

---

### `PATCH /users/me` 🔒
Updates the current user's profile.

**Body** _(all fields optional)_
```json
{
  "name": "string",
  "avatarUrl": "string"
}
```

**Response `200`** — updated user object.

---

## Children

All endpoints require authentication. Each child belongs to the authenticated user.

### `GET /children` 🔒
Returns all children for the current user.

**Response `200`**
```json
[
  {
    "id": "string",
    "name": "string",
    "birthDate": "string | null",
    "gender": "string | null",
    "interests": ["string"]
  }
]
```

---

### `POST /children` 🔒
Creates a new child profile.

**Body**
```json
{
  "name": "string",
  "birthDate": "string (ISO 8601, optional)",
  "gender": "string (optional)",
  "interests": ["string"] 
}
```

**Response `201`** — created child object.

---

### `PATCH /children/:id` 🔒
Updates a child profile owned by the current user.

**Body** _(all fields optional)_
```json
{
  "name": "string",
  "birthDate": "string (ISO 8601)",
  "gender": "string",
  "interests": ["string"]
}
```

**Response `200`** — updated child object.

---

### `DELETE /children/:id` 🔒
Deletes a child profile owned by the current user.

**Response `204`** — no content.

**Response `409`** — child has associated books and cannot be deleted.

---

## Templates

All endpoints require authentication.

### `GET /templates` 🔒
Returns all available story templates.

**Response `200`**
```json
[
  {
    "id": "string",
    "title": "string",
    "description": "string"
  }
]
```

---

### `GET /templates/:id` 🔒
Returns a single template by ID.

**Response `200`** — template object.

**Response `404`** — template not found.

---

## Books

All endpoints require authentication. Each book belongs to the authenticated user.

### `GET /books` 🔒
Returns all books for the current user.

**Response `200`**
```json
[
  {
    "id": "string",
    "templateId": "string",
    "childId": "string",
    "createdAt": "string (ISO 8601)"
  }
]
```

---

### `GET /books/:id` 🔒
Returns a single book owned by the current user.

**Response `200`** — book object.

**Response `404`** — book not found or not owned by user.

---

### `POST /books` 🔒
Creates a new book from a template for a child.

**Body**
```json
{
  "templateId": "string",
  "childId": "string"
}
```

**Response `201`** — created book object.
