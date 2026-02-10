import { NextRequest } from 'next/server';
import { POST as interpretPost } from '@/app/api/tarot/interpret/route';
import { POST as readingPost } from '@/app/api/readings/route';
import { POST as registerPost } from '@/app/api/auth/register/route';
import { POST as loginPost } from '@/app/api/auth/login/route';
import { prisma } from '@/lib/db';
import { signJwt } from '@/lib/jwt';
import { UserTier } from '@/schemas/auth';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  prisma: {
    reading: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    card: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/services/llm/openai-provider', () => ({
  OpenAiProvider: jest.fn().mockImplementation(() => ({
    generateInterpretation: jest.fn().mockResolvedValue('Test interpretation'),
  })),
}));

jest.mock('@/services/llm/prompt-builder', () => ({
  buildPrompt: jest.fn().mockReturnValue('Test prompt'),
}));

jest.mock('@/lib/jwt', () => ({
  signJwt: jest.fn().mockReturnValue('mock-jwt-token'),
  verifyJwt: jest.fn().mockImplementation((token) => {
    if (token === 'valid-user-token') {
      return Promise.resolve({
        sub: '550e8400-e29b-41d4-a716-446655440000',
        tier: 'FREE',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 86400,
      });
    }
    if (token === 'valid-other-token') {
      return Promise.resolve({
        sub: '660e8400-e29b-41d4-a716-446655440001',
        tier: 'FREE',
        iat: Date.now() / 1000,
        exp: Date.now() / 1000 + 86400,
      });
    }
    throw new Error('Invalid token');
  }),
  extractTokenFromHeader: jest.fn((header) => {
    if (header === 'Bearer valid-user-token') return 'valid-user-token';
    if (header === 'Bearer valid-other-token') return 'valid-other-token';
    return null;
  }),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('Security Fixes Tests', () => {
  let userToken: string;
  let otherUserToken: string;
  let mockReading: any;
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock users
    mockUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      tier: 'FREE' as UserTier,
    };

    const otherUser = {
      id: '660e8400-e29b-41d4-a716-446655440001',
      email: 'other@example.com',
      tier: 'FREE' as UserTier,
    };

    userToken = 'Bearer valid-user-token';
    otherUserToken = 'Bearer valid-other-token';

    // Mock reading
    mockReading = {
      id: 1,
      userId: mockUser.id,
      llmInterpretation: null,
      createdAt: new Date().toISOString(),
      cardReadings: [],
    };
  });

  describe('Interpret Endpoint Ownership Check', () => {
    it('should allow user to update their own reading interpretation', async () => {
      const request = new NextRequest('http://localhost/api/tarot/interpret', {
        method: 'POST',
        headers: {
          'Authorization': userToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          readingId: 1,
          userInput: 'What does this mean?',
          cards: [{ name: 'The Fool', reversed: false, meaningUp: 'New beginnings', meaningRev: 'Recklessness', position: 0 }],
          spreadType: 'THREE_CARD',
        }),
      });

      (prisma.reading.findUnique as jest.Mock).mockResolvedValue(mockReading);
      (prisma.reading.update as jest.Mock).mockResolvedValue({ ...mockReading, llmInterpretation: 'Test interpretation' });

      const response = await interpretPost(request);
      expect(response.status).toBe(200);
    });

    it('should reject access to another user\'s reading', async () => {
      const request = new NextRequest('http://localhost/api/tarot/interpret', {
        method: 'POST',
        headers: {
          'Authorization': otherUserToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          readingId: 1,
          userInput: 'What does this mean?',
          cards: [{ name: 'The Fool', reversed: false, meaningUp: 'New beginnings', meaningRev: 'Recklessness', position: 0 }],
          spreadType: 'THREE_CARD',
        }),
      });

      (prisma.reading.findUnique as jest.Mock).mockResolvedValue(mockReading);

      const response = await interpretPost(request);
      expect(response.status).toBe(403);
      
      const body = await response.json();
      expect(body.error).toBe('Forbidden');
      expect(body.message).toBe('Access denied to reading');
    });

    it('should return 404 for non-existent reading', async () => {
      const request = new NextRequest('http://localhost/api/tarot/interpret', {
        method: 'POST',
        headers: {
          'Authorization': userToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          readingId: 999,
          userInput: 'What does this mean?',
          cards: [{ name: 'The Fool', reversed: false, meaningUp: 'New beginnings', meaningRev: 'Recklessness', position: 0 }],
          spreadType: 'THREE_CARD',
        }),
      });

      (prisma.reading.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await interpretPost(request);
      expect(response.status).toBe(404);
      
      const body = await response.json();
      expect(body.error).toBe('Not Found');
    });
  });

  describe('Reading Creation Validation', () => {
    it('should reject non-sequential positions', async () => {
      const request = new NextRequest('http://localhost:3000/api/readings', {
        method: 'POST',
        headers: {
          'Authorization': userToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardReadings: [
            { card: { id: 1 }, position: 0, reversed: false },
            { card: { id: 2 }, position: 2, reversed: true }, // Missing position 1
          ],
        }),
      });

      const response = await readingPost(request);
      expect(response.status).toBe(400);
      
      const body = await response.json();
      expect(body.message).toContain('Positions must be sequential');
    });

    it('should reject duplicate card IDs', async () => {
      const request = new NextRequest('http://localhost:3000/api/readings', {
        method: 'POST',
        headers: {
          'Authorization': userToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardReadings: [
            { card: { id: 1 }, position: 0, reversed: false },
            { card: { id: 1 }, position: 1, reversed: true }, // Duplicate card ID
          ],
        }),
      });

      const response = await readingPost(request);
      expect(response.status).toBe(400);
      
      const body = await response.json();
      expect(body.message).toContain('Duplicate card IDs');
    });

    it('should reject invalid card IDs (outside 1-78 range)', async () => {
      const request = new NextRequest('http://localhost:3000/api/readings', {
        method: 'POST',
        headers: {
          'Authorization': userToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardReadings: [
            { card: { id: 0 }, position: 0, reversed: false }, // Invalid ID (too low)
          ],
        }),
      });

      const response = await readingPost(request);
      expect(response.status).toBe(400);
    });

    it('should accept valid reading request', async () => {
      const request = new NextRequest('http://localhost:3000/api/readings', {
        method: 'POST',
        headers: {
          'Authorization': userToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardReadings: [
            { card: { id: 1 }, position: 0, reversed: false },
            { card: { id: 2 }, position: 1, reversed: true },
          ],
        }),
      });

      (prisma.reading.create as jest.Mock).mockResolvedValue(mockReading);

      const response = await readingPost(request);
      expect(response.status).toBe(201);
    });
  });

  describe('Rate Limiting Headers', () => {
    it('should include rate limit headers on successful requests', async () => {
      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'SecurePassword123!',
        }),
      });

      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const response = await registerPost(request);
      expect(response.status).toBe(201);
      
      expect(response.headers.get('X-RateLimit-Limit')).toBe('3');
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
    });

    it('should include rate limit headers on interpret requests', async () => {
      const request = new NextRequest('http://localhost/api/tarot/interpret', {
        method: 'POST',
        headers: {
          'Authorization': userToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          readingId: 1,
          userInput: 'What does this mean?',
          cards: [{ name: 'The Fool', reversed: false, meaningUp: 'New beginnings', meaningRev: 'Recklessness', position: 0 }],
          spreadType: 'THREE_CARD',
        }),
      });

      (prisma.reading.findUnique as jest.Mock).mockResolvedValue(mockReading);
      (prisma.reading.update as jest.Mock).mockResolvedValue({ ...mockReading, llmInterpretation: 'Test interpretation' });

      const response = await interpretPost(request);
      expect(response.status).toBe(200);
      
      expect(response.headers.get('X-RateLimit-Limit')).toBe('10'); // FREE tier limit
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
    });
  });

  describe('Register Endpoint Status Code', () => {
    it('should return 201 status code on successful registration', async () => {
      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'SecurePassword123!',
        }),
      });

      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const response = await registerPost(request);
      expect(response.status).toBe(201);
    });
  });
});
