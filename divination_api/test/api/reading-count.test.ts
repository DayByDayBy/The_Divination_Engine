import { GET } from '@/app/api/reading/[count]/route';
import { NextRequest } from 'next/server';
import { GetRandomCardsResponseSchema, ErrorResponseSchema } from '@/schemas';

// Mock the card service
jest.mock('@/services/card-service', () => ({
  selectRandomCards: jest.fn(),
}));

import { selectRandomCards } from '@/services/card-service';

const mockSelectRandomCards = selectRandomCards as jest.MockedFunction<typeof selectRandomCards>;

function createRequest(count: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/reading/${count}`, {
    method: 'GET',
  });
}

const mockCards = [
  {
    id: 22,
    type: 'MAJOR',
    suit: null,
    nameShort: 'ar21',
    name: 'The World',
    value: '21',
    intValue: 21,
    meaningUp: 'Assured success, recompense, voyage, route, emigration, flight, change of place.',
    meaningRev: 'Inertia, fixity, stagnation, permanence.',
    description: 'As this final message of the Major Trumps...',
  },
  {
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
  },
  {
    id: 45,
    type: 'MINOR',
    suit: 'SWORDS',
    nameShort: 'sw06',
    name: 'Six of Swords',
    value: '6',
    intValue: 6,
    meaningUp: 'Journey by water, route, way, envoy...',
    meaningRev: 'Declaration, confession, publicity...',
    description: 'A ferryman carrying passengers...',
  },
];

describe('GET /api/reading/[count]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns N random cards for valid count', async () => {
    mockSelectRandomCards.mockResolvedValue(mockCards as any);

    const request = createRequest('3');
    const response = await GET(request, { params: Promise.resolve({ count: '3' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toHaveLength(3);
    expect(() => GetRandomCardsResponseSchema.parse(body)).not.toThrow();
    expect(mockSelectRandomCards).toHaveBeenCalledWith(3);
  });

  it('returns 400 for count > 78', async () => {
    const request = createRequest('79');
    const response = await GET(request, { params: Promise.resolve({ count: '79' }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(() => ErrorResponseSchema.parse(body)).not.toThrow();
  });

  it('returns 400 for count = 0', async () => {
    const request = createRequest('0');
    const response = await GET(request, { params: Promise.resolve({ count: '0' }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(() => ErrorResponseSchema.parse(body)).not.toThrow();
  });

  it('returns 400 for negative count', async () => {
    const request = createRequest('-1');
    const response = await GET(request, { params: Promise.resolve({ count: '-1' }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(() => ErrorResponseSchema.parse(body)).not.toThrow();
  });

  it('returns 400 for non-numeric count', async () => {
    const request = createRequest('abc');
    const response = await GET(request, { params: Promise.resolve({ count: 'abc' }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(() => ErrorResponseSchema.parse(body)).not.toThrow();
  });
});
