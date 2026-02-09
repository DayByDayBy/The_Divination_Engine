import { GET } from '@/app/api/cards/[id]/route';
import { NextRequest } from 'next/server';
import { GetCardByIdResponseSchema, ErrorResponseSchema } from '@/schemas';

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    card: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/db';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

function createRequest(id: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/cards/${id}`, {
    method: 'GET',
  });
}

describe('GET /api/cards/[id]', () => {
  const mockCard = {
    id: 1,
    type: 'MAJOR',
    suit: null,
    nameShort: 'ar00',
    name: 'The Fool',
    value: '0',
    intValue: 0,
    meaningUp: 'Folly, mania, extravagance...',
    meaningRev: 'Negligence, absence, distribution...',
    description: 'With light step...',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns card for valid ID', async () => {
    (mockPrisma.card.findUnique as jest.Mock).mockResolvedValue(mockCard);

    const request = createRequest('1');
    const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(() => GetCardByIdResponseSchema.parse(body)).not.toThrow();
    expect(body.id).toBe(1);
    expect(body.name).toBe('The Fool');
  });

  it('returns 404 for non-existent card', async () => {
    (mockPrisma.card.findUnique as jest.Mock).mockResolvedValue(null);

    const request = createRequest('999');
    const response = await GET(request, { params: Promise.resolve({ id: '999' }) });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(() => ErrorResponseSchema.parse(body)).not.toThrow();
    expect(body.error).toBe('Not Found');
    expect(body.message).toContain("Card not found with id: '999'");
  });

  it('returns 400 for invalid ID (non-numeric)', async () => {
    const request = createRequest('abc');
    const response = await GET(request, { params: Promise.resolve({ id: 'abc' }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(() => ErrorResponseSchema.parse(body)).not.toThrow();
  });

  it('returns 400 for invalid ID (zero)', async () => {
    const request = createRequest('0');
    const response = await GET(request, { params: Promise.resolve({ id: '0' }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(() => ErrorResponseSchema.parse(body)).not.toThrow();
  });

  it('returns 400 for invalid ID (negative)', async () => {
    const request = createRequest('-1');
    const response = await GET(request, { params: Promise.resolve({ id: '-1' }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(() => ErrorResponseSchema.parse(body)).not.toThrow();
  });
});
