import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleError } from '@/middleware/error-handler';
import { requireAuth } from '@/middleware/auth';
import { GetAllReadingsResponseSchema, CreateReadingRequestSchema, CreateReadingResponseSchema } from '@/schemas';
import { ValidationError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    const body = await request.json();

    // Validate request body
    const parseResult = CreateReadingRequestSchema.safeParse(body);
    if (!parseResult.success) {
      throw new ValidationError('Invalid reading request');
    }

    const { cardReadings } = parseResult.data;

    const reading = await prisma.reading.create({
      data: {
        userId: auth.userId,
        cardReadings: {
          create: cardReadings.map((cr) => ({
            cardId: cr.card.id,
            position: cr.position,
            reversed: cr.reversed,
          })),
        },
      },
      include: {
        cardReadings: {
          include: {
            card: true,
          },
        },
      },
    });

    const validatedReading = CreateReadingResponseSchema.parse(reading);

    return NextResponse.json(validatedReading, { status: 201 });
  } catch (error) {
    return handleError(error, request);
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);

    const readings = await prisma.reading.findMany({
      where: { userId: auth.userId },
      include: {
        cardReadings: {
          include: {
            card: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const validatedReadings = GetAllReadingsResponseSchema.parse(readings);

    return NextResponse.json(validatedReadings, { status: 200 });
  } catch (error) {
    return handleError(error, request);
  }
}
