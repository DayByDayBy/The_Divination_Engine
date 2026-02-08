import { NextRequest } from 'next/server';
import { GetReadingByIdResponseSchema, ErrorResponseSchema } from '@/schemas';

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    reading: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock auth middleware
jest.mock('@/middleware/auth', () => ({
  requireAuth: jest.fn(),
}));

import { prisma } from '@/lib/db';
import { requireAuth } from '@/middleware/auth';
import { GET } from '@/app/api/readings/[id]/route';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
const otherUserId = '660e8400-e29b-41d4-a716-446655440001';

function createRequest(id: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(`http://localhost:3000/api/readings/${id}`, {
    method: 'GET',
    headers,
  });
}

const mockReading = {
  id: 1,
  userId: mockUserId,
  llmInterpretation: 'The cards suggest...',
  createdAt: '2026-01-30T19:00:00.000Z',
  cardReadings: [],
};

describe('GET /api/reading/s/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns reading for authenticated owner', async () => {
    mockRequireAuth.mockResolvedValue({ userId: mockUserId, tier: 'FREE' });
    (mockPrisma.reading.findUnique as jest.Mock).mockResolvedValue(mockReading);

    const request = createRequest('1', { Authorization: 'Bearer valid-token' });
    const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(() => GetReadingByIdResponseSchema.parse(body)).not.toThrow();
    expect(body.id).toBe(1);
  });

  it('returns 403 for reading owned by another user', async () => {
    mockRequireAuth.mockResolvedValue({ userId: otherUserId, tier: 'FREE' });
    (mockPrisma.reading.findUnique as jest.Mock).mockResolvedValue(mockReading);

    const request = createRequest('1', { Authorization: 'Bearer valid-token' });
    const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(() => ErrorResponseSchema.parse(body)).not.toThrow();
    expect(body.error).toBe('Forbidden');
    expect(body.message).toBe('Access denied to reading');
  });

  it('returns 404 for non-existent reading', async () => {
    mockRequireAuth.mockResolvedValue({ userId: mockUserId, tier: 'FREE' });
    (mockPrisma.reading.findUnique as jest.Mock).mockResolvedValue(null);

    const request = createRequest('999', { Authorization: 'Bearer valid-token' });
    const response = await GET(request, { params: Promise.resolve({ id: '999' }) });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(() => ErrorResponseSchema.parse(body)).not.toThrow();
    expect(body.error).toBe('Not Found');
    expect(body.message).toContain("Reading not found with id : '999'");
  });

  it('returns 401 when no JWT provided', async () => {
    const { AuthError } = await import('@/lib/errors');
    mockRequireAuth.mockRejectedValue(
      new AuthError('Full authentication is required to access this resource')
    );

    const request = createRequest('1');
    const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(() => ErrorResponseSchema.parse(body)).not.toThrow();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 for invalid ID', async () => {
    mockRequireAuth.mockResolvedValue({ userId: mockUserId, tier: 'FREE' });

    const request = createRequest('abc', { Authorization: 'Bearer valid-token' });
    const response = await GET(request, { params: Promise.resolve({ id: 'abc' }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(() => ErrorResponseSchema.parse(body)).not.toThrow();
  });
});
