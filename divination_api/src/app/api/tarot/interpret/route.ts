import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleError } from '@/middleware/error-handler';
import { requireAuth } from '@/middleware/auth';
import { applyRateLimit } from '@/middleware/rate-limit-middleware';
import { InterpretRequestSchema, InterpretResponseSchema } from '@/schemas';
import { ValidationError } from '@/lib/errors';
import { buildPrompt } from '@/services/llm/prompt-builder';
import { OpenAiProvider } from '@/services/llm/openai-provider';
import { LlmTimeoutError, LlmRateLimitError } from '@/services/llm/types';
import { UsageService } from '@/services/usage-service';

function getLlmService() {
  return new OpenAiProvider({
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    timeoutMs: 5000,
  });
}

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

    const parseResult = InterpretRequestSchema.safeParse(body);
    if (!parseResult.success) {
      throw new ValidationError('Invalid interpretation request');
    }

    const { readingId, userInput, cards, spreadType, userContext } = parseResult.data;

    // Verify reading ownership before calling LLM
    const reading = await prisma.reading.findUnique({
      where: { id: readingId },
    });

    if (!reading) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 404,
          error: 'Not Found',
          message: 'Reading not found',
          path: request.nextUrl.pathname,
        },
        { status: 404 }
      );
    }

    if (reading.userId !== auth.userId) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 403,
          error: 'Forbidden',
          message: 'Access denied to reading',
          path: request.nextUrl.pathname,
        },
        { status: 403 }
      );
    }

    const hasQuota = await UsageService.checkQuota(auth.userId, auth.tier);
    if (!hasQuota) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 429,
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Upgrade your tier for more readings.',
          path: request.nextUrl.pathname,
        },
        { status: 429 }
      );
    }

    const prompt = buildPrompt({ spreadType, userInput, userContext, cards });

    const llmService = getLlmService();
    const interpretation = await llmService.generateInterpretation(prompt);

    await UsageService.incrementUsage(auth.userId);

    await prisma.reading.update({
      where: { id: readingId },
      data: { llmInterpretation: interpretation },
    });

    const responseData = {
      readingId,
      interpretation,
      timestamp: new Date().toISOString(),
      spreadType,
      tier: auth.tier,
    };

    const validatedResponse = InterpretResponseSchema.parse(responseData);

    const response = NextResponse.json(validatedResponse, { status: 200 });
    
    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    if (error instanceof LlmTimeoutError) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 504,
          error: 'Gateway Timeout',
          message: error.message,
          path: request.nextUrl.pathname,
        },
        { status: 504 }
      );
    }
    if (error instanceof LlmRateLimitError) {
      return NextResponse.json(
        {
          timestamp: new Date().toISOString(),
          status: 429,
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Upgrade your tier for more readings.',
          path: request.nextUrl.pathname,
        },
        { status: 429 }
      );
    }
    return handleError(error, request);
  }
}
