import { InterpretRequestSchema, InterpretResponseSchema } from '@/schemas';
import goldenFixtures from '../fixtures/golden-requests.json';

const fixtures = goldenFixtures.endpoints.interpret.interpret;

describe('InterpretRequestSchema', () => {
  it('validates golden fixture request body', () => {
    const result = InterpretRequestSchema.safeParse(fixtures.request.body);
    expect(result.success).toBe(true);
  });

  it('requires spreadType enum: THREE_CARD, CELTIC_CROSS, ONE_CARD, CUSTOM', () => {
    const base = {
      readingId: 1,
      userInput: 'test',
      cards: [{ name: 'The Fool', reversed: false, meaningUp: 'a', meaningRev: 'b', position: 0 }],
      userContext: 'context',
    };

    for (const st of ['THREE_CARD', 'CELTIC_CROSS', 'ONE_CARD', 'CUSTOM']) {
      expect(InterpretRequestSchema.safeParse({ ...base, spreadType: st }).success).toBe(true);
    }

    expect(InterpretRequestSchema.safeParse({ ...base, spreadType: 'INVALID' }).success).toBe(false);
  });

  it('requires userInput as non-empty string', () => {
    const base = {
      readingId: 1,
      cards: [{ name: 'The Fool', reversed: false, meaningUp: 'a', meaningRev: 'b', position: 0 }],
      spreadType: 'THREE_CARD',
    };

    expect(InterpretRequestSchema.safeParse({ ...base, userInput: '' }).success).toBe(false);
    expect(InterpretRequestSchema.safeParse({ ...base }).success).toBe(false);
    expect(InterpretRequestSchema.safeParse({ ...base, userInput: 'question' }).success).toBe(true);
  });

  it('accepts optional userContext', () => {
    const base = {
      readingId: 1,
      userInput: 'test',
      cards: [{ name: 'The Fool', reversed: false, meaningUp: 'a', meaningRev: 'b', position: 0 }],
      spreadType: 'THREE_CARD',
    };

    expect(InterpretRequestSchema.safeParse(base).success).toBe(true);
    expect(InterpretRequestSchema.safeParse({ ...base, userContext: 'context' }).success).toBe(true);
  });

  it('requires cards array with name, reversed, meaningUp, meaningRev, position', () => {
    const base = {
      readingId: 1,
      userInput: 'test',
      spreadType: 'THREE_CARD',
    };

    // Empty array fails
    expect(InterpretRequestSchema.safeParse({ ...base, cards: [] }).success).toBe(false);

    // Missing fields fails
    expect(InterpretRequestSchema.safeParse({
      ...base,
      cards: [{ name: 'The Fool' }],
    }).success).toBe(false);

    // Valid card passes
    expect(InterpretRequestSchema.safeParse({
      ...base,
      cards: [{ name: 'The Fool', reversed: false, meaningUp: 'a', meaningRev: 'b', position: 0 }],
    }).success).toBe(true);
  });

  it('requires readingId as positive integer (matches golden fixture)', () => {
    const base = {
      userInput: 'test',
      cards: [{ name: 'The Fool', reversed: false, meaningUp: 'a', meaningRev: 'b', position: 0 }],
      spreadType: 'THREE_CARD',
    };

    expect(InterpretRequestSchema.safeParse({ ...base, readingId: 1 }).success).toBe(true);
    expect(InterpretRequestSchema.safeParse({ ...base, readingId: -1 }).success).toBe(false);
    expect(InterpretRequestSchema.safeParse({ ...base, readingId: 0 }).success).toBe(false);
    expect(InterpretRequestSchema.safeParse(base).success).toBe(false);
  });
});

describe('InterpretResponseSchema', () => {
  it('validates golden fixture response body', () => {
    const result = InterpretResponseSchema.safeParse(fixtures.response.body);
    expect(result.success).toBe(true);
  });
});
