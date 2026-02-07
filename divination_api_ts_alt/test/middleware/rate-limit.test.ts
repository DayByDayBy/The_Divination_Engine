import { RateLimiter, RateLimitConfig } from '@/middleware/rate-limit';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    // Fresh limiter for each test
    rateLimiter = new RateLimiter({ requestsPerMinute: 5 });
  });

  describe('checkLimit', () => {
    it('allows requests under the limit', () => {
      const key = 'test-user-1';

      const result1 = rateLimiter.checkLimit(key);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(4);

      const result2 = rateLimiter.checkLimit(key);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(3);
    });

    it('blocks requests when limit is exceeded', () => {
      const key = 'test-user-2';

      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkLimit(key);
      }

      // Next request should be blocked
      const result = rateLimiter.checkLimit(key);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfterSeconds).toBeGreaterThan(0);
      expect(result.retryAfterSeconds).toBeLessThanOrEqual(60);
    });

    it('tracks limits per key independently', () => {
      const key1 = 'user-a';
      const key2 = 'user-b';

      // Exhaust limit for key1
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkLimit(key1);
      }

      // key2 should still have full limit
      const result = rateLimiter.checkLimit(key2);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('resets after window expires', async () => {
      // Use a very short window for testing
      const shortLimiter = new RateLimiter({
        requestsPerMinute: 2,
        windowMs: 100, // 100ms window for testing
      });
      const key = 'test-user-3';

      // Exhaust the limit
      shortLimiter.checkLimit(key);
      shortLimiter.checkLimit(key);

      let result = shortLimiter.checkLimit(key);
      expect(result.allowed).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be allowed again
      result = shortLimiter.checkLimit(key);
      expect(result.allowed).toBe(true);
    });

    it('returns correct retryAfterSeconds', () => {
      const key = 'test-user-4';

      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkLimit(key);
      }

      const result = rateLimiter.checkLimit(key);
      expect(result.allowed).toBe(false);
      expect(typeof result.retryAfterSeconds).toBe('number');
      expect(result.retryAfterSeconds).toBeGreaterThan(0);
    });
  });

  describe('configuration', () => {
    it('respects custom requestsPerMinute', () => {
      const customLimiter = new RateLimiter({ requestsPerMinute: 3 });
      const key = 'custom-user';

      for (let i = 0; i < 3; i++) {
        const result = customLimiter.checkLimit(key);
        expect(result.allowed).toBe(true);
      }

      const result = customLimiter.checkLimit(key);
      expect(result.allowed).toBe(false);
    });

    it('uses default config when not specified', () => {
      const defaultLimiter = new RateLimiter();
      const key = 'default-user';

      // Should allow at least some requests (default is 60/min)
      const result = defaultLimiter.checkLimit(key);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(59);
    });
  });

  describe('reset', () => {
    it('clears limit for specific key', () => {
      const key = 'reset-user';

      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkLimit(key);
      }

      expect(rateLimiter.checkLimit(key).allowed).toBe(false);

      // Reset the key
      rateLimiter.reset(key);

      // Should be allowed again
      expect(rateLimiter.checkLimit(key).allowed).toBe(true);
    });
  });
});
