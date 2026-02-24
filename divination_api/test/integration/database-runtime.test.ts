/**
 * T10: Database Runtime Compatibility
 * Tests that Prisma works correctly in Node.js runtime.
 * Requires DATABASE_URL to be set AND the database to be reachable.
 * Skips gracefully if either condition is not met.
 */
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;
let dbReachable = false;

beforeAll(async () => {
  if (!process.env.DATABASE_URL) return;
  prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbReachable = true;
  } catch {
    // DB unreachable — tests will skip
  }
});

afterAll(async () => {
  if (prisma) await prisma.$disconnect();
});

describe('database runtime compatibility', () => {
  it('PrismaClient can be instantiated (Node.js runtime)', () => {
    const client = new PrismaClient();
    expect(client).toBeInstanceOf(PrismaClient);
  });

  it('handles connection errors gracefully', async () => {
    const badPrisma = new PrismaClient({
      datasources: { db: { url: 'postgresql://invalid:invalid@localhost:1/invalid' } },
    });
    await expect(badPrisma.$queryRaw`SELECT 1`).rejects.toThrow();
    await badPrisma.$disconnect();
  });
});

describe('database runtime compatibility (live DB)', () => {
  beforeEach(() => {
    if (!dbReachable) {
      console.warn('Skipping: database not reachable');
    }
  });

  const itIfDb = () => (dbReachable ? it : it.skip);

  itIfDb()('connects to the database', async () => {
    const result = await prisma.$queryRaw`SELECT 1 AS ok`;
    expect(result).toBeDefined();
  });

  itIfDb()('can read from the cards table', async () => {
    const cards = await prisma.card.findMany({ take: 1 });
    expect(Array.isArray(cards)).toBe(true);
  });
});
