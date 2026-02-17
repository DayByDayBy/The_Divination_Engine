import { NextRequest } from 'next/server';

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}));

import { prisma } from '@/lib/db';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

function createHealthRequest(): NextRequest {
  return new NextRequest('http://localhost:3000/api/health', {
    method: 'GET',
  });
}

describe('GET /api/health', () => {
  let GET: (request: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await import('@/app/api/health/route');
    GET = mod.GET;
  });

  it('should return 200 with status ok when DB connected', async () => {
    (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);

    const request = createHealthRequest();
    const response = await GET(request);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.status).toBe('ok');
    expect(json.timestamp).toBeDefined();
    expect(mockPrisma.$queryRaw).toHaveBeenCalled();
  });

  it('should return 503 when DB unreachable', async () => {
    (mockPrisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Connection failed'));

    const request = createHealthRequest();
    const response = await GET(request);

    expect(response.status).toBe(503);
    const json = await response.json();
    expect(json.status).toBe('error');
  });
});
