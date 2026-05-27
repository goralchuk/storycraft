# Phase 4 — Onboarding & Dashboard

## Overview

Wired the frontend to the domain APIs. New users are guided through a two-step onboarding flow; returning users land directly on a live dashboard. Session now holds the real database UUID and the user's name. All protected routes enforce authentication.

---

## Project Structure Added

```
frontend/src/
├── lib/
│   └── api.ts                        # Server-side fetch helper (Bearer token from session)
├── app/
│   ├── onboarding/
│   │   └── page.tsx                  # Step 1: name · Step 2: first child · Skip
│   ├── books/
│   │   └── new/
│   │       └── page.tsx              # Template + child picker → POST /books
│   ├── actions/
│   │   ├── onboarding.ts             # updateNameAction, addChildAction, skipChildAction
│   │   └── books.ts                  # createBookAction
│   └── dashboard/
│       └── page.tsx                  # Replaced stub — book list or "Create first book" CTA
├── auth.ts                           # Both providers now call GET /users/me
└── proxy.ts                          # /onboarding and /books added to protected paths
```

---

## 4.1 — Session Fix

`GET /auth/me` (returns JWT payload) replaced by `GET /users/me` (returns full DB record) in both Credentials providers. Effect:

- `session.user.id` is now a cuid (`cmpn…`), not a Google numeric ID
- `session.user.name` is populated from the DB (`null` for new users)
- The DB `User` row is upserted on every login — no lazy creation needed elsewhere

Both `backend-callback` (Google OAuth) and `stub` (dev) providers share the same `fetchDbUser` helper.

---

## 4.2 — Route Guard

`frontend/src/proxy.ts` expanded to protect three path prefixes:

| Path prefix | Unauthenticated | Authenticated |
|---|---|---|
| `/dashboard` | → `/login` | renders |
| `/onboarding` | → `/login` | renders |
| `/books` | → `/login` | renders |
| `/login` | renders | → `/dashboard` |

---

## 4.3 — Onboarding (`/onboarding`)

Two-step server-component page driven by `?step=` search param and server actions.

### Step 1 — Name
- Renders if `?step` is absent or not `2`
- Calls `GET /users/me` to check: if `name` is already set → redirect to `/dashboard`
- Form → `updateNameAction` → `PATCH /users/me { name }` → redirect to `/onboarding?step=2`

### Step 2 — First child
- Always renders when `?step=2` (no DB check, user just completed step 1)
- Fields: name (required), birth date, gender, interests (comma-separated)
- "Let's go!" → `addChildAction` → `POST /children { … }` → redirect to `/dashboard`
- "Skip for now" → `skipChildAction` → redirect to `/dashboard`

---

## 4.4 — API Helper (`lib/api.ts`)

```ts
apiFetch(path, init?)
```

Reads `session.accessToken` via `auth()` and attaches it as `Authorization: Bearer <token>` on every request to `BACKEND_URL`. Used by all server components and server actions that call the backend.

---

## 4.5 — Dashboard (`/dashboard`)

Replaces the placeholder stub. On every load:

1. Calls `GET /users/me` — if `name` is null → redirect to `/onboarding`
2. Calls `GET /books` — two render states:

**State A — no books**
- "You haven't created any books yet."
- Large "Create your first book" button → `/books/new`

**State B — has books**
- Table: template title · child name · status badge · created date
- "+ New book" button → `/books/new`

---

## 4.6 — Book Creation (`/books/new`)

Server component. On load:
- Fetches `GET /templates` and `GET /children` in parallel
- If no children → redirect to `/onboarding?step=2`

Form:
- Template `<select>` (populated from active templates)
- Child `<select>` (populated from user's children)
- Submit → `createBookAction` → `POST /books { templateId, childId }` → redirect to `/dashboard`
- Cancel link → `/dashboard`

New book appears in the list with status `PENDING`.

---

## User Journey

```
First login
  └─ /auth/callback?token=…
       └─ /dashboard → name is null → /onboarding
            ├─ Step 1: enter name → PATCH /users/me
            └─ Step 2: add child → POST /children (or skip)
                 └─ /dashboard (state A — no books)
                      └─ "Create your first book" → /books/new
                           └─ pick template + child → POST /books
                                └─ /dashboard (state B — book list, status: PENDING)

Subsequent logins
  └─ /auth/callback?token=… → /dashboard (state B)
```

---

## Verification Checklist

| Check | How | Expected |
|---|---|---|
| Unauthenticated guard | `GET /onboarding`, `/books/new`, `/dashboard` without session | `307 → /login` |
| Session user ID | Check `session.user.id` after login | cuid, not Google numeric ID |
| New user redirect | Login with fresh account (name null) | → `/onboarding` |
| Step 1 | Submit name form | Name saved; → `/onboarding?step=2` |
| Step 2 | Submit child form | Child created; → `/dashboard` (CTA state) |
| Skip step 2 | Click "Skip for now" | → `/dashboard` (CTA state, no child created) |
| Onboarding revisit | Visit `/onboarding` after name is set | → `/dashboard` |
| Create book | `/books/new` → submit | Book in list with `PENDING` status |
| No children guard | `/books/new` with no children | → `/onboarding?step=2` |
