# Environment & Secrets Configuration

## Overview

This document outlines all environment variables and secrets required for the TypeScript backend.

## Required Environment Variables

### Database Configuration

```bash
# Supabase PostgreSQL Connection String (with connection pooling for Cloudflare)
# Format: postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
DATABASE_URL="postgresql://postgres:your_password@db.your_project.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# Direct connection URL (for migrations and schema operations)
DIRECT_URL="postgresql://postgres:your_password@db.your_project.supabase.co:5432/postgres"
```

**How to get these:**
1. Go to your Supabase dashboard
2. Navigate to Project Settings > Database
3. Copy the connection string
4. For `DIRECT_URL`, remove the `?pgbouncer=true&connection_limit=1` parameters

### Next.js Configuration

```bash
# Public URL for the application
NEXT_PUBLIC_URL=http://localhost:3000  # Development
# NEXT_PUBLIC_URL=https://your-domain.com  # Production
```

### JWT Configuration

```bash
# JWT secret for token signing/validation
# Must be at least 256 bits (32 characters) for HS256
JWT_SECRET="your-256-bit-secret-here-change-in-production"
```

**Security Notes:**
- Use a cryptographically secure random string
- Minimum 32 characters recommended
- Different secrets for development and production
- Store securely in environment variables, not in code

### Polar SDK Configuration (for monetization)

```bash
# Polar access token (server-to-server)
POLAR_ACCESS_TOKEN="polar_at_sandbox_your_access_token_here"  # Sandbox
# POLAR_ACCESS_TOKEN="polar_at_your_access_token_here"  # Production

# Webhook secret for signature verification
POLAR_WEBHOOK_SECRET="whsec_your_webhook_secret_here"

# Polar organization ID
POLAR_ORGANIZATION_ID="org_your_organization_id_here"
```

**How to get these:**
1. Go to [Polar Dashboard](https://polar.sh/dashboard) or [Sandbox](https://sandbox.polar.sh/dashboard)
2. Navigate to Settings > API Keys
3. Create a new access token
4. Get your organization ID from Settings > General

## Local Development Setup

1. Copy the example file:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` with your actual values
3. Never commit `.env.local` to version control

## Production Deployment

### Cloudflare Pages

1. Go to your Cloudflare Pages dashboard
2. Navigate to Settings > Environment variables
3. Add all the above variables (except `NEXT_PUBLIC_URL` which is set automatically)
4. Enable preview environment variables for staging

### Other Platforms

Set environment variables according to your hosting provider's documentation.

## Security Best Practices

1. **Never commit secrets to git** - All secrets are listed in `.gitignore`
2. **Use different secrets per environment** - Development, staging, and production should have different secrets
3. **Rotate secrets regularly** - Especially JWT secrets
4. **Use principle of least privilege** - Only grant necessary permissions
5. **Monitor for secret leaks** - Use tools like GitGuardian or GitHub secret scanning

## Environment-Specific Notes

### Development
- Use `http://localhost:3000` for `NEXT_PUBLIC_URL`
- Use a strong, unique JWT secret per environment
- Use Polar sandbox environment

### Production
- Use HTTPS URL for `NEXT_PUBLIC_URL`
- Use strong, randomly generated, unique secrets
- Use Polar production environment

**Security Note:** Never reuse production secrets in development. Store secrets in environment variables or a secrets manager and ensure they can be rotated.
- Enable all security features

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` format
- Check if pgbouncer parameters are correct for serverless
- Ensure IP whitelist includes your deployment platform

### JWT Validation Errors
- Ensure `JWT_SECRET` is at least 32 characters
- Check if secret has special characters that need escaping
- Verify same secret is used across all instances

### Polar Webhook Failures
- Verify `POLAR_WEBHOOK_SECRET` matches dashboard
- Check if webhook URL is accessible
- Ensure signature verification code is working
