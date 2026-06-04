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
