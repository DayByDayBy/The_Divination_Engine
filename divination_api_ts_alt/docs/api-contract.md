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
| Rate Limit | 60/min/user |
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

**Notes:**
- Java hardcodes `/reading/3` and `/reading/10` - TypeScript accepts any count
- **DO NOT use `ORDER BY random()`** - use application-layer shuffling
- No duplicate cards in response
- Handle edge cases: count > 78, count <= 0

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

**Notes:**
- Returns only readings belonging to the authenticated user (filter by userId from JWT)

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

**Response (200):**
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
- Password hashed with BCrypt (10+ rounds)
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

**Response (429):** Rate limit exceeded

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

| Endpoint | Limit | Scope |
|----------|-------|-------|
| `/auth/login` | 5/min | IP |
| `/auth/register` | 3/min | IP |
| `/reading/*` | 60/min | User |
| `/tarot/interpret` | 10/min (tier-dependent) | User |

Rate limit responses return HTTP 429 with `Retry-After` header.
