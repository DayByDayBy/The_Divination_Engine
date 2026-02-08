import { NextRequest } from 'next/server';
import { InterpretResponseSchema, ErrorResponseSchema } from '@/schemas';

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    reading: {
      update: jest.fn(),
    },
  },
}));

// Mock auth middleware
jest.mock('@/middleware/auth', () => ({
  requireAuth: jest.fn(),
}));

// Mock LLM service
jest.mock('@/services/llm/openai-provider', () => ({
  OpenAiProvider: jest.fn().mockImplementation(() => ({
    generateInterpretation: jest.fn().mockResolvedValue('Based on the cards drawn, your reading suggests...'),
  })),
}));

import { prisma } from '@/lib/db';
import { requireAuth } from '@/middleware/auth';
import { POST } from '@/app/api/tarot/interpret/route';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

const mockUserId = '550e8400-e29b-41d4-a716-446655440000';

function createRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost:3000/api/tarot/interpret', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

const validBody = {
  readingId: 1,
  userInput: 'What does this reading mean for my career?',
  cards: [
    {
      name: 'The Fool',
      reversed: false,
      meaningUp: 'New beginnings...',
      meaningRev: 'Recklessness...',
      position: 0,
    },
  ],
  spreadType: 'THREE_CARD',
  userContext: "I'm considering a job change",
};

describe('POST /api/tarot/interpret', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns interpretation for authenticated user with valid request', async () => {
    mockRequireAuth.mockResolvedValue({ userId: mockUserId, tier: 'FREE' });
    (mockPrisma.reading.update as jest.Mock).mockResolvedValue({});

    const request = createRequest(validBody, { Authorization: 'Bearer valid-token' });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(() => InterpretResponseSchema.parse(body)).not.toThrow();
    expect(body.readingId).toBe(1);
    expect(body.interpretation).toBe('Based on the cards drawn, your reading suggests...');
    expect(body.spreadType).toBe('THREE_CARD');
    expect(body.tier).toBe('FREE');
  });

  it('saves interpretation to reading in database', async () => {
    mockRequireAuth.mockResolvedValue({ userId: mockUserId, tier: 'FREE' });
    (mockPrisma.reading.update as jest.Mock).mockResolvedValue({});

    const request = createRequest(validBody, { Authorization: 'Bearer valid-token' });
    await POST(request);

    expect(mockPrisma.reading.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({
          llmInterpretation: 'Based on the cards drawn, your reading suggests...',
        }),
      })
    );
  });

  it('returns 401 when no JWT provided', async () => {
    const { AuthError } = await import('@/lib/errors');
    mockRequireAuth.mockRejectedValue(
      new AuthError('Full authentication is required to access this resource')
    );

    const request = createRequest(validBody);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(() => ErrorResponseSchema.parse(body)).not.toThrow();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 for invalid request body', async () => {
    mockRequireAuth.mockResolvedValue({ userId: mockUserId, tier: 'FREE' });

    const request = createRequest({ userInput: '' }, { Authorization: 'Bearer valid-token' });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(() => ErrorResponseSchema.parse(body)).not.toThrow();
  });
});
