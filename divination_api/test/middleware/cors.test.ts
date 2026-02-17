import { NextRequest, NextResponse } from 'next/server';

describe('CORS middleware', () => {
  let applyCors: (request: NextRequest, response: NextResponse) => NextResponse;

  beforeEach(async () => {
    jest.resetModules();
    const mod = await import('@/middleware/cors');
    applyCors = mod.applyCors;
  });

  afterEach(() => {
    delete process.env.ALLOWED_ORIGINS;
  });

  it('should add CORS headers when ALLOWED_ORIGINS set', () => {
    process.env.ALLOWED_ORIGINS = 'http://localhost:3002,https://example.com';

    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: { origin: 'http://localhost:3002' },
    });
    const response = NextResponse.json({ data: 'test' });

    const result = applyCors(request, response);

    expect(result.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3002');
    expect(result.headers.get('Access-Control-Allow-Credentials')).toBe('true');
  });

  it('should allow credentials for allowed origins', () => {
    process.env.ALLOWED_ORIGINS = 'https://example.com';

    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: { origin: 'https://example.com' },
    });
    const response = NextResponse.json({ data: 'test' });

    const result = applyCors(request, response);

    expect(result.headers.get('Access-Control-Allow-Credentials')).toBe('true');
  });

  it('should reject requests from disallowed origins', () => {
    process.env.ALLOWED_ORIGINS = 'https://example.com';

    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: { origin: 'https://evil.com' },
    });
    const response = NextResponse.json({ data: 'test' });

    const result = applyCors(request, response);

    expect(result.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('should handle preflight OPTIONS requests', () => {
    process.env.ALLOWED_ORIGINS = 'http://localhost:3002';

    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'OPTIONS',
      headers: { origin: 'http://localhost:3002' },
    });
    const response = new NextResponse(null, { status: 200 });

    const result = applyCors(request, response);

    expect(result.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    expect(result.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(result.headers.get('Access-Control-Allow-Headers')).toBeDefined();
  });

  it('should handle undefined ALLOWED_ORIGINS', () => {
    delete process.env.ALLOWED_ORIGINS;

    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: { origin: 'http://localhost:3002' },
    });
    const response = NextResponse.json({ data: 'test' });

    const result = applyCors(request, response);

    expect(result.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(result.headers.get('Access-Control-Allow-Credentials')).toBeNull();
  });

  it('should handle empty ALLOWED_ORIGINS', () => {
    process.env.ALLOWED_ORIGINS = '';

    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: { origin: 'http://localhost:3002' },
    });
    const response = NextResponse.json({ data: 'test' });

    const result = applyCors(request, response);

    expect(result.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(result.headers.get('Access-Control-Allow-Credentials')).toBeNull();
  });

  it('should allow all origins when ALLOWED_ORIGINS is *', () => {
    process.env.ALLOWED_ORIGINS = '*';

    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: { origin: 'https://any-domain.com' },
    });
    const response = NextResponse.json({ data: 'test' });

    const result = applyCors(request, response);

    expect(result.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});
