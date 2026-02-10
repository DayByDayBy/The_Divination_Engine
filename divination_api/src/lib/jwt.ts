import { SignJWT, jwtVerify } from 'jose';
import { JwtClaims, UserTier } from '@/schemas';
import { AuthError } from './errors';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = '24h'; // 24 hours

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters (256 bits)');
}

const secret = new TextEncoder().encode(JWT_SECRET);

export interface JwtPayload {
  sub: string; // User ID (UUID)
  tier: UserTier;
  iat: number; // Issued at (Unix timestamp)
  exp: number; // Expires at (Unix timestamp)
}

/**
 * Generate a JWT token for a user
 */
export async function signJwt(userId: string, tier: UserTier): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 24 * 60 * 60; // 24 hours from now

  const token = await new SignJWT({
    sub: userId,
    tier,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(secret);

  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyJwt(token: string): Promise<JwtPayload> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    // Validate required claims
    if (!payload.sub || typeof payload.sub !== 'string') {
      throw new AuthError('Invalid token: missing or invalid sub claim');
    }

    if (!payload.tier || typeof payload.tier !== 'string') {
      throw new AuthError('Invalid token: missing or invalid tier claim');
    }

    if (!payload.iat || typeof payload.iat !== 'number') {
      throw new AuthError('Invalid token: missing or invalid iat claim');
    }

    if (!payload.exp || typeof payload.exp !== 'number') {
      throw new AuthError('Invalid token: missing or invalid exp claim');
    }

    // Validate tier is a valid value
    const validTiers: UserTier[] = ['FREE', 'BASIC', 'PREMIUM'];
    if (!validTiers.includes(payload.tier as UserTier)) {
      throw new AuthError('Invalid token: invalid tier value');
    }

    return {
      sub: payload.sub,
      tier: payload.tier as UserTier,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    // Handle jose-specific errors
    if (error && typeof error === 'object' && 'code' in error) {
      const joseError = error as { code: string; message: string };
      
      if (joseError.code === 'ERR_JWT_EXPIRED') {
        throw new AuthError('Token has expired');
      }
      
      if (joseError.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
        throw new AuthError('Invalid token signature');
      }
      
      if (joseError.code === 'ERR_JWT_INVALID') {
        throw new AuthError('Invalid token format');
      }
    }

    // Generic error for any other case
    throw new AuthError('Token validation failed');
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  // Check for "Bearer <token>" format
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}
