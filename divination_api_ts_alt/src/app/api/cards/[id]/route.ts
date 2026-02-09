import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleError } from '@/middleware/error-handler';
import { GetCardByIdRequestSchema, GetCardByIdResponseSchema } from '@/schemas';
import { ValidationError } from '@/lib/errors';
import { ErrorResponse } from '@/schemas';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Validate and parse the ID parameter
    const parseResult = GetCardByIdRequestSchema.safeParse({ id });
    if (!parseResult.success) {
      throw new ValidationError('Invalid card ID');
    }

    const cardId = parseResult.data.id;

    // Query card from database
    const card = await prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      const errorResponse: ErrorResponse = {
        timestamp: new Date().toISOString(),
        status: 404,
        error: 'Not Found',
        message: `Card not found with id: '${cardId}'`,
        path: request.nextUrl.pathname,
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Validate response matches schema
    const validatedCard = GetCardByIdResponseSchema.parse(card);

    return NextResponse.json(validatedCard, { status: 200 });
  } catch (error) {
    return handleError(error, request);
  }
}
