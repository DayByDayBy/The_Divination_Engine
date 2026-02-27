import { prisma } from '@/lib/db';
import { UserTier } from '@/schemas';

export const TIER_LIMITS: Record<UserTier, number> = {
  FREE: 3,
  BASIC: 20,
  PREMIUM: 999999, // practically unlimited
};

export class UsageService {
  /**
   * Get the current month string in YYYY-MM format
   */
  static getCurrentMonth(): string {
    const date = new Date();
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Get the user's usage count for the given month
   */
  static async getUsage(userId: string, month: string = this.getCurrentMonth()): Promise<number> {
    const record = await prisma.usageRecord.findUnique({
      where: {
        userId_month: {
          userId,
          month,
        },
      },
    });

    return record?.count ?? 0;
  }

  /**
   * Check if the user has remaining quota for the given tier
   */
  static async checkQuota(userId: string, tier: UserTier): Promise<boolean> {
    if (tier === 'PREMIUM') return true;

    const month = this.getCurrentMonth();
    const currentUsage = await this.getUsage(userId, month);
    const limit = TIER_LIMITS[tier];

    return currentUsage < limit;
  }

  /**
   * Increment the user's usage count for the given month
   * Creates the record if it doesn't exist
   */
  static async incrementUsage(userId: string, month: string = this.getCurrentMonth()): Promise<number> {
    const record = await prisma.usageRecord.upsert({
      where: {
        userId_month: {
          userId,
          month,
        },
      },
      update: {
        count: {
          increment: 1,
        },
      },
      create: {
        userId,
        month,
        count: 1,
      },
    });

    return record.count;
  }
}
