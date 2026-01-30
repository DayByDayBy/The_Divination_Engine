# Polar SDK Proof-of-Concept

**Purpose:** Validate Polar integration patterns before implementing in main application.

---

## Overview

This POC demonstrates:
1. ✅ Checkout flow creation
2. ✅ Webhook signature verification
3. ✅ Idempotent webhook processing
4. ✅ Tier mapping from Polar products

---

## Quick Start

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your Polar sandbox credentials

# Run the POC server
npm run dev
```

---

## Environment Variables

```env
POLAR_ACCESS_TOKEN=your_sandbox_access_token
POLAR_WEBHOOK_SECRET=your_webhook_secret
POLAR_ORGANIZATION_ID=your_org_id
DATABASE_URL=postgresql://...
```

---

## Tier Mapping

| Polar Product | App Tier | Features |
|---------------|----------|----------|
| Free (default) | FREE | 3 readings/week, basic interpretation |
| Basic Subscription | BASIC | 20 readings/day, enhanced interpretation |
| Premium Subscription | PREMIUM | Unlimited readings, priority interpretation |

---

## Webhook Events

### Subscription Events

| Event | Action |
|-------|--------|
| `subscription.created` | Create/update user tier |
| `subscription.updated` | Update user tier |
| `subscription.canceled` | Downgrade to FREE |
| `subscription.revoked` | Downgrade to FREE |

### Checkout Events

| Event | Action |
|-------|--------|
| `checkout.created` | Log for analytics |
| `checkout.updated` | Update checkout status |

---

## Files

- `webhook-handler.ts` - Idempotent webhook processing
- `checkout.ts` - Checkout flow creation
- `tier-mapping.ts` - Product to tier mapping
- `signature.ts` - Webhook signature verification

---

## Testing

```bash
# Run tests
npm test

# Test webhook locally with Polar CLI
polar webhooks listen --forward-to localhost:3000/api/webhook/polar
```

---

## Abort Conditions

If any of these fail, abort the migration:

1. ❌ Cannot verify webhook signatures
2. ❌ Cannot process webhooks idempotently
3. ❌ Cannot create checkout sessions
4. ❌ Cannot map products to tiers

**Current Status: All conditions PASSED ✅**
