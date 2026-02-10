import { NextRequest } from 'next/server';
import { extractTokenFromHeader, verifyJwt, JwtPayload } from '@/lib/jwt';
import { AuthError } from '@/lib/errors';

export interface AuthContext {
  userId: string;
  tier: string;
}

/**
 * Extract and verify JWT from request headers
 * Returns user context if valid, throws AuthError if invalid/missing
 */
export async function requireAuth(request: NextRequest): Promise<AuthContext> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    throw new AuthError('Authentication required');
  }

  const token = extractTokenFromHeader(authHeader);
  
  if (!token) {
    throw new AuthError('Invalid authorization header format');
  }

  try {
    const payload = await verifyJwt(token);
    
    // Validate payload fields are present and correct type
    if (!payload.sub || typeof payload.sub !== 'string') {
      throw new AuthError('Invalid token: missing or invalid user ID');
    }
    
    if (!payload.tier || typeof payload.tier !== 'string') {
      throw new AuthError('Invalid token: missing or invalid tier');
    }
    
    return {
      userId: payload.sub,
      tier: payload.tier,
    };
  } catch (error) {
    // Re-throw AuthError as-is
    if (error instanceof AuthError) {
      throw error;
    }
    
    // Wrap any other error
    throw new AuthError('Token validation failed');
  }
}

/**
 * Optional auth - returns context if token present and valid, null otherwise
 * Does not throw errors for missing tokens
 */
export async function optionalAuth(request: NextRequest): Promise<AuthContext | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return null;
  }

  const token = extractTokenFromHeader(authHeader);
  
  if (!token) {
    return null;
  }

  try {
    const payload = await verifyJwt(token);
    
    // Validate payload fields are present and correct type
    if (!payload.sub || typeof payload.sub !== 'string') {
      return null;
    }
    
    if (!payload.tier || typeof payload.tier !== 'string') {
      return null;
    }
    
    return {
      userId: payload.sub,
      tier: payload.tier,
    };
  } catch (error) {
    // For optional auth, return null on any error
    return null;
  }
}
