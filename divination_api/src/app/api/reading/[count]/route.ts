import { NextRequest, NextResponse } from 'next/server';
import { handleError } from '@/middleware/error-handler';
import { GetRandomCardsRequestSchema, GetRandomCardsResponseSchema } from '@/schemas';
import { selectRandomCards } from '@/services/card-service';
import { ValidationError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ count: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { count } = await params;

    // Validate and parse the count parameter
    const parseResult = GetRandomCardsRequestSchema.safeParse({ count });
    if (!parseResult.success) {
      throw new ValidationError('Invalid card count');
    }

    const cardCount = parseResult.data.count;

    // Select random cards
    const cards = await selectRandomCards(cardCount);

    // Validate response matches schema
    const validatedCards = GetRandomCardsResponseSchema.parse(cards);

    return NextResponse.json(validatedCards, { status: 200 });
  } catch (error) {
    return handleError(error, request);
  }
}
