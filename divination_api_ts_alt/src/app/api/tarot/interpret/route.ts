import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { handleError } from '@/middleware/error-handler';
import { requireAuth } from '@/middleware/auth';
import { InterpretRequestSchema, InterpretResponseSchema } from '@/schemas';
import { ValidationError } from '@/lib/errors';
import { buildPrompt } from '@/services/llm/prompt-builder';
import { OpenAiProvider } from '@/services/llm/openai-provider';
import { LlmTimeoutError, LlmRateLimitError } from '@/services/llm/types';

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
    const body = await request.json();

    const parseResult = InterpretRequestSchema.safeParse(body);
    if (!parseResult.success) {
      throw new ValidationError('Invalid interpretation request');
    }

    const { readingId, userInput, cards, spreadType, userContext } = parseResult.data;

    const prompt = buildPrompt({ spreadType, userInput, userContext, cards });

    const llmService = getLlmService();
    const interpretation = await llmService.generateInterpretation(prompt);

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

    return NextResponse.json(validatedResponse, { status: 200 });
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
