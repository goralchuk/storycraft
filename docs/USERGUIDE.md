# User Guide

> Documents user-facing use cases in the current build.
> UI pages are marked **implemented**; backend-ready cases with no UI yet are marked **API only**.

---

## 1. Sign In

**Status:** Implemented (`/login`)

The app redirects any unauthenticated user to `/login` automatically.

### Sign in with Google
1. Open the app — the browser lands on `/login`.
2. Click **Sign in with Google**.
3. Complete the Google OAuth consent screen.
4. The app redirects to `/dashboard`.

### Sign in as test user (dev only)
Available when `STUB_AUTH=true` is set in `frontend/.env.local`.

1. Open `/login`.
2. Click **Sign in as test user (dev)**.
3. The app logs in as `test@storycraft.local` and redirects to `/dashboard`.

---

## 2. View Dashboard

**Status:** Implemented (`/dashboard`)

After signing in, the user sees:
- Their signed-in email address.
- A **Sign out** button.

> The dashboard is a stub. Future use cases (children, templates, books) will be surfaced here.

---

## 3. Sign Out

**Status:** Implemented (`/dashboard`)

1. On the dashboard, click **Sign out**.
2. The session is cleared and the browser redirects to `/login`.

---

## 4. View Profile

**Status:** API only — `GET /users/me`, `PATCH /users/me`

The backend can return and update the current user's `name` and `avatarUrl`.
No UI page exists yet.

---

## 5. Manage Children

**Status:** API only — `GET /children`, `POST /children`, `PATCH /children/:id`, `DELETE /children/:id`

The backend supports a full CRUD lifecycle for child profiles linked to the authenticated user.
Each child has a name, optional birth date, optional gender, and a list of interests.

> Deleting a child who has books returns `409 Conflict`.

No UI page exists yet.

---

## 6. Browse Templates

**Status:** API only — `GET /templates`, `GET /templates/:id`

The backend serves the list of available story templates. Templates are admin-seeded.
No UI page exists yet.

---

## 7. Create a Book

**Status:** API only — `POST /books`

The backend accepts a `templateId` and a `childId` and creates a book record.
No UI page exists yet.

---

## 8. View Books

**Status:** API only — `GET /books`, `GET /books/:id`

The backend returns all books owned by the current user, or a single book by ID.
No UI page exists yet.
