import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleError } from '@/middleware/error-handler';
import { requireAuth } from '@/middleware/auth';
import { GetReadingByIdRequestSchema, GetReadingByIdResponseSchema } from '@/schemas';
import { ForbiddenError, ValidationError } from '@/lib/errors';
import { ErrorResponse } from '@/schemas';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request);
    const { id } = await params;

    // Validate ID
    const parseResult = GetReadingByIdRequestSchema.safeParse({ id });
    if (!parseResult.success) {
      throw new ValidationError('Invalid reading ID');
    }

    const readingId = parseResult.data.id;

    const reading = await prisma.reading.findUnique({
      where: { id: readingId },
      include: {
        cardReadings: {
          include: {
            card: true,
          },
        },
      },
    });

    if (!reading) {
      const errorResponse: ErrorResponse = {
        timestamp: new Date().toISOString(),
        status: 404,
        error: 'Not Found',
        message: `Reading not found with id: '${readingId}'`,
        path: request.nextUrl.pathname,
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Check ownership
    if (reading.userId !== auth.userId) {
      throw new ForbiddenError('Access denied to reading');
    }

    const validatedReading = GetReadingByIdResponseSchema.parse(reading);

    return NextResponse.json(validatedReading, { status: 200 });
  } catch (error) {
    return handleError(error, request);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(request);
    const { id } = await params;

    // Validate ID
    const parseResult = GetReadingByIdRequestSchema.safeParse({ id });
    if (!parseResult.success) {
      throw new ValidationError('Invalid reading ID');
    }

    const readingId = parseResult.data.id;

    const reading = await prisma.reading.findUnique({
      where: { id: readingId },
    });

    if (!reading) {
      const errorResponse: ErrorResponse = {
        timestamp: new Date().toISOString(),
        status: 404,
        error: 'Not Found',
        message: `Reading not found with id: '${readingId}'`,
        path: request.nextUrl.pathname,
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Check ownership
    if (reading.userId !== auth.userId) {
      throw new ForbiddenError('Access denied to reading');
    }

    await prisma.reading.delete({
      where: { id: readingId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleError(error, request);
  }
}
