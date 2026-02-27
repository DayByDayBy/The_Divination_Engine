import { NextRequest } from 'next/server';
import { InterpretResponseSchema, ErrorResponseSchema } from '@/schemas';
import goldenFixtures from '../fixtures/golden-requests.json';

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    reading: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    usageRecord: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
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

type PrismaMock = {
  reading: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  usageRecord: {
    findUnique: jest.Mock;
    upsert: jest.Mock;
  };
};

const mockPrisma = prisma as unknown as PrismaMock;
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
const fixtures = goldenFixtures.endpoints.interpret.interpret;

describe('Interpretation Contract Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ userId: mockUserId, tier: 'FREE' });
    mockPrisma.usageRecord.findUnique.mockResolvedValue({ count: 0 });
    mockPrisma.usageRecord.upsert.mockResolvedValue({ count: 1 });
  });

  describe('POST /api/tarot/interpret', () => {
    it('response format matches golden fixture', async () => {
      (mockPrisma.reading.findUnique as jest.Mock).mockResolvedValue({ id: 1, userId: mockUserId });
      (mockPrisma.reading.update as jest.Mock).mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/tarot/interpret', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fixtures.request.body),
      });
      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(fixtures.response.status);
      expect(() => InterpretResponseSchema.parse(body)).not.toThrow();

      // Verify response structure matches golden fixture keys
      const goldenKeys = Object.keys(fixtures.response.body).sort();
      const responseKeys = Object.keys(body).sort();
      expect(responseKeys).toEqual(goldenKeys);

      // Verify specific field values
      expect(body.readingId).toBe(fixtures.response.body.readingId);
      expect(body.spreadType).toBe(fixtures.response.body.spreadType);
      expect(body.tier).toBe(fixtures.response.body.tier);
    });

    it('401 error format matches golden fixture', async () => {
      const { AuthError } = await import('@/lib/errors');
      mockRequireAuth.mockRejectedValue(
        new AuthError('Full authentication is required to access this resource')
      );

      const request = new NextRequest('http://localhost:3000/api/tarot/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fixtures.request.body),
      });
      const response = await POST(request);
      const body = await response.json();

      const golden401 = fixtures.errorResponses['401'];
      expect(response.status).toBe(golden401.status);
      expect(body.error).toBe(golden401.error);
      expect(body.message).toBe(golden401.message);
      expect(() => ErrorResponseSchema.parse(body)).not.toThrow();
    });

    it('429 error format matches golden fixture', async () => {
      // Override the mock to throw LlmRateLimitError
      const { LlmRateLimitError } = await import('@/services/llm/types');
      const { OpenAiProvider } = await import('@/services/llm/openai-provider');
      (OpenAiProvider as jest.Mock).mockImplementation(() => ({
        generateInterpretation: jest.fn().mockRejectedValue(
          new LlmRateLimitError('Rate limit exceeded')
        ),
      }));

      (mockPrisma.reading.findUnique as jest.Mock).mockResolvedValue({ id: 1, userId: mockUserId });
      (mockPrisma.reading.update as jest.Mock).mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/tarot/interpret', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fixtures.request.body),
      });
      const response = await POST(request);
      const body = await response.json();

      const golden429 = fixtures.errorResponses['429'];
      expect(response.status).toBe(golden429.status);
      expect(body.error).toBe(golden429.error);
      expect(body.message).toBe(golden429.message);
      expect(() => ErrorResponseSchema.parse(body)).not.toThrow();
    });
  });
});
