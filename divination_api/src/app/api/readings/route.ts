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

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));
    const skip = (page - 1) * pageSize;

    const [totalCount, readings] = await Promise.all([
      prisma.reading.count({
        where: { userId: auth.userId },
      }),
      prisma.reading.findMany({
        where: { userId: auth.userId },
        include: {
          cardReadings: {
            include: {
              card: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    const validatedResponse = GetAllReadingsResponseSchema.parse({
      data: readings,
      meta: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });

    const response = NextResponse.json(validatedResponse, { status: 200 });
    
    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    return handleError(error, request);
  }
}
