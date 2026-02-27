import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('API_BASE_URL configuration', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should use VITE_API_URL when set', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.com');

    const mod = await import('../api');
    // The module uses API_BASE_URL internally in apiFetch; we test via the fetch call
    // We need to check that fetch is called with the correct base URL
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    vi.stubGlobal('fetch', mockFetch);

    await mod.cardAPI.getAllCards();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/cards',
      expect.any(Object)
    );

    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("should fallback to '/api' when VITE_API_URL is undefined", async () => {
    vi.stubEnv('VITE_API_URL', undefined as unknown as string);

    const mod = await import('../api');
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    vi.stubGlobal('fetch', mockFetch);

    await mod.cardAPI.getAllCards();

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/cards',
      expect.any(Object)
    );

    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
});

describe('Auth token wiring', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('attaches Bearer token from authSession localStorage', async () => {
    const session = { token: 'test-jwt-token', email: 'a@b.com', tier: 'FREE', expiresAt: Date.now() + 60000 };
    localStorage.setItem('authSession', JSON.stringify(session));

    const mod = await import('../api');
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    vi.stubGlobal('fetch', mockFetch);

    await mod.cardAPI.getAllCards();

    const callHeaders = mockFetch.mock.calls[0][1].headers;
    expect(callHeaders.Authorization).toBe('Bearer test-jwt-token');
  });

  it('does not attach Authorization header when no session exists', async () => {
    const mod = await import('../api');
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    vi.stubGlobal('fetch', mockFetch);

    await mod.cardAPI.getAllCards();

    const callHeaders = mockFetch.mock.calls[0][1].headers;
    expect(callHeaders.Authorization).toBeUndefined();
  });
});
