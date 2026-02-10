# Database Setup Guide

This guide explains how to configure the database connection for the Divination Engine API.

## Prerequisites

- A Supabase project (created in P0-003)
- Database credentials from Supabase dashboard

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection with pooling | `postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Direct connection for migrations | `postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres` |
| `JWT_SECRET` | 256-bit secret for JWT tokens | `your-256-bit-secret-here` (replace with generated secret) |

**Note:** Generate a true 256-bit (32-byte) secret using a secure RNG: `openssl rand -base64 32`
| `NEXT_PUBLIC_URL` | Application URL | `http://localhost:3000` |

### Optional Variables (Future Use)

| Variable | Description |
|----------|-------------|
| `POLAR_ACCESS_TOKEN` | Polar SDK access token |
| `POLAR_WEBHOOK_SECRET` | Polar webhook secret |
| `POLAR_ORGANIZATION_ID` | Polar organization ID |

## Connection Pooling for Cloudflare

This project uses connection pooling to ensure compatibility with Cloudflare Workers:

- `DATABASE_URL` uses PgBouncer with `connection_limit=1`
- `DIRECT_URL` bypasses pooling for migrations
- Prisma Client automatically uses the appropriate connection

## Testing the Connection

After configuring your environment variables:

```bash
# Test database connection
npm run db:test

# Or with pnpm
pnpm db:test
```

## Common Issues

### Connection Timeout

If you get connection timeouts, verify:
- Your IP is allowed in Supabase settings
- The database password is correct
- The project reference is correct

### Migration Errors

Always use `DIRECT_URL` for schema operations:
- `prisma db push` uses direct connection
- `prisma migrate dev` uses direct connection
- Regular queries use pooled connection

## Next Steps

- Run `npm run db:test` to verify connection
- Proceed to [P1-003: Environment & Secrets Configuration](../tickets.md#p1-003)
