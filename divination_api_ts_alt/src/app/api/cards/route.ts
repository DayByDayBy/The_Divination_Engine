import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleError } from '@/middleware/error-handler';
import { GetAllCardsResponseSchema } from '@/schemas';

export async function GET(request: NextRequest) {
  try {
    // Query all cards from database
    const cards = await prisma.card.findMany({
      orderBy: {
        id: 'asc',
      },
    });

    // Validate response matches schema
    const validatedCards = GetAllCardsResponseSchema.parse(cards);

    return NextResponse.json(validatedCards, { status: 200 });
  } catch (error) {
    return handleError(error, request);
  }
}
