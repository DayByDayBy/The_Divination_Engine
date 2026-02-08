import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleError } from '@/middleware/error-handler';
import { requireAuth } from '@/middleware/auth';
import { applyRateLimit } from '@/middleware/rate-limit-middleware';
import { GetAllReadingsResponseSchema, CreateReadingRequestSchema, CreateReadingResponseSchema } from '@/schemas';
import { ValidationError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    
    // Apply rate limiting
    const rateLimitResult = applyRateLimit(request, {
      pathname: request.nextUrl.pathname,
      auth,
    });
    
    if (rateLimitResult.response) {
      return rateLimitResult.response;
    }

    const body = await request.json();

    // Validate request body
    const parseResult = CreateReadingRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const errorMessages = parseResult.error.errors.map(err => err.message).join(', ');
      throw new ValidationError(errorMessages);
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

    const response = NextResponse.json(validatedReading, { status: 201 });
    
    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return handleError(error, request);
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    
    // Apply rate limiting
    const rateLimitResult = applyRateLimit(request, {
      pathname: request.nextUrl.pathname,
      auth,
    });
    
    if (rateLimitResult.response) {
      return rateLimitResult.response;
    }

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

    const response = NextResponse.json(validatedReadings, { status: 200 });
    
    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return handleError(error, request);
  }
}
