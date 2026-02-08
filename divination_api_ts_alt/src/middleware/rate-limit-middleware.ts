import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter, RateLimitResult } from './rate-limit';
import { AuthContext } from './auth';

// Rate limit configurations per endpoint
const RATE_LIMIT_CONFIGS = {
  '/api/auth/login': { requestsPerMinute: 5, scope: 'ip' },
  '/api/auth/register': { requestsPerMinute: 3, scope: 'ip' },
  '/api/readings': { requestsPerMinute: 60, scope: 'user' },
  '/api/tarot/interpret': { 
    FREE: { requestsPerMinute: 10, scope: 'user' },
    BASIC: { requestsPerMinute: 30, scope: 'user' },
    PREMIUM: { requestsPerMinute: 100, scope: 'user' }
  }
} as const;

// Singleton rate limiters
const rateLimiters = new Map<string, RateLimiter>();

function getRateLimiter(endpoint: string, requestsPerMinute: number): RateLimiter {
  const key = `limiter_${endpoint}_${requestsPerMinute}`;
  if (!rateLimiters.has(key)) {
    rateLimiters.set(key, new RateLimiter({ requestsPerMinute }));
  }
  return rateLimiters.get(key)!;
}

function getClientKey(request: NextRequest, auth?: AuthContext, scope: 'ip' | 'user' = 'ip'): string {
  if (scope === 'user' && auth?.userId) {
    return `user:${auth.userId}`;
  }
  
  // Fallback to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  return `ip:${ip}`;
}

export interface RateLimitMiddlewareOptions {
  pathname: string;
  auth?: AuthContext;
}

export function applyRateLimit(
  request: NextRequest,
  options: RateLimitMiddlewareOptions
): { response?: NextResponse; headers: Record<string, string> } {
  const { pathname, auth } = options;
  const config = RATE_LIMIT_CONFIGS[pathname as keyof typeof RATE_LIMIT_CONFIGS];
  
  if (!config) {
    return { headers: {} };
  }

  // Handle tier-based rate limiting for interpret endpoint
  let requestsPerMinute: number;
  if (typeof config === 'object' && 'FREE' in config) {
    const tier = auth?.tier || 'FREE';
    requestsPerMinute = config[tier as keyof typeof config]?.requestsPerMinute || config.FREE.requestsPerMinute;
  } else {
    requestsPerMinute = config.requestsPerMinute;
  }

  const scope = typeof config === 'object' && 'FREE' in config ? config.FREE.scope : config.scope;
  const clientKey = getClientKey(request, auth, scope);
  const rateLimiter = getRateLimiter(pathname, requestsPerMinute);
  
  const result: RateLimitResult = rateLimiter.checkLimit(clientKey);
  
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': requestsPerMinute.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toString(),
  };

  if (!result.allowed) {
    const response = NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${result.retryAfterSeconds} seconds.`,
        path: request.nextUrl.pathname,
      },
      { status: 429 }
    );
    
    // Add rate limit headers to response
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    if (result.retryAfterSeconds) {
      response.headers.set('Retry-After', result.retryAfterSeconds.toString());
    }
    
    return { response, headers };
  }

  return { headers };
}
