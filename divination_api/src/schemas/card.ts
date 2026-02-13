import { z } from 'zod';

// Card type enum
export const CardTypeSchema = z.enum(['MAJOR', 'MINOR']);

// Suit enum (null for Major Arcana)
export const SuitSchema = z.string().nullable();

// Full card schema
export const CardSchema = z.object({
  id: z.number(),
  type: CardTypeSchema,
  suit: SuitSchema,
  nameShort: z.string(),
  name: z.string(),
  value: z.string(),
  intValue: z.number(),
  meaningUp: z.string(),
  meaningRev: z.string(),
  description: z.string().nullable(),
});

// Response schemas
export const GetAllCardsResponseSchema = z.array(CardSchema);
export const GetCardByIdResponseSchema = CardSchema;

// Request schemas (path params)
export const GetCardByIdRequestSchema = z.object({
  id: z.coerce.number().positive().int(),
});

export const GetRandomCardsRequestSchema = z.object({
  count: z.coerce.number().positive().int().max(78), // Max 78 cards in deck
});

// Response schema for random cards
export const GetRandomCardsResponseSchema = z.array(CardSchema);

// Type exports
export type Card = z.infer<typeof CardSchema>;
export type CardType = z.infer<typeof CardTypeSchema>;
export type Suit = z.infer<typeof SuitSchema>;
export type GetAllCardsResponse = z.infer<typeof GetAllCardsResponseSchema>;
export type GetCardByIdResponse = z.infer<typeof GetCardByIdResponseSchema>;
export type GetRandomCardsResponse = z.infer<typeof GetRandomCardsResponseSchema>;
