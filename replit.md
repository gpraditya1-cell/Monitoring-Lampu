# Monitoring-Lampu

Monitoring dashboard for lamps with Supabase auth and PostgreSQL backend.

## Run & Operate

### Prerequisites

- **Node.js 24** and **pnpm** installed
- **PostgreSQL** running locally (or a remote instance)
- **Supabase project** (for frontend authentication)

### Backend

```bash
# 1. Copy env template and set DATABASE_URL
cp .env.example .env.local
# Edit .env.local with your PostgreSQL connection string

# 2. Push schema (dev only)
pnpm --filter @workspace/db run push

# 3. Build and run
pnpm --filter @workspace/api-server run dev
# Server listens on PORT (default 5000)
```

### Frontend

```bash
# 1. Copy env template and set Supabase credentials
cp artifacts/mhl/.env.example artifacts/mhl/.env.local
# Edit artifacts/mhl/.env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# 2. Run dev server
pnpm --filter @workspace/mhl run dev
# Vite dev server listens on PORT (default 5176)
```

### Full build & typecheck

```bash
pnpm run typecheck   # full typecheck across all packages
pnpm run build       # typecheck + build all packages
```

### Required environment variables

- `DATABASE_URL` — Postgres connection string (backend)
- `PORT` — API server port (backend)
- `VITE_SUPABASE_URL` — Supabase project URL (frontend)
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key (frontend)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Build: esbuild (CJS bundle)
- Frontend: Vite + React + Tailwind

## Where things live

- `artifacts/api-server/` — Express backend
- `artifacts/mhl/` — Vite frontend (React)
- `lib/db/` — Drizzle ORM schema and DB client
- `artifacts/api-zod/` — Shared Zod schemas

## Architecture decisions

- Frontend and backend have separate `.env.local` files; Vite reads `artifacts/mhl/.env.local`, backend reads root `.env.local`
- `PORT` is required in both frontend and backend configs (no fallback)
- `BASE_PATH` required in Vite config for correct routing

## Gotchas

- Backend integration tests require `DATABASE_URL` to be set; if not available, tests will fail at import time
- Do not commit `.env.local` files — they are in `.gitignore`
