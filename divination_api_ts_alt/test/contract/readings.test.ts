import { NextRequest } from 'next/server';
import {
  GetAllReadingsResponseSchema,
  GetReadingByIdResponseSchema,
  CreateReadingResponseSchema,
  ErrorResponseSchema,
} from '@/schemas';
import goldenFixtures from '../fixtures/golden-requests.json';

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    reading: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

// Mock auth middleware
jest.mock('@/middleware/auth', () => ({
  requireAuth: jest.fn(),
}));

import { prisma } from '@/lib/db';
import { requireAuth } from '@/middleware/auth';
import { GET as listReadings, POST as createReading } from '@/app/api/readings/route';
import { GET as getReading, DELETE as deleteReading } from '@/app/api/readings/[id]/route';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
const fixtures = goldenFixtures.endpoints.reading;

describe('Readings Contract Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({ userId: mockUserId, tier: 'FREE' });
  });

  // Golden fixtures use "2026-01-30T19:00:00" (no timezone) but Zod datetime() requires Z/offset.
  // Contract tests verify structure and status codes; mock data uses valid ISO timestamps.
  const isoTimestamp = '2026-01-30T19:00:00.000Z';

  describe('GET /api/reading/s - List Readings', () => {
    it('response format matches golden fixture', async () => {
      const goldenBody = fixtures.getAllReadings.response.body.map((r: any) => ({
        ...r,
        createdAt: isoTimestamp,
      }));
      (mockPrisma.reading.count as jest.Mock).mockResolvedValue(goldenBody.length);
      (mockPrisma.reading.findMany as jest.Mock).mockResolvedValue(goldenBody);

      const request = new NextRequest('http://localhost:3000/api/readings', {
        method: 'GET',
        headers: { Authorization: 'Bearer valid-token' },
      });
      const response = await listReadings(request);
      const body = await response.json();

      expect(response.status).toBe(fixtures.getAllReadings.response.status);
      // We expect the data to match the golden fixture body (which is an array)
      expect(body.data.length).toBe(goldenBody.length);
      expect(body.meta).toBeDefined();
      expect(() => GetAllReadingsResponseSchema.parse(body)).not.toThrow();
    });

    it('401 error format matches golden fixture', async () => {
      const { AuthError } = await import('@/lib/errors');
      mockRequireAuth.mockRejectedValue(
        new AuthError('Full authentication is required to access this resource')
      );

      const request = new NextRequest('http://localhost:3000/api/readings', { method: 'GET' });
      const response = await listReadings(request);
      const body = await response.json();

      const golden401 = fixtures.getAllReadings.errorResponses['401'];
      expect(response.status).toBe(golden401.status);
      expect(body.error).toBe(golden401.error);
      expect(body.message).toBe(golden401.message);
      expect(() => ErrorResponseSchema.parse(body)).not.toThrow();
    });
  });

  describe('GET /api/readings/{id} - Get Reading', () => {
    it('response format matches golden fixture', async () => {
      const goldenBody = {
        ...fixtures.getReadingById.response.body,
        userId: mockUserId,
        createdAt: isoTimestamp,
      };
      (mockPrisma.reading.findUnique as jest.Mock).mockResolvedValue(goldenBody);

      const request = new NextRequest('http://localhost:3000/api/readings/1', {
        method: 'GET',
        headers: { Authorization: 'Bearer valid-token' },
      });
      const response = await getReading(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      expect(response.status).toBe(fixtures.getReadingById.response.status);
      expect(() => GetReadingByIdResponseSchema.parse(body)).not.toThrow();
    });

    it('404 error format matches golden fixture', async () => {
      (mockPrisma.reading.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/readings/999', {
        method: 'GET',
        headers: { Authorization: 'Bearer valid-token' },
      });
      const response = await getReading(request, { params: Promise.resolve({ id: '999' }) });
      const body = await response.json();

      const golden404 = fixtures.getReadingById.errorResponses['404'];
      expect(response.status).toBe(golden404.status);
      expect(body.error).toBe(golden404.error);
      expect(body.message).toBe(golden404.message);
      expect(() => ErrorResponseSchema.parse(body)).not.toThrow();
    });

    it('403 error format matches golden fixture', async () => {
      const otherUserId = '660e8400-e29b-41d4-a716-446655440001';
      (mockPrisma.reading.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        userId: otherUserId,
        llmInterpretation: null,
        createdAt: '2026-01-30T19:00:00.000Z',
        cardReadings: [],
      });

      const request = new NextRequest('http://localhost:3000/api/readings/1', {
        method: 'GET',
        headers: { Authorization: 'Bearer valid-token' },
      });
      const response = await getReading(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      const golden403 = fixtures.getReadingById.errorResponses['403'];
      expect(response.status).toBe(golden403.status);
      expect(body.error).toBe(golden403.error);
      expect(body.message).toBe(golden403.message);
      expect(() => ErrorResponseSchema.parse(body)).not.toThrow();
    });
  });

  describe('POST /api/readings - Create Reading', () => {
    it('response format matches golden fixture', async () => {
      const goldenBody = {
        ...fixtures.createReading.response.body,
        userId: mockUserId,
        createdAt: isoTimestamp,
      };
      (mockPrisma.reading.create as jest.Mock).mockResolvedValue(goldenBody);

      const request = new NextRequest('http://localhost:3000/api/readings', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fixtures.createReading.request.body),
      });
      const response = await createReading(request);
      const body = await response.json();

      expect(response.status).toBe(fixtures.createReading.response.status);
      expect(() => CreateReadingResponseSchema.parse(body)).not.toThrow();
    });
  });

  describe('DELETE /api/reading/s/{id} - Delete Reading', () => {
    it('returns 204 matching golden fixture', async () => {
      (mockPrisma.reading.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        userId: mockUserId,
      });
      (mockPrisma.reading.delete as jest.Mock).mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/readings/1', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer valid-token' },
      });
      const response = await deleteReading(request, { params: Promise.resolve({ id: '1' }) });

      expect(response.status).toBe(fixtures.deleteReading.response.status);
    });

    it('404 error format matches golden fixture', async () => {
      (mockPrisma.reading.findUnique as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/readings/999', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer valid-token' },
      });
      const response = await deleteReading(request, { params: Promise.resolve({ id: '999' }) });
      const body = await response.json();

      const golden404 = fixtures.deleteReading.errorResponses['404'];
      expect(response.status).toBe(golden404.status);
      expect(body.error).toBe(golden404.error);
      expect(body.message).toBe(golden404.message);
      expect(() => ErrorResponseSchema.parse(body)).not.toThrow();
    });
  });
});
