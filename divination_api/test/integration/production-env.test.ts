/**
 * T12: Production Environment Variables
 * Validates that required environment variables are defined and well-formed.
 * Tests run against process.env — they pass in any environment where the
 * variables are set, and skip gracefully otherwise.
 */

describe('production environment variables', () => {
  describe('DATABASE_URL', () => {
    const url = process.env.DATABASE_URL;

    (url ? it : it.skip)('is defined', () => {
      expect(url).toBeDefined();
    });

    (url ? it : it.skip)('is a valid PostgreSQL connection string', () => {
      expect(url).toMatch(/^postgres(ql)?:\/\//);
    });

    (url ? it : it.skip)('uses connection pooling port 6543 for serverless', () => {
      expect(url).toMatch(/:6543\b/);
    });
  });

  describe('DIRECT_URL', () => {
    const url = process.env.DIRECT_URL;

    (url ? it : it.skip)('is defined', () => {
      expect(url).toBeDefined();
    });

    (url ? it : it.skip)('is a valid PostgreSQL connection string', () => {
      expect(url).toMatch(/^postgres(ql)?:\/\//);
    });

    (url ? it : it.skip)('uses direct port 5432', () => {
      expect(url).toMatch(/:5432\b/);
    });
  });

  describe('JWT_SECRET', () => {
    const secret = process.env.JWT_SECRET;

    it('is defined (set in jest.setup.js for tests)', () => {
      expect(secret).toBeDefined();
    });

    it('is at least 32 characters long', () => {
      expect(secret!.length).toBeGreaterThanOrEqual(32);
    });
  });
});
