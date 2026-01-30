# API Contract Specification

**Generated:** 2026-01-30  
**Source:** Java Spring Boot backend analysis  
**Purpose:** Authoritative contract for TypeScript migration

---

## Overview

This document defines the API contract that the TypeScript backend must implement to maintain frontend compatibility. The contract is derived from:

1. Frontend `src/services/api.ts` (authoritative client expectations)
2. Java backend controller implementations (reference behaviour)
3. Java model/DTO definitions (response structure)

---

## Base Configuration

- **API Base Path:** `/api`
- **Content-Type:** `application/json`
- **Authentication:** JWT Bearer token in `Authorization` header

---

## Endpoints

### Cards API

#### GET /api/cards
Returns all tarot cards in the deck.

| Property | Value |
|----------|-------|
| Auth | None |
| Rate Limit | None |

**Response (200):**
```json
[
  {
    "id": 1,
    "type": "MAJOR",
    "suit": null,
    "nameShort": "ar00",
    "name": "The Fool",
    "value": "0",
    "intValue": 0,
    "meaningUp": "Folly, mania, extravagance...",
    "meaningRev": "Negligence, absence, distribution...",
    "description": "With light step, as if earth..."
  }
]
```

**Notes:**
- Returns array of 78 cards
- Consider caching (cards are static data)

---

#### GET /api/cards/{id}
Returns a specific card by ID.

| Property | Value |
|----------|-------|
| Auth | None |
| Rate Limit | None |
| Path Param | `id` (number) |

**Response (200):**
```json
{
  "id": 1,
  "type": "MAJOR",
  "suit": null,
  "nameShort": "ar00",
  "name": "The Fool",
  "value": "0",
  "intValue": 0,
  "meaningUp": "...",
  "meaningRev": "...",
  "description": "..."
}
```

**Response (404):**
```json
{
  "timestamp": "2026-01-30T19:00:00.000Z",
  "status": 404,
  "error": "Not Found",
  "message": "Card not found with id : '999'",
  "path": "/api/cards/999"
}
```

---

### Reading API

#### GET /api/reading/{count}
Returns N random cards for a reading.

| Property | Value |
|----------|-------|
| Auth | Optional |
| Rate Limit (authenticated) | 60/min/user |
| Rate Limit (unauthenticated) | 60/min/IP |
| Path Param | `count` (number, 1-78) |

**Response (200):**
```json
[
  {
    "id": 22,
    "type": "MAJOR",
    "suit": null,
    "nameShort": "ar21",
    "name": "The World",
    "value": "21",
    "intValue": 21,
    "meaningUp": "...",
    "meaningRev": "...",
    "description": "..."
  }
]
```

**Validation:**
- `count` must be an integer between 1 and 78 inclusive
- Values ≤0 or >78 return 400 Bad Request

**Response (400):**
```json
{
  "timestamp": "2026-01-30T19:00:00.000Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Count must be between 1 and 78",
  "path": "/api/reading/5000"
}
```

**Notes:**
- Java hardcodes `/reading/3` and `/reading/10` - TypeScript accepts any count
- **DO NOT use `ORDER BY random()`** - use application-layer shuffling
- No duplicate cards in response

---

#### GET /api/reading/s
Returns all readings for the authenticated user.

| Property | Value |
|----------|-------|
| Auth | Required |
| Rate Limit | 60/min/user |

**Response (200):**
```json
[
  {
    "id": 1,
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "llmInterpretation": null,
    "createdAt": "2026-01-30T19:00:00",
    "cardReadings": [
      {
        "id": 1,
        "card": {
          "id": 1,
          "type": "MAJOR",
          "suit": null,
          "nameShort": "ar00",
          "name": "The Fool",
          "value": "0",
          "intValue": 0,
          "meaningUp": "...",
          "meaningRev": "...",
          "description": "..."
        },
        "position": 0,
        "reversed": false
      }
    ]
  }
]
```

**Response (401):**
```json
{
  "timestamp": "2026-01-30T19:00:00.000Z",
  "status": 401,
  "error": "Unauthorized",
  "message": "Full authentication is required to access this resource",
  "path": "/api/reading/s"
}
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 0 | Page number (0-indexed) |
| `size` | number | 20 | Items per page (max 100) |
| `sort` | string | "createdAt,desc" | Sort field and direction |

**Response (200) - Paginated:**
```json
{
  "content": [...],
  "page": 0,
  "size": 20,
  "totalElements": 42,
  "totalPages": 3
}
```

**Notes:**
- Returns only readings belonging to the authenticated user (filter by userId from JWT)
- Size is capped at 100; values >100 are reduced to 100

---

#### GET /api/reading/s/{id}
Returns a specific reading by ID.

| Property | Value |
|----------|-------|
| Auth | Required |
| Rate Limit | 60/min/user |
| Path Param | `id` (number) |

**Response (200):** Same structure as array element above

**Response (403):** Returned when user tries to access another user's reading
```json
{
  "timestamp": "2026-01-30T19:00:00.000Z",
  "status": 403,
  "error": "Forbidden",
  "message": "Access denied to reading",
  "path": "/api/reading/s/1"
}
```

**Response (404):** Reading not found

---

#### POST /api/reading/s
Creates a new reading.

| Property | Value |
|----------|-------|
| Auth | Required |
| Rate Limit | 60/min/user |

**Request Body:**
```json
{
  "cardReadings": [
    {
      "card": { "id": 1 },
      "position": 0,
      "reversed": false
    },
    {
      "card": { "id": 22 },
      "position": 1,
      "reversed": true
    }
  ]
}
```

**Validation Rules:**
- `cardReadings` is required, min 1, max 78 elements
- `cardReadings[].position` must be sequential integers starting at 0 (0, 1, 2, ...)
- `cardReadings[].card.id` must reference an existing card (1-78)
- Duplicate card IDs within the same reading are forbidden
- `cardReadings[].reversed` is a required boolean

**Response (201):**
```json
{
  "id": 42,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "llmInterpretation": null,
  "createdAt": "2026-01-30T19:00:00",
  "cardReadings": [...]
}
```

**Response (400) - Validation Error:**
```json
{
  "timestamp": "2026-01-30T19:00:00.000Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Duplicate card ID 22 in reading",
  "path": "/api/reading/s"
}
```

---

#### DELETE /api/reading/s/{id}
Deletes a reading.

| Property | Value |
|----------|-------|
| Auth | Required |
| Rate Limit | 60/min/user |
| Path Param | `id` (number) |

**Response (204):** No content

**Response (404):** Reading not found

**Notes:**
- Must verify ownership before deletion

---

### Auth API

#### POST /api/auth/register
Registers a new user.

| Property | Value |
|----------|-------|
| Auth | None |
| Rate Limit | 3/min/IP |

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Validation Rules:**
- Email must conform to RFC 5322 and be ≤255 characters
- Password must be minimum 8 characters with uppercase, lowercase, number, and special character

**Security:**
- Password hashed with BCrypt (cost factor 12)
- JWT expires 24 hours from issuance

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "email": "user@example.com",
  "tier": "FREE"
}
```

**Response (400):** `"User already exists"` or `"Invalid request"`

**Notes:**
- New users default to FREE tier
- Returns JWT immediately (auto-login)

---

#### POST /api/auth/login
Authenticates a user.

| Property | Value |
|----------|-------|
| Auth | None |
| Rate Limit | 5/min/IP |

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):** Same as register

**Response (401):** `"Invalid credentials"`

---

### Interpret API

#### POST /api/tarot/interpret
Generates LLM interpretation of a reading.

| Property | Value |
|----------|-------|
| Auth | Required |
| Rate Limit | 10/min/user (tier-dependent) |

**Request Body:**
```json
{
  "readingId": 1,
  "userInput": "What does this reading mean for my career?",
  "cards": [
    {
      "name": "The Fool",
      "reversed": false,
      "meaningUp": "New beginnings...",
      "meaningRev": "Recklessness...",
      "position": 0
    }
  ],
  "spreadType": "THREE_CARD",
  "userContext": "I'm considering a job change"
}
```

**Response (200):**
```json
{
  "readingId": 1,
  "interpretation": "Based on the cards drawn...",
  "timestamp": "2026-01-30T19:00:00.000Z",
  "spreadType": "THREE_CARD",
  "tier": "FREE"
}
```

**Validation & Constraints:**
- `readingId` is **optional**:
  - When provided: Server fetches cards from the stored reading and ignores the `cards` array
  - When omitted: Client must supply `cards` array for ad-hoc interpretation
- `cards` array:
  - Required when `readingId` is omitted
  - Ignored when `readingId` is provided (server uses stored reading data)
- `userInput` maximum length: 500 characters
- Request timeout: 30 seconds (LLM processing) → 504 Gateway Timeout on exceed

**Tier-Specific Rate Limits:**

| Tier | Limit |
|------|-------|
| FREE | 10/min |
| BASIC | 30/min |
| PREMIUM | 100/min |

**Response (429):** Rate limit exceeded

**Response (402) - Quota Exhausted (Paid Tiers):**
```json
{
  "timestamp": "2026-01-30T19:00:00.000Z",
  "status": 402,
  "error": "Payment Required",
  "message": "Monthly interpretation quota exhausted. Please upgrade or wait for quota reset.",
  "path": "/api/tarot/interpret"
}
```

**Response (504) - Timeout:**
```json
{
  "timestamp": "2026-01-30T19:00:00.000Z",
  "status": 504,
  "error": "Gateway Timeout",
  "message": "Interpretation request timed out",
  "path": "/api/tarot/interpret"
}
```

---

## JWT Format

| Claim | Type | Description |
|-------|------|-------------|
| `sub` | string (UUID) | User ID |
| `tier` | string | User tier: FREE, BASIC, PREMIUM |
| `iat` | number | Issued at (Unix timestamp) |
| `exp` | number | Expiration (Unix timestamp) |

**Algorithm:** HS256

**Example:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJ0aWVyIjoiRlJFRSIsImlhdCI6MTcwNjYzNzYwMCwiZXhwIjoxNzA2NzI0MDAwfQ.xxx
```

### Security Requirements

**Secret Key:**
- Minimum 256 bits (32 bytes) of cryptographically secure random data
- Store in environment variables or secrets manager (never in source code)
- Support key rotation via `kid` header with multiple active keys for zero-downtime rotation

**Token Expiration:**
- Default: 24 hours (configurable per tier)
- Refresh tokens: 7-30 days (separate from access tokens)

**Token Revocation:**
- Maintain deny-list of revoked token JTIs with TTL-based cleanup
- Prefer short-lived access tokens with refresh tokens for security

---

## Error Response Format

All errors follow this structure (matching Spring's default):

```json
{
  "timestamp": "2026-01-30T19:00:00.000Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/reading/s"
}
```

| Status | Error Name | Use Case |
|--------|------------|----------|
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Valid token, no permission |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected errors |

---

## Known Java Behaviours to Improve

1. **`ORDER BY random()`** - Inefficient for random selection. Use application-layer shuffling.
2. **Hardcoded endpoints** - `/reading/3` and `/reading/10` are inflexible. Accept any count.
3. **JWT filter permissive** - Invalid tokens sometimes pass through. Reject immediately.
4. **Global exception swallowing** - `catch (Exception.class)` loses debugging info. Use specific handlers.
5. **Reflection in tier resolution** - Security risk. Use explicit allowlist.

---

## Data Models

### Card
```typescript
interface Card {
  id: number;
  type: "MAJOR" | "MINOR";
  suit: string | null;
  nameShort: string;
  name: string;
  value: string;
  intValue: number;
  meaningUp: string;
  meaningRev: string;
  description: string;
}
```

### CardInReading
```typescript
interface CardInReading {
  id: number;
  card: Card;
  position: number;
  reversed: boolean;
}
```

### Reading
```typescript
interface Reading {
  id: number;
  userId: string; // UUID
  llmInterpretation: string | null;
  createdAt: string; // ISO 8601
  cardReadings: CardInReading[];
}
```

### AuthResponse
```typescript
interface AuthResponse {
  token: string;
  type: "Bearer";
  email: string;
  tier: "FREE" | "BASIC" | "PREMIUM";
}
```

### InterpretResponse
```typescript
interface InterpretResponse {
  readingId: number;
  interpretation: string;
  timestamp: string; // ISO 8601
  spreadType: string;
  tier: string;
}
```

---

## Rate Limiting

| Endpoint | Limit | Scope | Tracking |
|----------|-------|-------|----------|
| `/auth/login` | 5/min | IP | IP address |
| `/auth/register` | 3/min | IP | IP address |
| `/reading/*` | 60/min | User | JWT `sub` claim (fallback: IP) |
| `/tarot/interpret` | Tier-dependent | User | JWT `sub` claim (fallback: IP) |

**Interpret Endpoint Tier Limits:**

| Tier | Limit |
|------|-------|
| FREE | 10/min |
| BASIC | 30/min |
| PREMIUM | 100/min |

### Response Headers

All responses include:
- `X-RateLimit-Limit`: Maximum requests allowed in window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when the window resets

429 responses additionally include:
- `Retry-After`: Seconds until rate limit resets

### Example 429 Response

**Headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1706637660
Retry-After: 45
```

**Body:**
```json
{
  "timestamp": "2026-01-30T19:00:00.000Z",
  "status": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 45 seconds.",
  "path": "/api/tarot/interpret"
}
