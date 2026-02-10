# JWT Format Specification

**Generated:** 2026-01-30  
**Source:** Java JwtUtil.java analysis  
**Purpose:** Ensure TypeScript JWT implementation is compatible with Java

---

## Overview

Both Java and TypeScript backends must produce and validate JWTs that are fully interchangeable. This document specifies the exact format required.

---

## Algorithm

- **Algorithm:** HS256 (HMAC-SHA256)
- **Header Type:** JWT

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

---

## Claims Structure

| Claim | Type | Description | Example |
|-------|------|-------------|---------|
| `sub` | string | User ID (UUID format) | `"550e8400-e29b-41d4-a716-446655440000"` |
| `tier` | string | User subscription tier | `"FREE"`, `"BASIC"`, `"PREMIUM"` |
| `iat` | number | Issued at (Unix timestamp) | `1706637600` |
| `exp` | number | Expiration (Unix timestamp) | `1706724000` |

### Example Payload

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "tier": "FREE",
  "iat": 1706637600,
  "exp": 1706724000
}
```

---

## Secret Key Requirements

### Minimum Requirements
- **Encoding:** UTF-8
- **Minimum Length:** 32 bytes (256 bits)
- **Algorithm:** HMAC-SHA256

### Java Implementation
```java
// From JwtUtil.java
private SecretKey getSigningKey() {
    return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
}
```

### TypeScript Implementation
```typescript
// Using jose library
function getSecretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}
```

### Environment Variable
```
JWT_SECRET=your-secret-key-that-is-at-least-32-bytes-long
```

---

## Token Lifetime

- **Default Expiration:** 24 hours (86400000 ms)
- **Configurable via:** `jwt.expiration-ms` (Java) / `JWT_EXPIRATION_MS` (TypeScript)

---

## Validation Rules

### Valid Token Requirements
1. Signature verifies with shared secret
2. Current time < `exp` claim
3. `sub` claim is present (UUID format)
4. `tier` claim is one of: `FREE`, `BASIC`, `PREMIUM`

### Error Handling

| Condition | Action |
|-----------|--------|
| Missing token | Return 401 Unauthorized |
| Malformed token | Return 401 Unauthorized |
| Invalid signature | Return 401 Unauthorized |
| Expired token | Return 401 Unauthorized |
| Missing `sub` | Return 401 Unauthorized |
| Invalid `tier` | Return 403 Forbidden |

**Note:** Unlike Java's current implementation, TypeScript must reject invalid tokens immediately. The Java filter is overly permissive in some cases.

---

## Library Compatibility

### Java
- **Library:** io.jsonwebtoken (jjwt) 0.12.3
- **Generation:** `Jwts.builder().subject().claim().issuedAt().expiration().signWith().compact()`
- **Validation:** `Jwts.parser().verifyWith().build().parseSignedClaims()`

### TypeScript
- **Library:** jose (recommended for edge compatibility)
- **Generation:** `new SignJWT().setProtectedHeader().setSubject().setIssuedAt().setExpirationTime().sign()`
- **Validation:** `jwtVerify(token, secretKey)`

---

## Interoperability Test Results

### Test: TypeScript decodes Java JWT ✓
```typescript
// Java-generated token can be decoded with jose
const { payload } = await jwtVerify(javaToken, secretKey);
expect(payload.sub).toBe(userId);
expect(payload.tier).toBe(tier);
```

### Test: Java decodes TypeScript JWT ✓
```java
// TypeScript-generated token can be decoded with jjwt
String userId = Jwts.parser()
    .verifyWith(getSigningKey())
    .build()
    .parseSignedClaims(tsToken)
    .getPayload()
    .getSubject();
```

### Test: Cross-validation ✓
- Same secret produces same signatures
- Claims extracted identically
- Expiration checked consistently

---

## Security Considerations

1. **Secret Storage:** Never commit secrets to repository
2. **Secret Rotation:** Plan for key rotation without breaking existing tokens
3. **Token Storage:**
   - **Current:** Frontend stores in localStorage (as per current implementation)
   - **Security Risk:** localStorage is vulnerable to XSS attacks - any script running on the page can access tokens
   - **Recommendation:** Migrate to httpOnly cookies for production
   - **Alternatives/Mitigations:**
     - Implement strict Content Security Policy (CSP)
     - Use `SameSite=Strict` cookie attribute
     - Consider short-lived access tokens with refresh token rotation
4. **HTTPS Only:** Tokens must only be transmitted over HTTPS
5. **Minimal Claims:** Tokens contain only user ID (UUID) and tier
   - **Note:** While tokens exclude email and other direct identifiers, user IDs (UUIDs) are still identifiers and may be considered personal data under laws like GDPR/CCPA
   - Minimal claims reduce but do not eliminate privacy risk
   - Consult legal/privacy team for project-specific PII definition and handling guidance

---

## Migration Notes

### Before Migration
- Ensure same secret is configured in both backends
- Test token validation with real Java-issued tokens
- Verify tier claim values match exactly

### During Migration (Canary)
- Both backends share same secret
- Tokens issued by either can be validated by either
- Monitor for 401 errors during gradual traffic shift

### After Migration
- Consider rotating secret once Java backend is decommissioned
- Update expiration policy if needed
