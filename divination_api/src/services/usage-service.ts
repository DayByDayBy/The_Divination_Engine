import { prisma } from '@/lib/db';
import { UserTier } from '@/schemas';

export const TIER_LIMITS: Record<UserTier, number> = {
    FREE: 3,
    BASIC: 20,
    PREMIUM: 99999, // practically unlimited
};

export class UsageService {
    /**
     * Get the current day string in YYYY-MM-DD format
     */
    static getCurrentDay(): string {
        const date = new Date();
        return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    }

    /**
     * Get the user's usage count for the given day
     */
    static async getUsage(userId: string, day: string = this.getCurrentDay()): Promise<number> {
        const record = await prisma.usageRecord.findUnique({
            where: {
                userId_day: {
                    userId,
                    day,
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

        const day = this.getCurrentDay();
        const currentUsage = await this.getUsage(userId, day);
        const limit = TIER_LIMITS[tier];

        return currentUsage < limit;
    }

    /**
     * Increment the user's usage count for the given day
     * Creates the record if it doesn't exist
     */
    static async incrementUsage(userId: string, day: string = this.getCurrentDay()): Promise<number> {
        const record = await prisma.usageRecord.upsert({
            where: {
                userId_day: {
                    userId,
                    day,
                },
            },
            update: {
                count: {
                    increment: 1,
                },
            },
            create: {
                userId,
                day,
                count: 1,
            },
        });

        return record.count;
    }
}
