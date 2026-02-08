import { CreateReadingRequestSchema } from '@/schemas';

describe('CreateReadingRequestSchema', () => {
  it('accepts position 0 (0-indexed)', () => {
    const request = {
      cardReadings: [
        { card: { id: 1 }, position: 0, reversed: false },
      ],
    };

    expect(() => CreateReadingRequestSchema.parse(request)).not.toThrow();
  });

  it('accepts position 77 (max for 78 cards, 0-indexed)', () => {
    const request = {
      cardReadings: [
        { card: { id: 1 }, position: 77, reversed: true },
      ],
    };

    expect(() => CreateReadingRequestSchema.parse(request)).not.toThrow();
  });

  it('rejects position -1 (below minimum)', () => {
    const request = {
      cardReadings: [
        { card: { id: 1 }, position: -1, reversed: false },
      ],
    };

    expect(() => CreateReadingRequestSchema.parse(request)).toThrow();
  });

  it('rejects position 78 (above maximum)', () => {
    const request = {
      cardReadings: [
        { card: { id: 1 }, position: 78, reversed: false },
      ],
    };

    expect(() => CreateReadingRequestSchema.parse(request)).toThrow();
  });
});
