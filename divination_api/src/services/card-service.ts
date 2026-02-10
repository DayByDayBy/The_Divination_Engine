import { prisma as defaultPrisma } from '@/lib/db';
import { ValidationError } from '@/lib/errors';
import { Card as PrismaCard, PrismaClient } from '@prisma/client';

const TOTAL_CARDS = 78;

export interface CardServiceDeps {
  prisma?: PrismaClient;
}

/**
 * Select N unique random cards from the database.
 * Uses application-side random selection instead of ORDER BY random()
 * for better performance and database portability.
 */
export async function selectRandomCards(
  count: number,
  deps: CardServiceDeps = {}
): Promise<PrismaCard[]> {
  const prisma = deps.prisma ?? defaultPrisma;

  if (count <= 0) {
    throw new ValidationError('Count must be a positive integer');
  }
  
  if (count > TOTAL_CARDS) {
    throw new ValidationError(`Count cannot exceed ${TOTAL_CARDS} cards`);
  }

  // Generate random unique IDs (cards are 1-78)
  const selectedIds = new Set<number>();
  while (selectedIds.size < count) {
    const randomId = Math.floor(Math.random() * TOTAL_CARDS) + 1;
    selectedIds.add(randomId);
  }

  // Fetch cards by IDs in a single query
  const cards = await prisma.card.findMany({
    where: {
      id: { in: Array.from(selectedIds) },
    },
  });

  // Shuffle the result to ensure random order
  return shuffleArray(cards);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
