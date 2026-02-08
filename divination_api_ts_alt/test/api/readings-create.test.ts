import { NextRequest } from 'next/server';
import { CreateReadingResponseSchema, ErrorResponseSchema } from '@/schemas';

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    reading: {
      create: jest.fn(),
    },
  },
}));

// Mock auth middleware
jest.mock('@/middleware/auth', () => ({
  requireAuth: jest.fn(),
}));

import { prisma } from '@/lib/db';
import { requireAuth } from '@/middleware/auth';
import { POST } from '@/app/api/reading/s/route';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

const mockUserId = '550e8400-e29b-41d4-a716-446655440000';

function createRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost:3000/api/reading/s', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

const validBody = {
  cardReadings: [
    { card: { id: 1 }, position: 0, reversed: false },
    { card: { id: 22 }, position: 1, reversed: true },
    { card: { id: 45 }, position: 2, reversed: false },
  ],
};

const mockCreatedReading = {
  id: 42,
  userId: mockUserId,
  llmInterpretation: null,
  createdAt: '2026-01-30T19:00:00.000Z',
  cardReadings: [],
};

describe('POST /api/reading/s', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates reading for authenticated user with valid body', async () => {
    mockRequireAuth.mockResolvedValue({ userId: mockUserId, tier: 'FREE' });
    (mockPrisma.reading.create as jest.Mock).mockResolvedValue(mockCreatedReading);

    const request = createRequest(validBody, { Authorization: 'Bearer valid-token' });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(() => CreateReadingResponseSchema.parse(body)).not.toThrow();
    expect(body.userId).toBe(mockUserId);
    expect(mockPrisma.reading.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: mockUserId,
        }),
      })
    );
  });

  it('returns 400 for invalid card IDs', async () => {
    mockRequireAuth.mockResolvedValue({ userId: mockUserId, tier: 'FREE' });

    const invalidBody = {
      cardReadings: [
        { card: { id: -1 }, position: 0, reversed: false },
      ],
    };

    const request = createRequest(invalidBody, { Authorization: 'Bearer valid-token' });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(() => ErrorResponseSchema.parse(body)).not.toThrow();
  });

  it('returns 400 for empty cardReadings', async () => {
    mockRequireAuth.mockResolvedValue({ userId: mockUserId, tier: 'FREE' });

    const request = createRequest({ cardReadings: [] }, { Authorization: 'Bearer valid-token' });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(() => ErrorResponseSchema.parse(body)).not.toThrow();
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
});
