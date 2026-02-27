import { prisma } from '@/lib/db';
import { UsageService } from '@/services/usage-service';

jest.mock('@/lib/db', () => ({
  prisma: {
    usageRecord: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

type PrismaUsageMock = {
  usageRecord: {
    findUnique: jest.Mock;
    upsert: jest.Mock;
  };
};

const mockPrisma = prisma as unknown as PrismaUsageMock;

describe('UsageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('formats current month as YYYY-MM in UTC', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-02-15T08:00:00.000Z'));

    expect(UsageService.getCurrentMonth()).toBe('2026-02');
  });

  it('returns usage count when monthly record exists', async () => {
    mockPrisma.usageRecord.findUnique.mockResolvedValue({ count: 7 });

    const usage = await UsageService.getUsage('user-1', '2026-02');

    expect(usage).toBe(7);
    expect(mockPrisma.usageRecord.findUnique).toHaveBeenCalledWith({
      where: {
        userId_month: {
          userId: 'user-1',
          month: '2026-02',
        },
      },
    });
  });

  it('returns 0 when no usage record exists', async () => {
    mockPrisma.usageRecord.findUnique.mockResolvedValue(null);

    const usage = await UsageService.getUsage('user-1', '2026-02');

    expect(usage).toBe(0);
  });

  it('returns true for PREMIUM quota without querying usage', async () => {
    const hasQuota = await UsageService.checkQuota('user-1', 'PREMIUM');

    expect(hasQuota).toBe(true);
    expect(mockPrisma.usageRecord.findUnique).not.toHaveBeenCalled();
  });

  it('returns false when FREE user reaches monthly limit', async () => {
    mockPrisma.usageRecord.findUnique.mockResolvedValue({ count: 3 });

    const hasQuota = await UsageService.checkQuota('user-1', 'FREE');

    expect(hasQuota).toBe(false);
  });

  it('returns false when BASIC user reaches monthly limit', async () => {
    mockPrisma.usageRecord.findUnique.mockResolvedValue({ count: 20 });

    const hasQuota = await UsageService.checkQuota('user-1', 'BASIC');

    expect(hasQuota).toBe(false);
  });

  it('increments usage via upsert and returns updated count', async () => {
    mockPrisma.usageRecord.upsert.mockResolvedValue({ count: 4 });

    const count = await UsageService.incrementUsage('user-1', '2026-02');

    expect(count).toBe(4);
    expect(mockPrisma.usageRecord.upsert).toHaveBeenCalledWith({
      where: {
        userId_month: {
          userId: 'user-1',
          month: '2026-02',
        },
      },
      update: {
        count: {
          increment: 1,
        },
      },
      create: {
        userId: 'user-1',
        month: '2026-02',
        count: 1,
      },
    });
  });

  it('uses current month when incrementing without explicit month', async () => {
    jest.spyOn(UsageService, 'getCurrentMonth').mockReturnValue('2026-03');
    mockPrisma.usageRecord.upsert.mockResolvedValue({ count: 1 });

    await UsageService.incrementUsage('user-1');

    expect(mockPrisma.usageRecord.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_month: {
            userId: 'user-1',
            month: '2026-03',
          },
        },
      })
    );
  });
});
