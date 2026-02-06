# Cloudflare Rate Limiting Rules

This document defines Cloudflare rate limiting rules to match the API contract in `docs/api-contract.md`.

## Assumptions

- API base path is `/api`.
- Cloudflare rate limiting is the primary protection in production.
- The application-level rate limiting middleware (see `src/middleware/rate-limit.ts`) is used for local development and as a fallback.

## Rules

### 1) POST /api/auth/login

- **Limit:** 5 requests per 60 seconds
- **Scope:** per IP

**Suggested expression:**

- `http.request.uri.path eq "/api/auth/login" and http.request.method eq "POST"`

**Counting characteristic:**

- `ip.src`

### 2) POST /api/auth/register

- **Limit:** 3 requests per 60 seconds
- **Scope:** per IP

**Suggested expression:**

- `http.request.uri.path eq "/api/auth/register" and http.request.method eq "POST"`

**Counting characteristic:**

- `ip.src`

### 3) /api/reading/s (GET, POST)

- **Limit:** 60 requests per 60 seconds
- **Scope:** per user

**Suggested expression:**

- `starts_with(http.request.uri.path, "/api/reading/s")`

**Counting characteristic (recommended):**

- Use a stable authenticated identifier.
- If you have Cloudflare Advanced Rate Limiting available, configure the counting key using a header that uniquely identifies the user (for example, a gateway-injected user ID header).

**Fallback characteristic (if no per-user key available at the edge):**

- `ip.src`

### 4) POST /api/tarot/interpret

- **Limit:** 10 requests per 60 seconds
- **Scope:** per user

**Suggested expression:**

- `http.request.uri.path eq "/api/tarot/interpret" and http.request.method eq "POST"`

**Counting characteristic (recommended):**

- Same approach as `/api/reading/s`: count by an authenticated user identifier.

**Fallback characteristic:**

- `ip.src`

## Cloudflare Dashboard Steps (Manual)

1. Open Cloudflare Dashboard.
2. Select your site.
3. Go to **Security** -> **WAF** -> **Rate limiting rules**.
4. Create one rule per endpoint above.
5. Set the threshold and period (60 seconds).
6. Choose mitigation action (typically **Block** or **Managed Challenge**).
7. Save and deploy.

## Terraform (Example)

Cloudflare has multiple rate limiting configuration surfaces depending on your plan and whether you use legacy Rate Limiting or Rulesets. The snippet below is intentionally illustrative and may require provider/version adjustments.

```hcl
# Example only
resource "cloudflare_rate_limit" "auth_login" {
  zone_id = var.cloudflare_zone_id

  disabled = false

  description = "POST /api/auth/login - 5/min per IP"

  match {
    request {
      methods = ["POST"]
      url_pattern = "*/api/auth/login"
      schemes = ["HTTP", "HTTPS"]
    }
  }

  threshold = 5
  period    = 60

  action {
    mode    = "simulate" # change to "ban" or equivalent
    timeout = 60
  }
}
```
