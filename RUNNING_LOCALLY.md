# Running The Divination Engine Locally

## Prerequisites

- **Node.js** ≥ 18.17
- **pnpm** (install: `npm i -g pnpm`)
- A **Supabase** project (free tier is fine) — [supabase.com/dashboard](https://supabase.com/dashboard)

## Port Map

| Service | Port | URL |
|---------|------|-----|
| Frontend (Vite) | 3002 | http://localhost:3002 |
| Backend (Next.js) | 3000 | http://localhost:3000 |

The frontend dev server proxies all `/api` requests to the backend automatically.

---

## Quick Start (with Supabase)

### 0. Both at once (from repo root)

Once both projects are installed and configured (see steps 1–2 below for first-time setup):

```bash
pnpm dev          # starts backend (:3000) + frontend (:3002) in one terminal
```

Other root-level shortcuts:

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start both backend and frontend |
| `pnpm dev:api` | Start backend only |
| `pnpm dev:app` | Start frontend only |
| `pnpm install:all` | Install deps in both projects |

### 1. Backend (`divination_api/`)

```bash
cd divination_api
pnpm install

# Create your local env file
cp .env.local.example .env.local
```

Edit `.env.local` — fill in your **Supabase credentials**:

- `DATABASE_URL` and `DIRECT_URL` — get from **Supabase Dashboard → Project Settings → Database**
- `JWT_SECRET` — generate one: `openssl rand -base64 32`

**Optional: Polar Monetization**

If you want to test subscription webhooks, add Polar credentials to `.env.local`:

- `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, `POLAR_ORGANIZATION_ID` — get from [Polar Dashboard](https://polar.sh/dashboard)
- `POLAR_PRODUCT_ID_BASIC`, `POLAR_PRODUCT_ID_PREMIUM` — your product IDs for tier mapping

Without these, the app runs normally but subscription webhooks won't work.

Then push the schema and start the server:

```bash
pnpm db:generate        # Generate Prisma client
pnpm db:push            # Sync schema to Supabase
pnpm dev                # Start backend on :3000
```

Verify the database connection (optional):

```bash
pnpm db:test
```

### 2. Frontend (`divination_engine/`)

```bash
cd divination_engine
pnpm install
pnpm dev                # Start frontend on :3002
```

Open http://localhost:3002 — you're up and running.

#### Optional: Supabase Auth in the Frontend

If you want login/signup to work, create a `.env` in `divination_engine/`:

```bash
cp .env.example .env
```

Uncomment and fill in:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Get these from **Supabase Dashboard → Project Settings → API**.

Without these, the app still runs — auth features are disabled gracefully in dev mode.

---

## Without Supabase (local-only)

You can run the frontend standalone (for UI work) without any backend:

```bash
cd divination_engine
pnpm install
pnpm dev
```

API calls will fail (no backend), but the UI renders.

To run the full stack without Supabase, you'd need a local PostgreSQL instance. Point `DATABASE_URL` and `DIRECT_URL` at it:

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/divination"
DIRECT_URL="postgresql://postgres:password@localhost:5432/divination"
```

Then seed the `cards` table with the 78 tarot cards (the schema is in `prisma/schema.prisma`).

---

## Useful Commands

| Command | Directory | Description |
|---------|-----------|-------------|
| `pnpm dev` | `divination_api/` | Start backend dev server |
| `pnpm dev` | `divination_engine/` | Start frontend dev server |
| `pnpm db:generate` | `divination_api/` | Regenerate Prisma client |
| `pnpm db:push` | `divination_api/` | Push schema to database |
| `pnpm db:studio` | `divination_api/` | Open Prisma Studio (DB browser) |
| `pnpm db:test` | `divination_api/` | Test database connection |
| `pnpm test` | either | Run tests |

---

## Troubleshooting

### `Error: Environment variable not found: DIRECT_URL`
Your `.env.local` is missing or has placeholder values. Make sure both `DATABASE_URL` and `DIRECT_URL` contain real connection strings.

### Frontend shows loading / API errors
Make sure the backend is running on port 3000 (`pnpm dev` in `divination_api/`).

### `prisma db push` times out
Check that your Supabase project is active and your IP isn't blocked. Verify credentials in `.env.local`.
