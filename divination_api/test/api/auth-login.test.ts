import { NextRequest } from 'next/server';

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock rate limit middleware
jest.mock('@/middleware/rate-limit-middleware', () => ({
  applyRateLimit: jest.fn().mockReturnValue({ response: null, headers: {} }),
}));

import { prisma } from '@/lib/db';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

function createLoginRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/login', () => {
  let POST: (request: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const mod = await import('@/app/api/auth/login/route');
    POST = mod.POST;
  });

  it('should return 401 (not 500) for non-existent user', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const request = createLoginRequest({
      email: 'nonexistent@example.com',
      password: 'somepassword123',
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.message).toContain('Invalid credentials');
  });
});
