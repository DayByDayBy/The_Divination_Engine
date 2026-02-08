import { NextRequest } from 'next/server';
import { GetAllReadingsResponseSchema, ErrorResponseSchema } from '@/schemas';

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    reading: {
      findMany: jest.fn(),
    },
  },
}));

// Mock auth middleware
jest.mock('@/middleware/auth', () => ({
  requireAuth: jest.fn(),
}));

import { prisma } from '@/lib/db';
import { requireAuth } from '@/middleware/auth';
import { GET } from '@/app/api/reading/s/route';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

function createRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost:3000/api/reading/s', {
    method: 'GET',
    headers,
  });
}

const mockUserId = '550e8400-e29b-41d4-a716-446655440000';

const mockReadings = [
  {
    id: 1,
    userId: mockUserId,
    llmInterpretation: null,
    createdAt: '2026-01-30T19:00:00.000Z',
    cardReadings: [
      {
        id: 1,
        card: {
          id: 1,
          type: 'MAJOR',
          suit: null,
          nameShort: 'ar00',
          name: 'The Fool',
          value: '0',
          intValue: 0,
          meaningUp: 'Folly...',
          meaningRev: 'Negligence...',
          description: 'With light step...',
        },
        position: 0,
        reversed: false,
      },
    ],
  },
];

describe('GET /api/reading/s', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns readings for authenticated user', async () => {
    mockRequireAuth.mockResolvedValue({ userId: mockUserId, tier: 'FREE' });
    (mockPrisma.reading.findMany as jest.Mock).mockResolvedValue(mockReadings);

    const request = createRequest({ Authorization: 'Bearer valid-token' });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(() => GetAllReadingsResponseSchema.parse(body)).not.toThrow();
    // Verify only user's readings are queried
    expect(mockPrisma.reading.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: mockUserId },
      })
    );
  });

  it('returns empty array when user has no readings', async () => {
    mockRequireAuth.mockResolvedValue({ userId: mockUserId, tier: 'FREE' });
    (mockPrisma.reading.findMany as jest.Mock).mockResolvedValue([]);

    const request = createRequest({ Authorization: 'Bearer valid-token' });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([]);
  });

  it('returns 401 when no JWT provided', async () => {
    const { AuthError } = await import('@/lib/errors');
    mockRequireAuth.mockRejectedValue(
      new AuthError('Full authentication is required to access this resource')
    );

    const request = createRequest();
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(() => ErrorResponseSchema.parse(body)).not.toThrow();
    expect(body.error).toBe('Unauthorized');
  });
});
