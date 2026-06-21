# Running the Application

## Prerequisites

- Docker Desktop running
- Node.js installed
- `backend/.env` file present (copy from `backend/.env.example` and fill in secrets)

---

## Start

### 1. Infrastructure (PostgreSQL, Redis, MinIO)

```bash
docker compose up -d
```

Verify all three containers are healthy:

```bash
docker compose ps
```

### 2. Backend (NestJS — port 3001)

```bash
cd backend
npm run start:dev
```

Wait for: `Nest application successfully started`

### 3. Frontend (Next.js — port 3000)

```bash
cd frontend
npm run dev
```

Wait for: `✓ Ready in ...`

Open **http://localhost:3000**

---

## Stop

Stop backend and frontend with `Ctrl+C` in each terminal.

Stop infrastructure:

```bash
docker compose stop
```

To also remove containers (data is preserved in volumes):

```bash
docker compose down
```

---

## Ports

| Service    | Port |
|------------|------|
| Frontend   | 3000 |
| Backend    | 3001 |
| PostgreSQL | 5433 |
| Redis      | 6379 |
| MinIO API  | 9000 |
| MinIO UI   | 9001 |

---

## Integration tests (coin economy)

`backend/test/coin-economy.int-spec.ts` exercises the coin flow end-to-end against
the real dev database. It is **dev-only** — it lives under `test/` (excluded from
`nest build`) and runs only via the script below, never in production.

```bash
cd backend
npm run test:int
```

What it guarantees:

- **No token spend / no network** — text, image, PDF and storage are replaced with
  in-process stubs; the queue is disabled and the worker is invoked directly. AI
  providers and MinIO are not needed.
- **No database wipe** — it creates one throwaway user
  (`inttest-<timestamp>@storycraft.test`) and, in teardown, deletes **only** that
  user (cascading to its children, heroes, books, pages and transactions) and
  restores any price it changed. It never truncates or resets the database.
- **Requires** PostgreSQL + Redis up (`docker compose up -d`).

Coverage: starting balance, package purchase, book-type debit, companion / hero
top-up debits, page-tier surcharge, completion (hero-counter reset), failure refund
(incl. tier-12 no-refund and refund-once), and an admin price change taking effect.

> Other backend test scripts (also dev-only): `npm test` (unit `*.spec.ts`),
> `npm run test:e2e` (HTTP e2e).
