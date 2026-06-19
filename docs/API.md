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

Books follow a **DRAFT lifecycle**: a book is paid for and created as `DRAFT` (`POST /books/draft`), configured (`PATCH /books/:id`), then submitted for generation (`POST /books/:id/submit`), after which it runs `PENDING → PROCESSING → DONE / FAILED`. Coins are charged once, at draft creation.

### `GET /books` 🔒
Returns the current user's books, **excluding drafts**.

**Response `200`**
```json
[
  {
    "id": "string",
    "bookType": "UNIQUE | TEMPLATE",
    "templateId": "string | null",
    "childId": "string | null",
    "status": "PENDING | PROCESSING | DONE | FAILED",
    "createdAt": "string (ISO 8601)"
  }
]
```

Poll `GET /books/:id` to track generation progress.

---

### `GET /books/draft` 🔒
Returns the current user's active `DRAFT` (with `template`, `child`, `topic`) for resuming, or `null` when there is none. Drives the dashboard "Continue draft" banner.

**Response `200`** — the draft object, or `null`.

---

### `GET /books/:id` 🔒
Returns a single book owned by the current user, including `pages` (with `illustrations`), `template`, `child`, and `topic`.

Stored object keys (the `pdfUrl`, uploaded `photoUrl`, and illustration `imageUrl` values) are resolved to **time-limited signed URLs** in the response; values that are already absolute URLs (external/stub images) are returned unchanged.

**Response `200`** — book object.

**Response `404`** — book not found or not owned by user.

---

### `POST /books/draft` 🔒
Pay for and create a `DRAFT` book. Debits the book-type cost (`BOOK_UNIQUE` 500 for `UNIQUE`, `BOOK_TEMPLATE` 300 for `TEMPLATE`) and logs a `CoinTransaction`. If the user already has a draft, that draft is returned **without** charging again.

**Body**
```json
{
  "bookType": "UNIQUE | TEMPLATE",
  "templateId": "string (optional, for TEMPLATE)"
}
```

**Response `201`** — the DRAFT book.

**Response `402`** — insufficient coins (no book created).

---

### `PATCH /books/:id` 🔒
Updates a `DRAFT` book's configuration. Never charges.

**Body** _(all fields optional)_
```json
{
  "childId": "string",
  "topicId": "string",
  "pageCount": "number",
  "promptText": "string",
  "writingStyle": "WATERCOLOR | ADVENTURE | FUNNY | GENTLE",
  "fear": "string",
  "photoUrl": "string"
}
```

**Response `200`** — updated draft.

**Response `404`** — book not found / child not owned by user.

**Response `409`** — book is not a draft.

---

### `POST /books/:id/submit` 🔒
Submits a configured `DRAFT` for generation: validates a child is set, transitions `DRAFT → PENDING`, and enqueues generation. Never re-charges. When the book has no `photoUrl`, it inherits the child's.

**Response `200`** — the book, now `PENDING`.

**Response `400`** — no child selected.

**Response `404`** — book not found.

**Response `409`** — book is not a draft.

---

## Heroes

Child-owned characters: one non-removable `MAIN` hero plus up to 4 companions (`PET | SIBLING | FRIEND | MAGIC`), **max 5 per child**. Reusable across books. Avatar generation is metered: **3 free** per hero, then `HERO_TOPUP` (100🪙) buys 3 more; adding a companion costs `COMPANION` (100🪙). A hero's free attempts reset to 3 when a book for its child reaches `DONE`.

### `GET /children/:childId/heroes` 🔒
Lists the child's heroes, ensuring a `MAIN` hero exists (created free if absent). Each hero's `imageKey` is returned as a signed `imageUrl`.

**Response `200`**
```json
[
  {
    "id": "string",
    "role": "MAIN | PET | SIBLING | FRIEND | MAGIC",
    "name": "string",
    "freeAttempts": 3,
    "status": "IDLE | GENERATING | DONE",
    "imageUrl": "string | null"
  }
]
```

---

### `POST /children/:childId/heroes` 🔒
Adds a companion. Debits `COMPANION` (100🪙).

**Body** — `{ "role": "PET | SIBLING | FRIEND | MAGIC", "name": "string" }`

**Response `201`** — created hero.

**Response `400`** — role is `MAIN`. · **`402`** — insufficient coins. · **`409`** — 5-hero limit reached.

---

### `DELETE /heroes/:id` 🔒
Removes a companion. **Response `204`**. **`409`** — cannot delete the `MAIN` hero.

---

### `POST /heroes/:id/generate` 🔒
Generates the hero's avatar (style + description prompt), stores it, and consumes one free attempt.

**Body** _(optional)_ — `{ "style": "string", "description": "string" }`

**Response `200`** — updated hero (with `imageUrl`).

**Response `402`** — no free generations left (top up first); nothing is generated.

---

### `POST /heroes/:id/topup` 🔒
Debits `HERO_TOPUP` (100🪙) and adds 3 free generations.

**Response `200`** — updated hero. · **`402`** — insufficient coins.

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

Application-wide AI model configuration (singleton). **Admin only** — requires an authenticated user whose `role` is `ADMIN` (enforced by `RolesGuard`). Non-admins receive `403`.

### `GET /settings` 🔒 👑
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

### `PATCH /settings` 🔒 👑
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

**Response `403`** — caller is not an admin.

---

## Pricing

Coin price catalog (`PriceItem`). Amounts are the single source of truth for coin costs (books, page tiers, hero generations) and coin packages. The read endpoint is cached in Redis; admin updates invalidate the cache.

🔒 = requires authentication · 👑 = requires `ADMIN` role.

### `GET /pricing` 🔒
Returns the active price catalog, served from cache (populated from the DB on a miss).

**Response `200`**
```json
[
  {
    "key": "BOOK_UNIQUE",
    "label": "Unique book",
    "category": "BOOK | PAGE | HERO | PACK",
    "amount": 500,
    "active": true
  }
]
```

Seeded keys: `BOOK_UNIQUE` (500), `BOOK_TEMPLATE` (300), `PAGE_16` (150), `PAGE_20` (300), `PAGE_24` (450), `HERO_TOPUP` (100), `COMPANION` (100), and coin packages `PACK_300`, `PACK_800`, `PACK_2000`, `PACK_5000`.

---

### `PATCH /pricing/:key` 🔒 👑
Updates a price item's `amount` and invalidates the pricing cache.

**Body**
```json
{ "amount": 600 }
```

**Response `200`** — updated price item.

**Response `403`** — caller is not an admin.

**Response `404`** — no price item with that key.
