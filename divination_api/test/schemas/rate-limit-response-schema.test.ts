import { RateLimitErrorResponseSchema } from '@/schemas';

describe('RateLimitErrorResponseSchema', () => {
  it('accepts valid rate limit error response bodies', () => {
    const body = {
      timestamp: '2026-01-30T19:00:00.000Z',
      status: 429,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Try again in 45 seconds.',
      path: '/api/tarot/interpret',
    };

    expect(RateLimitErrorResponseSchema.parse(body)).toEqual(body);
  });

  it('rejects non-429 status codes', () => {
    const body = {
      timestamp: '2026-01-30T19:00:00.000Z',
      status: 400,
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Try again later.',
      path: '/api/tarot/interpret',
    };

    expect(() => RateLimitErrorResponseSchema.parse(body)).toThrow();
  });

  it('rejects non "Too Many Requests" error types', () => {
    const body = {
      timestamp: '2026-01-30T19:00:00.000Z',
      status: 429,
      error: 'Bad Request',
      message: 'Rate limit exceeded. Try again later.',
      path: '/api/tarot/interpret',
    };

    expect(() => RateLimitErrorResponseSchema.parse(body)).toThrow();
  });
});
