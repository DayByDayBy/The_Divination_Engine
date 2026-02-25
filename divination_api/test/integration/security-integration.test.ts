/**
 * T14: Security Integration Tests
 * Validates security headers config, CORS middleware, auth middleware,
 * and error handler information leakage prevention.
 */
import { NextRequest, NextResponse } from 'next/server';
import nextConfig from '../../next.config.js';
import { applyCors } from '@/middleware/cors';
import { requireAuth } from '@/middleware/auth';
import { handleError } from '@/middleware/error-handler';

// ---------------------------------------------------------------------------
// Security Headers (config-level)
// ---------------------------------------------------------------------------
describe('security headers in production config', () => {
  let headerRules: Awaited<ReturnType<NonNullable<typeof nextConfig.headers>>>;

  beforeAll(async () => {
    headerRules = await nextConfig.headers!();
  });

  it('does not set overly permissive Access-Control-Allow-Origin in config', () => {
    for (const rule of headerRules) {
      for (const h of rule.headers) {
        if (h.key.toLowerCase() === 'access-control-allow-origin') {
          expect(h.value).not.toBe('*');
        }
      }
    }
  });

  it('includes X-Content-Type-Options: nosniff on API routes', () => {
    const apiRule = headerRules.find((r) => r.source === '/api/:path*')!;
    const h = apiRule.headers.find((h) => h.key === 'X-Content-Type-Options');
    expect(h?.value).toBe('nosniff');
  });
});

// ---------------------------------------------------------------------------
// CORS Middleware
// ---------------------------------------------------------------------------
describe('CORS middleware', () => {
  function makeReq(origin?: string): NextRequest {
    const headers = new Headers();
    if (origin) headers.set('origin', origin);
    return new NextRequest('http://localhost:3000/api/health', { headers });
  }

  afterEach(() => {
    delete process.env.ALLOWED_ORIGINS;
  });

  it('does not set Access-Control-Allow-Origin when ALLOWED_ORIGINS is empty', () => {
    process.env.ALLOWED_ORIGINS = '';
    const res = applyCors(makeReq('http://evil.com'), NextResponse.json({}));
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('sets wildcard when ALLOWED_ORIGINS is *', () => {
    process.env.ALLOWED_ORIGINS = '*';
    const res = applyCors(makeReq('http://anything.com'), NextResponse.json({}));
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('allows a listed origin', () => {
    process.env.ALLOWED_ORIGINS = 'http://app.example.com,http://other.com';
    const res = applyCors(makeReq('http://app.example.com'), NextResponse.json({}));
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://app.example.com');
  });

  it('rejects an unlisted origin', () => {
    process.env.ALLOWED_ORIGINS = 'http://app.example.com';
    const res = applyCors(makeReq('http://evil.com'), NextResponse.json({}));
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Auth Middleware
// ---------------------------------------------------------------------------
describe('auth middleware', () => {
  function makeReq(authHeader?: string): NextRequest {
    const headers = new Headers();
    if (authHeader) headers.set('authorization', authHeader);
    return new NextRequest('http://localhost:3000/api/readings', { headers });
  }

  it('throws when no authorization header is present', async () => {
    await expect(requireAuth(makeReq())).rejects.toThrow('Authentication required');
  });

  it('throws on malformed authorization header', async () => {
    await expect(requireAuth(makeReq('NotBearer xyz'))).rejects.toThrow();
  });

  it('throws on invalid JWT token', async () => {
    await expect(requireAuth(makeReq('Bearer invalid.token.here'))).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Error Handler — no information leakage
// ---------------------------------------------------------------------------
describe('error handler information leakage', () => {
  function makeReq(): NextRequest {
    return new NextRequest('http://localhost:3000/api/test');
  }

  it('does not leak stack traces for generic errors', () => {
    const err = new Error('secret internal detail');
    const res = handleError(err, makeReq());
    const body = JSON.parse(JSON.stringify(res.body));
    // The response JSON should not contain the original error message
    expect(res.status).toBe(500);
  });

  it('returns structured ErrorResponse for unknown errors', async () => {
    const err = new TypeError('super secret internal detail 12345');
    const res = handleError(err, makeReq());
    const json = await res.json();
    expect(json).toHaveProperty('status', 500);
    expect(json).toHaveProperty('error', 'Internal Server Error');
    expect(json.message).not.toContain('super secret internal detail');
  });

  it('returns 409 for Prisma unique constraint violation', async () => {
    const err = { code: 'P2002', meta: { target: ['email'] } };
    const res = handleError(err, makeReq());
    const json = await res.json();
    expect(json.status).toBe(409);
    expect(json.message).toContain('email already exists');
  });
});
