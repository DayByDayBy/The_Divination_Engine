import { selectRandomCards } from '@/services/card-service';

// Mock card factory
const mockCard = (id: number) => ({
  id,
  type: 'MAJOR' as const,
  suit: null,
  nameShort: `card${id}`,
  name: `Card ${id}`,
  value: `${id}`,
  intValue: id,
  meaningUp: 'meaning up',
  meaningRev: 'meaning rev',
  description: 'description',
});

// Generate all 78 mock cards
const allMockCards = Array.from({ length: 78 }, (_, i) => mockCard(i + 1));

// Mock Prisma client
const mockPrisma = {
  card: {
    findMany: jest.fn(({ where }: { where: { id: { in: number[] } } }) => {
      const ids = where.id.in;
      return Promise.resolve(ids.map((id: number) => allMockCards[id - 1]));
    }),
  },
} as any;

describe('selectRandomCards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns requested number of cards', async () => {
    const cards = await selectRandomCards(3, { prisma: mockPrisma });
    expect(cards).toHaveLength(3);
  });

  it('returns unique cards (no duplicates)', async () => {
    const cards = await selectRandomCards(10, { prisma: mockPrisma });
    const ids = cards.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(10);
  });

  it('returns valid card objects', async () => {
    const cards = await selectRandomCards(1, { prisma: mockPrisma });
    expect(cards[0]).toHaveProperty('id');
    expect(cards[0]).toHaveProperty('name');
    expect(cards[0]).toHaveProperty('type');
    expect(cards[0]).toHaveProperty('suit');
    expect(cards[0]).toHaveProperty('meaningUp');
  });

  it('completes in under 100ms for count <= 10', async () => {
    const start = performance.now();
    await selectRandomCards(10, { prisma: mockPrisma });
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });

  it('throws error if count exceeds total cards (78)', async () => {
    await expect(selectRandomCards(79, { prisma: mockPrisma })).rejects.toThrow();
  });

  it('throws error if count is 0 or negative', async () => {
    await expect(selectRandomCards(0, { prisma: mockPrisma })).rejects.toThrow();
    await expect(selectRandomCards(-1, { prisma: mockPrisma })).rejects.toThrow();
  });

  it('returns different cards on multiple calls (randomness)', async () => {
    const results = await Promise.all([
      selectRandomCards(5, { prisma: mockPrisma }),
      selectRandomCards(5, { prisma: mockPrisma }),
      selectRandomCards(5, { prisma: mockPrisma }),
    ]);
    
    const sets = results.map((r) => r.map((c) => c.id).sort().join(','));
    const uniqueSets = new Set(sets);
    // At least 2 of 3 should be different (statistically very likely)
    expect(uniqueSets.size).toBeGreaterThanOrEqual(2);
  });

  it('does NOT use ORDER BY random() - uses findMany with specific IDs', async () => {
    await selectRandomCards(5, { prisma: mockPrisma });
    expect(mockPrisma.card.findMany).toHaveBeenCalledWith({
      where: { id: { in: expect.any(Array) } },
    });
  });
});
