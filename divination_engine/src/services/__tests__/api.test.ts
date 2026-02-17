import { describe, it, expect, vi, beforeEach } from 'vitest';

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
