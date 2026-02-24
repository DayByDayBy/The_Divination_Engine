import nextConfig from '../../next.config.js';

describe('security headers configuration', () => {
  let headersConfig: Awaited<ReturnType<NonNullable<typeof nextConfig.headers>>>;

  beforeAll(async () => {
    headersConfig = await nextConfig.headers!();
  });

  it('defines at least one header rule', () => {
    expect(headersConfig).toBeDefined();
    expect(headersConfig.length).toBeGreaterThan(0);
  });

  it('applies headers to /api routes only', () => {
    const apiRule = headersConfig.find((r) => r.source === '/api/:path*');
    expect(apiRule).toBeDefined();
  });

  it('sets X-Content-Type-Options: nosniff', () => {
    const apiRule = headersConfig.find((r) => r.source === '/api/:path*')!;
    const header = apiRule.headers.find((h) => h.key === 'X-Content-Type-Options');
    expect(header).toBeDefined();
    expect(header?.value).toBe('nosniff');
  });

  it('sets X-Frame-Options: DENY', () => {
    const apiRule = headersConfig.find((r) => r.source === '/api/:path*')!;
    const header = apiRule.headers.find((h) => h.key === 'X-Frame-Options');
    expect(header).toBeDefined();
    expect(header?.value).toBe('DENY');
  });

  it('sets X-XSS-Protection: 1; mode=block', () => {
    const apiRule = headersConfig.find((r) => r.source === '/api/:path*')!;
    const header = apiRule.headers.find((h) => h.key === 'X-XSS-Protection');
    expect(header).toBeDefined();
    expect(header?.value).toBe('1; mode=block');
  });
});
