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
    "interests": ["string"],
    "photoUrl": "string | null"
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
  "interests": ["string"],
  "photoUrl": "string (optional)"
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
  "interests": ["string"],
  "photoUrl": "string"
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
Returns active story templates.

**Query parameters** _(both optional)_
| Param | Description |
|---|---|
| `category` | Filter by category. One of `FANTASY · ADVENTURE · NATURE · SCIENCE · FRIENDSHIP · ANIMALS` |
| `age` | Filter by exact `ageRange` string (e.g. `3–7`) |

**Response `200`**
```json
[
  {
    "id": "string",
    "title": "string",
    "description": "string | null",
    "icon": "string | null",
    "category": "TemplateCategory | null",
    "ageRange": "string | null",
    "availablePages": [12, 16, 20],
    "pageCount": 16,
    "defaultTone": "string | null",
    "badge": "string | null",
    "coverColor": "string | null",
    "coverUrl": "string | null",
    "tags": [{ "label": "string", "bg": "string", "color": "string" }]
  }
]
```

**Response `400`** — unknown `category` value.

---

### `GET /templates/:id` 🔒
Returns a single template by ID.

**Response `200`** — template object.

**Response `404`** — template not found.

---

## Topics

All endpoints require authentication. Topics are admin-seeded fear/life-moment themes with suggested prompts.

### `GET /topics` 🔒
Returns active topics.

**Response `200`**
```json
[
  {
    "id": "string",
    "icon": "string",
    "label": "string",
    "prompts": ["string"]
  }
]
```

---

### `GET /topics/:id` 🔒
Returns a single topic by ID.

**Response `200`** — topic object.

**Response `404`** — topic not found.

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
    "status": "PENDING | PROCESSING | DONE | FAILED",
    "createdAt": "string (ISO 8601)"
  }
]
```

`status` reflects the generation lifecycle: a book starts `PENDING` on creation, moves to `PROCESSING` when the worker picks it up, and ends `DONE` (with `pdfUrl` set) or `FAILED`. Poll `GET /books/:id` to track progress.

---

### `GET /books/:id` 🔒
Returns a single book owned by the current user, including `pages` (with `illustrations`), `template`, `child`, and `topic`.

Stored object keys (the `pdfUrl`, uploaded `photoUrl`, and illustration `imageUrl` values) are resolved to **time-limited signed URLs** in the response; values that are already absolute URLs (external/stub images) are returned unchanged.

**Response `200`** — book object.

**Response `404`** — book not found or not owned by user.

---

### `POST /books` 🔒
Creates a new book from a template for a child.

**Body**
```json
{
  "templateId": "string",
  "childId": "string",
  "topicId": "string (optional)",
  "pageCount": "number (optional, defaults to 10)",
  "promptText": "string (optional)",
  "writingStyle": "WATERCOLOR | ADVENTURE | FUNNY | GENTLE (optional)",
  "fear": "string (optional)",
  "photoUrl": "string (optional)"
}
```

When `photoUrl` is omitted, the book inherits the child's `photoUrl`.

**Response `201`** — created book object (includes `template`, `child`, `topic`).

**Response `404`** — child not found or not owned by user.

---

## Uploads

All endpoints require authentication.

### `POST /uploads/photo` 🔒
Uploads a child/book photo (binary) to object storage and returns a reference.

**Request** — `multipart/form-data` with a single `file` field. Must be an image (`image/*`); max **5 MB**.

**Response `201`**
```json
{
  "key": "photos/<uuid>.jpg",
  "url": "<signed URL>"
}
```
Store `key` as the child's or book's `photoUrl` (durable); `url` is a time-limited signed URL for immediate preview.

**Response `400`** — missing file or non-image content type.

---

## Settings

Application-wide AI model configuration (singleton). Requires authentication.

> Not yet restricted to admins — there is no role on `User` yet. Treat as admin-only.

### `GET /settings` 🔒
Returns the current AI model settings.

**Response `200`**
```json
{
  "id": "singleton",
  "textProvider": "string",
  "textModel": "string",
  "imageProvider": "string",
  "imageModel": "string",
  "updatedAt": "string (ISO 8601)"
}
```

---

### `PATCH /settings` 🔒
Updates AI model settings.

**Body** _(all fields optional)_
```json
{
  "textProvider": "string",
  "textModel": "string",
  "imageProvider": "string",
  "imageModel": "string"
}
```

**Response `200`** — updated settings object.
