import nextConfig from '../../next.config.js';

describe('next.config.js structure', () => {
  it('exports a config object', () => {
    expect(nextConfig).toBeDefined();
    expect(typeof nextConfig).toBe('object');
  });

  it('has output set to standalone', () => {
    expect(nextConfig.output).toBe('standalone');
  });

  it('has image optimization disabled', () => {
    expect(nextConfig.images).toBeDefined();
    expect(nextConfig.images?.unoptimized).toBe(true);
  });

  it('has Node.js runtime enabled in experimental', () => {
    expect(nextConfig.experimental).toBeDefined();
    expect((nextConfig.experimental as Record<string, unknown>)?.runtime).toBe('nodejs');
  });

  it('propagates NEXT_PUBLIC_API_URL via env', () => {
    expect(nextConfig.env).toBeDefined();
    expect('NEXT_PUBLIC_API_URL' in (nextConfig.env ?? {})).toBe(true);
  });
});
