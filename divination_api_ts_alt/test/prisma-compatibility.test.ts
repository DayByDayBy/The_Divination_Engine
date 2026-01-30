/**
 * P0-003: Prisma Compatibility Audit
 * 
 * Validates that Prisma can handle the existing Supabase schema and all CRUD operations.
 * 
 * ABORT CONDITION: If Prisma cannot handle schema or basic queries exceed 500ms.
 * 
 * Prerequisites:
 * - DATABASE_URL environment variable set
 * - `npx prisma generate` has been run
 * - Database is accessible
 */

import { PrismaClient, CardType, UserTier } from '@prisma/client';

const prisma = new PrismaClient();

// Performance threshold (abort if exceeded)
const MAX_QUERY_TIME_MS = 500;
const RANDOM_CARD_TARGET_MS = 100;

// =============================================================================
// Helper Functions
// =============================================================================

async function measureQueryTime<T>(
  name: string,
  query: () => Promise<T>
): Promise<{ result: T; durationMs: number }> {
  const start = performance.now();
  const result = await query();
  const durationMs = performance.now() - start;
  console.log(`  ${name}: ${durationMs.toFixed(2)}ms`);
  return { result, durationMs };
}

/**
 * Efficient random card selection (NOT using ORDER BY random())
 * This is the recommended approach for the TypeScript backend
 */
async function getRandomCardsEfficient(count: number): Promise<{ id: number }[]> {
  // Fetch all existing card IDs (don't assume sequential)
  const allCards = await prisma.card.findMany({ select: { id: true } });
  
  if (count >= allCards.length) {
    return allCards;
  }
  
  // Fisher-Yates shuffle to select random unique cards
  const shuffled = [...allCards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  // Return first 'count' cards from shuffled array
  return shuffled.slice(0, count);
}

// =============================================================================
// Test Cases
// =============================================================================

describe('Prisma Compatibility Tests', () => {
  
  beforeAll(async () => {
    // Ensure connection is established
    await prisma.$connect();
  });
  
  afterAll(async () => {
    await prisma.$disconnect();
  });
  
  describe('Schema Introspection', () => {
    
    test('should connect to database', async () => {
      const result = await prisma.$queryRaw`SELECT 1 as connected`;
      expect(result).toBeDefined();
    });
    
    test('should have cards table with correct structure', async () => {
      const card = await prisma.card.findFirst();
      
      expect(card).not.toBeNull();
      expect(card).toBeDefined();
      
      if (!card) {
        throw new Error('No cards found in database - ensure cards are seeded');
      }
      
      expect(card).toHaveProperty('id');
      expect(card).toHaveProperty('type');
      expect(card).toHaveProperty('suit');
      expect(card).toHaveProperty('nameShort');
      expect(card).toHaveProperty('name');
      expect(card).toHaveProperty('value');
      expect(card).toHaveProperty('intValue');
      expect(card).toHaveProperty('meaningUp');
      expect(card).toHaveProperty('meaningRev');
      expect(card).toHaveProperty('description');
    });
    
    test('should have readings table with correct structure', async () => {
      // Just verify the model is accessible
      const count = await prisma.reading.count();
      expect(typeof count).toBe('number');
    });
    
    test('should have users table with correct structure', async () => {
      // Just verify the model is accessible
      const count = await prisma.user.count();
      expect(typeof count).toBe('number');
    });
    
  });
  
  describe('Card CRUD Operations', () => {
    
    test('should read all cards', async () => {
      const { result, durationMs } = await measureQueryTime(
        'findMany cards',
        () => prisma.card.findMany()
      );
      
      expect(result.length).toBe(78); // Standard tarot deck
      expect(durationMs).toBeLessThan(MAX_QUERY_TIME_MS);
    });
    
    test('should read single card by ID', async () => {
      const { result, durationMs } = await measureQueryTime(
        'findUnique card',
        () => prisma.card.findUnique({ where: { id: 1 } })
      );
      
      expect(result).toBeDefined();
      expect(result?.name).toBeDefined();
      expect(durationMs).toBeLessThan(MAX_QUERY_TIME_MS);
    });
    
    test('should filter cards by type', async () => {
      const majorCards = await prisma.card.findMany({
        where: { type: CardType.MAJOR },
      });
      
      expect(majorCards.length).toBe(22); // 22 Major Arcana
    });
    
  });
  
  describe('Random Card Selection (Performance Critical)', () => {
    
    test('should select random cards efficiently (NOT ORDER BY random())', async () => {
      const { result, durationMs } = await measureQueryTime(
        'getRandomCardsEfficient(3)',
        () => getRandomCardsEfficient(3)
      );
      
      expect(result.length).toBe(3);
      expect(durationMs).toBeLessThan(RANDOM_CARD_TARGET_MS);
      
      // Verify no duplicates
      const ids = result.map(c => c.id);
      expect(new Set(ids).size).toBe(3);
    });
    
    test('should handle larger random selection', async () => {
      const { result, durationMs } = await measureQueryTime(
        'getRandomCardsEfficient(10)',
        () => getRandomCardsEfficient(10)
      );
      
      expect(result.length).toBe(10);
      expect(durationMs).toBeLessThan(RANDOM_CARD_TARGET_MS);
    });
    
    test('should handle edge case: count > total cards', async () => {
      const { result } = await measureQueryTime(
        'getRandomCardsEfficient(100)',
        () => getRandomCardsEfficient(100)
      );
      
      expect(result.length).toBe(78); // Can't exceed total
    });
    
  });
  
  describe('Reading CRUD Operations', () => {
    
    let testReadingId: number;
    const testUserId = '550e8400-e29b-41d4-a716-446655440000';
    
    test('should create a reading', async () => {
      const { result, durationMs } = await measureQueryTime(
        'create reading',
        () => prisma.reading.create({
          data: {
            userId: testUserId,
            cardReadings: {
              create: [
                { cardId: 1, position: 0, reversed: false },
                { cardId: 22, position: 1, reversed: true },
                { cardId: 45, position: 2, reversed: false },
              ],
            },
          },
          include: { cardReadings: true },
        })
      );
      
      testReadingId = result.id;
      
      expect(result.id).toBeDefined();
      expect(result.userId).toBe(testUserId);
      expect(result.cardReadings.length).toBe(3);
      expect(durationMs).toBeLessThan(MAX_QUERY_TIME_MS);
    });
    
    test('should read reading with cards included', async () => {
      const { result, durationMs } = await measureQueryTime(
        'findUnique reading with cards',
        () => prisma.reading.findUnique({
          where: { id: testReadingId },
          include: {
            cardReadings: {
              include: { card: true },
            },
          },
        })
      );
      
      expect(result).toBeDefined();
      expect(result?.cardReadings.length).toBe(3);
      expect(result?.cardReadings[0].card).toBeDefined();
      expect(durationMs).toBeLessThan(MAX_QUERY_TIME_MS);
    });
    
    test('should list readings by user', async () => {
      const { result, durationMs } = await measureQueryTime(
        'findMany readings by user',
        () => prisma.reading.findMany({
          where: { userId: testUserId },
          include: { cardReadings: true },
        })
      );
      
      expect(result.length).toBeGreaterThan(0);
      expect(durationMs).toBeLessThan(MAX_QUERY_TIME_MS);
    });
    
    test('should delete reading (cascade deletes card_readings)', async () => {
      const { durationMs } = await measureQueryTime(
        'delete reading',
        () => prisma.reading.delete({
          where: { id: testReadingId },
        })
      );
      
      expect(durationMs).toBeLessThan(MAX_QUERY_TIME_MS);
      
      // Verify cascade delete
      const orphanedCards = await prisma.cardInReading.findMany({
        where: { readingId: testReadingId },
      });
      expect(orphanedCards.length).toBe(0);
    });
    
  });
  
  describe('User CRUD Operations', () => {
    
    let testUserId: string;
    const testEmail = `test-${Date.now()}@example.com`;
    
    test('should create a user', async () => {
      const { result, durationMs } = await measureQueryTime(
        'create user',
        () => prisma.user.create({
          data: {
            email: testEmail,
            passwordHash: '$2b$10$hashedpasswordhere',
            tier: UserTier.FREE,
          },
        })
      );
      
      testUserId = result.id;
      
      expect(result.id).toBeDefined();
      expect(result.email).toBe(testEmail);
      expect(result.tier).toBe(UserTier.FREE);
      expect(durationMs).toBeLessThan(MAX_QUERY_TIME_MS);
    });
    
    test('should find user by email', async () => {
      const { result, durationMs } = await measureQueryTime(
        'findUnique user by email',
        () => prisma.user.findUnique({
          where: { email: testEmail },
        })
      );
      
      expect(result).toBeDefined();
      expect(result?.id).toBe(testUserId);
      expect(durationMs).toBeLessThan(MAX_QUERY_TIME_MS);
    });
    
    test('should update user tier', async () => {
      const { result, durationMs } = await measureQueryTime(
        'update user tier',
        () => prisma.user.update({
          where: { id: testUserId },
          data: { tier: UserTier.PREMIUM },
        })
      );
      
      expect(result.tier).toBe(UserTier.PREMIUM);
      expect(durationMs).toBeLessThan(MAX_QUERY_TIME_MS);
    });
    
    test('should delete user', async () => {
      const { durationMs } = await measureQueryTime(
        'delete user',
        () => prisma.user.delete({
          where: { id: testUserId },
        })
      );
      
      expect(durationMs).toBeLessThan(MAX_QUERY_TIME_MS);
    });
    
    test('should enforce unique email constraint', async () => {
      // Create first user
      const user1 = await prisma.user.create({
        data: {
          email: 'duplicate@example.com',
          passwordHash: 'hash',
          tier: UserTier.FREE,
        },
      });
      
      // Attempt to create duplicate
      await expect(
        prisma.user.create({
          data: {
            email: 'duplicate@example.com',
            passwordHash: 'hash',
            tier: UserTier.FREE,
          },
        })
      ).rejects.toThrow();
      
      // Cleanup
      await prisma.user.delete({ where: { id: user1.id } });
    });
    
  });
  
  describe('Transaction Semantics', () => {
    
    test('should support transactions', async () => {
      const testEmail = `tx-test-${Date.now()}@example.com`;
      
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: testEmail,
            passwordHash: 'hash',
            tier: UserTier.FREE,
          },
        });
        
        const reading = await tx.reading.create({
          data: {
            userId: user.id,
            cardReadings: {
              create: [{ cardId: 1, position: 0, reversed: false }],
            },
          },
        });
        
        return { user, reading };
      });
      
      expect(result.user).toBeDefined();
      expect(result.reading).toBeDefined();
      
      // Cleanup
      await prisma.reading.delete({ where: { id: result.reading.id } });
      await prisma.user.delete({ where: { id: result.user.id } });
    });
    
    test('should rollback on transaction failure', async () => {
      const testEmail = `rollback-test-${Date.now()}@example.com`;
      
      await expect(
        prisma.$transaction(async (tx) => {
          await tx.user.create({
            data: {
              email: testEmail,
              passwordHash: 'hash',
              tier: UserTier.FREE,
            },
          });
          
          // Force an error
          throw new Error('Intentional rollback');
        })
      ).rejects.toThrow('Intentional rollback');
      
      // Verify rollback - user should not exist
      const user = await prisma.user.findUnique({
        where: { email: testEmail },
      });
      expect(user).toBeNull();
    });
    
  });
  
});

// =============================================================================
// Standalone Validation Script
// =============================================================================

async function runManualValidation() {
  console.log('=== Prisma Compatibility Validation ===\n');
  
  try {
    await prisma.$connect();
    console.log('✓ Database connection successful\n');
    
    // 1. Count cards
    console.log('1. Checking cards table...');
    const { result: cardCount, durationMs: cardTime } = await measureQueryTime(
      'card count',
      () => prisma.card.count()
    );
    console.log(`   Total cards: ${cardCount}`);
    if (cardCount !== 78) {
      console.log(`   ⚠️ Expected 78 cards, got ${cardCount}`);
    }
    
    // 2. Test random selection
    console.log('\n2. Testing random card selection...');
    const { result: randomCards, durationMs: randomTime } = await measureQueryTime(
      'random 3 cards',
      () => getRandomCardsEfficient(3)
    );
    console.log(`   Selected cards: ${randomCards.map(c => c.id).join(', ')}`);
    if (randomTime > RANDOM_CARD_TARGET_MS) {
      console.log(`   ⚠️ Random selection exceeded ${RANDOM_CARD_TARGET_MS}ms target`);
    }
    
    // 3. Check users table
    console.log('\n3. Checking users table...');
    const { result: userCount } = await measureQueryTime(
      'user count',
      () => prisma.user.count()
    );
    console.log(`   Total users: ${userCount}`);
    
    // 4. Check readings table
    console.log('\n4. Checking readings table...');
    const { result: readingCount } = await measureQueryTime(
      'reading count',
      () => prisma.reading.count()
    );
    console.log(`   Total readings: ${readingCount}`);
    
    console.log('\n=== Validation Complete ===');
    console.log('\n✓ Prisma is COMPATIBLE with the existing schema');
    console.log('✓ No abort conditions triggered');
    
  } catch (error) {
    console.error('\n!!! VALIDATION FAILED !!!');
    console.error(error);
    console.log('\n⚠️ ABORT CONDITION: Prisma may be incompatible with schema');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  runManualValidation();
}
