# Phase 1 — Foundation

## Overview

Established the full local development environment: NestJS backend, Next.js frontend, and supporting infrastructure (PostgreSQL, Redis, MinIO) via Docker Compose.

---

## Project Structure Created

```
storycraft/
├── docker-compose.yml          # PostgreSQL (5433), Redis (6379), MinIO (9000/9001)
├── .gitignore                  # Ignores node_modules, .env, dist, .next, build outputs
├── CLAUDE.md                   # Development rules
├── ROADMAP.md                  # Phase-by-phase development plan
├── DRAFT.md                    # Original project description
├── docs/
│   └── phase-1-foundation.md  # This file
├── backend/
│   ├── Dockerfile              # (to be written in a later phase)
│   ├── .env                    # Local only — gitignored, copy from .env.example
│   ├── .env.example            # Committed — all keys, no real values
│   ├── prisma.config.ts        # Prisma 7 config: schema path + datasource URL
│   ├── prisma/
│   │   └── schema.prisma       # PostgreSQL datasource + prisma-client-js generator
│   ├── nest-cli.json
│   ├── tsconfig.json
│   └── src/
│       ├── main.ts
│       ├── app.module.ts       # ConfigModule + BullModule + PrismaModule
│       ├── app.controller.ts
│       ├── app.service.ts
│       ├── config/
│       │   ├── env.schema.ts   # Zod schema, Env type, validate() function
│       │   └── config.service.ts # Typed AppConfigService wrapper
│       └── prisma/
│           ├── prisma.module.ts  # @Global module, exports PrismaService
│           └── prisma.service.ts # PrismaClient via @prisma/adapter-pg
└── frontend/
    ├── next.config.ts          # output: "standalone"
    ├── tsconfig.json
    └── src/
        └── app/                # Next.js App Router
```

---

## Backend (`backend/`)

### Stack
- **NestJS** `v10` — framework
- **Prisma** `v7.8.0` — ORM
- **@nestjs/bullmq** + **bullmq** — job queues
- **@nestjs/config** — environment config
- **Zod** — env validation
- **pg** + **@prisma/adapter-pg** — PostgreSQL driver (Prisma 7 requirement)
- **dotenv** — `.env` loading for Prisma CLI commands

### Config Module

`src/config/env.schema.ts` defines all required environment variables with Zod:

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `DATABASE_URL` | `string (url)` | — | PostgreSQL connection string |
| `REDIS_HOST` | `string` | — | Redis hostname |
| `REDIS_PORT` | `number` | `6379` | Redis port |
| `MINIO_ENDPOINT` | `string (url)` | — | MinIO endpoint |
| `MINIO_ACCESS_KEY` | `string` | — | MinIO access key |
| `MINIO_SECRET_KEY` | `string` | — | MinIO secret key |
| `MINIO_BUCKET` | `string` | — | MinIO bucket name |
| `PORT` | `number` | `3000` | HTTP server port |

Validation runs at boot via `ConfigModule.forRoot({ validate })`. If any required variable is missing or malformed, the process exits with a field-level error message.

`src/config/config.service.ts` wraps NestJS `ConfigService` with full TypeScript inference — `config.get('REDIS_PORT')` returns `number`, not `string | undefined`.

### Prisma Module

`PrismaModule` is decorated `@Global()` — imported once in `AppModule`, available everywhere without re-importing.

`PrismaService` extends `PrismaClient` and connects/disconnects on NestJS lifecycle hooks (`onModuleInit` / `onModuleDestroy`).

### App Module wiring

```
AppModule
├── ConfigModule (global, Zod validation)
├── BullModule (BullMQ, Redis connection from AppConfigService)
└── PrismaModule (global)
```

---

## Prisma 7 — Breaking Changes & Decisions

Prisma 7 removed built-in connection management. Key differences from Prisma 5/6:

### 1. No `url` in `schema.prisma`
The datasource block no longer accepts `url`:
```prisma
# Prisma 7 — correct
datasource db {
  provider = "postgresql"
}
```
The URL is configured in `prisma.config.ts` instead:
```ts
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: { url: env('DATABASE_URL') },
});
```

### 2. Driver adapter required at runtime
`PrismaClient` no longer manages its own connection pool. A driver adapter must be passed:
```ts
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
super({ adapter: new PrismaPg(pool) });
```
Packages required: `@prisma/adapter-pg`, `pg`, `@types/pg`.

### 3. Prisma CLI does not auto-load `.env`
Unlike Prisma 5/6, the CLI does not read `.env` automatically.
Fix: add `import 'dotenv/config'` at the top of `prisma.config.ts`.

### 4. Running Prisma CLI
```bash
# From backend/
node_modules/.bin/prisma generate
node_modules/.bin/prisma migrate dev --name <migration-name>
```

---

## Infrastructure (`docker-compose.yml`)

| Service | Image | Host Port | Purpose |
|---------|-------|-----------|---------|
| `postgres` | `postgres:16-alpine` | `5433` | Primary database (container port 5432) |
| `redis` | `redis:7-alpine` | `6379` | BullMQ queues + caching |
| `minio` | `minio/minio:latest` | `9000` (API), `9001` (Console) | S3-compatible object storage |

PostgreSQL is mapped to host port **5433** (not the standard 5432) to avoid conflicts with any locally installed PostgreSQL instance.

MinIO credentials (local only): user `storycraft`, password `storycraft`.

### Start all services
```bash
docker compose up -d
```

---

## Frontend (`frontend/`)

- **Next.js** `v16.2.6` with App Router (`src/app/`)
- `output: "standalone"` in `next.config.ts` — produces a self-contained build for Docker deployment

---

## Local Setup (first time)

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Copy env file
cp backend/.env.example backend/.env
# Edit backend/.env if your local ports differ

# 3. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 4. Generate Prisma client
cd ../backend && node_modules/.bin/prisma generate

# 5. Run backend
npm run start:dev

# 6. Run frontend (separate terminal)
cd ../frontend && npm run dev
```

---

## Verification Checklist

| Check | Command | Expected |
|-------|---------|----------|
| Backend compiles | `cd backend && npm run build` | Exit 0, no TS errors |
| Frontend compiles | `cd frontend && npm run build` | Exit 0, routes listed |
| Prisma generates | `cd backend && node_modules/.bin/prisma generate` | "Generated Prisma Client" |
| Docker services up | `docker compose up -d` | All containers healthy |
