import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleError } from '@/middleware/error-handler';
import { requireAuth } from '@/middleware/auth';
import { GetAllReadingsResponseSchema } from '@/schemas';

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
