# Phase 3 — UsersModule, ChildrenModule, TemplatesModule, BooksModule

## Overview

Wired the four core domain modules to the database. All endpoints are protected with `JwtAuthGuard`. User records are created on first access via `connectOrCreate`, so the stub user and new Google sign-ins both work without a prior `User` row.

---

## Project Structure Added

```
backend/src/
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts    # GET /users/me, PATCH /users/me
│   └── users.service.ts       # upsert on GET, update on PATCH
├── children/
│   ├── children.module.ts
│   ├── children.controller.ts # GET/POST /children, PATCH/DELETE /children/:id
│   └── children.service.ts    # CRUD + ownership check + 409 on delete with books
├── templates/
│   ├── templates.module.ts
│   ├── templates.controller.ts # GET /templates, GET /templates/:id
│   └── templates.service.ts    # filters by isActive: true
└── books/
    ├── books.module.ts
    ├── books.controller.ts    # GET/POST /books, GET /books/:id
    └── books.service.ts       # list with template+child, detail with pages+illustrations
```

---

## 3.1 — UsersModule

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/users/me` | Returns (or creates) the current user's DB record |
| `PATCH` | `/users/me` | Updates `name` and/or `avatarUrl` |

### Notes

- `GET /users/me` uses `upsert` — creates the `User` row on first call if it doesn't exist.
- Ownership is by `email` from the JWT payload.

---

## 3.2 — ChildrenModule

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/children` | List all children for the current user |
| `POST` | `/children` | Create a child profile |
| `PATCH` | `/children/:id` | Update a child (owner check via relation filter) |
| `DELETE` | `/children/:id` | Delete a child; returns `409` if the child has books |

### Notes

- Ownership is enforced by filtering `where: { id, user: { email } }` — no child record is returned or mutated if it belongs to another user.
- `create` uses `connectOrCreate` on the `user` relation to handle stub users without a prior DB row.
- `DELETE` catches Prisma error `P2003` (foreign key constraint) and converts it to a `409 ConflictException`.

---

## 3.3 — TemplatesModule

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/templates` | List all active templates (ordered by `createdAt asc`) |
| `GET` | `/templates/:id` | Get a single active template; `404` if not found or inactive |

### Notes

- Templates are admin-seeded. The service filters `where: { isActive: true }` on both endpoints.

---

## 3.4 — BooksModule

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/books` | List all books for the current user (includes `template` + `child`) |
| `GET` | `/books/:id` | Get a single book with `template`, `child`, `pages`, and `illustrations` |
| `POST` | `/books` | Create a book from a template for a child owned by the current user |

### Notes

- `GET /books/:id` includes the full page tree: `pages` ordered by `pageNum`, each page with its `illustrations`.
- `POST /books` validates that the target child belongs to the current user before creating; returns `404` otherwise.
- Book creation uses `connectOrCreate` on the `user` relation (same reason as children).

---

## Verification Checklist

| Check | How | Expected |
|-------|-----|----------|
| Get current user | `GET /users/me` with JWT | User object (created if first call) |
| Update user | `PATCH /users/me` `{ "name": "Test" }` | Updated user object |
| List children | `GET /children` with JWT | Empty array `[]` initially |
| Create child | `POST /children` `{ "name": "Alice", "birthDate": "2020-01-01" }` | Child object with id |
| Update child | `PATCH /children/:id` `{ "name": "Alicia" }` | Updated child object |
| Delete child (no books) | `DELETE /children/:id` | `204 No Content` |
| Delete child (has books) | `DELETE /children/:id` after creating a book | `409 Conflict` |
| List templates | `GET /templates` | Array of active templates |
| Get template | `GET /templates/:id` | Template object |
| Get unknown template | `GET /templates/nonexistent` | `404 Not Found` |
| Create book | `POST /books` `{ "templateId": "...", "childId": "..." }` | Book object with template + child |
| List books | `GET /books` | Array with the created book |
| Get book detail | `GET /books/:id` | Book with pages and illustrations arrays |
