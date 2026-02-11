# Hosting The Divination Engine

Target stack: **Supabase** (database + auth) + **Cloudflare Pages** (frontend + backend).

---

## Architecture

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│   Frontend   │──────▶│   Backend API    │──────▶│   Supabase   │
│  (static)    │ /api  │  (Next.js SSR)   │ SQL   │  PostgreSQL  │
│  CF Pages    │       │  CF Pages / Node │       │              │
└──────────────┘       └──────────────────┘       └──────────────┘
```

- **Frontend**: Static Vite build, served from Cloudflare Pages (or any static host).
- **Backend**: Next.js with `output: 'standalone'` — deployable to Cloudflare Pages (Functions), Vercel, or any Node.js host.
- **Database**: Supabase PostgreSQL with connection pooling via PgBouncer.

---

## Frontend Deployment (Cloudflare Pages)

### Build Settings

| Setting | Value |
|---------|-------|
| Framework preset | None (Vite) |
| Build command | `pnpm build` |
| Build output directory | `dist` |
| Root directory | `divination_engine` |
| Node.js version | ≥ 18 |

### Environment Variables

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://api.yourdomain.com/api` (or your backend URL) |
| `VITE_SUPABASE_URL` | `https://YOUR_PROJECT_REF.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_ENABLE_USER_AUTH` | `true` |

---

## Backend Deployment (Cloudflare Pages Functions)

### Build Settings

| Setting | Value |
|---------|-------|
| Framework preset | Next.js |
| Build command | `pnpm build` |
| Root directory | `divination_api` |
| Node.js version | ≥ 18 |

### Environment Variables

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Pooled Supabase connection string (port 6543, `?pgbouncer=true&connection_limit=1`) |
| `DIRECT_URL` | Yes | Direct Supabase connection string (port 5432) |
| `JWT_SECRET` | Yes | `openssl rand -base64 32` — **different from dev** |
| `NEXT_PUBLIC_URL` | Yes | Your production URL |
| `POLAR_ACCESS_TOKEN` | No | For future monetisation |
| `POLAR_WEBHOOK_SECRET` | No | For future monetisation |
| `POLAR_ORGANIZATION_ID` | No | For future monetisation |

### Notes

- `next.config.js` already has `output: 'standalone'` set.
- Prisma requires **Node.js runtime** (not Edge). API routes that use the database must run in Node.js mode. This is already configured.
- For Cloudflare, ensure the [Next.js on Pages adapter](https://developers.cloudflare.com/pages/framework-guides/nextjs/) is set up if needed, or consider deploying the backend to **Vercel** or a **VPS** if Cloudflare's Node.js support is insufficient.

---

## Database (Supabase)

Already configured. Key points:

- **Connection pooling**: `DATABASE_URL` uses PgBouncer on port 6543 with `connection_limit=1` for serverless compatibility.
- **Direct connection**: `DIRECT_URL` on port 5432 is used only for `prisma db push` / `prisma migrate`.
- **Schema**: managed via `prisma/schema.prisma`. Run `pnpm db:push` to sync.

### Production Checklist

- [ ] Verify RLS (Row Level Security) policies if using Supabase auth directly
- [ ] Set up database backups (Supabase Pro plan, or manual pg_dump)
- [ ] Add index on `readings.user_id` if not present
- [ ] Rotate `JWT_SECRET` after initial deployment

---

## DNS / Domain Setup

If using a custom domain with Cloudflare:

1. Add domain to Cloudflare
2. Point frontend Pages project to `yourdomain.com`
3. Point backend Pages project to `api.yourdomain.com` (or use a path-based setup)
4. Update `VITE_API_URL` and `NEXT_PUBLIC_URL` accordingly

---

## Alternative Hosts

| Component | Alternatives |
|-----------|-------------|
| Frontend | Vercel, Netlify, any static host |
| Backend | Vercel (easiest for Next.js), Railway, Fly.io, AWS Lambda |
| Database | Keep on Supabase — it works well and is already configured |
