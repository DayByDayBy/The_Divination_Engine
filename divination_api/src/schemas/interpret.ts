import { z } from 'zod';
import { UserTierSchema } from './auth';

// Spread type enum
export const SpreadTypeSchema = z.enum(['THREE_CARD', 'CELTIC_CROSS', 'ONE_CARD', 'CUSTOM']);

// Card data for interpretation
export const InterpretationCardSchema = z.object({
  name: z.string(),
  reversed: z.boolean(),
  meaningUp: z.string(),
  meaningRev: z.string(),
  position: z.number(),
});

// Request schema
export const InterpretRequestSchema = z.object({
  readingId: z.number().positive().int(),
  userInput: z.string().min(1, 'User input is required'),
  cards: z.array(InterpretationCardSchema).min(1, 'At least one card is required'),
  spreadType: SpreadTypeSchema,
  userContext: z.string().optional(),
});

// Response schema
export const InterpretResponseSchema = z.object({
  readingId: z.number().positive().int(),
  interpretation: z.string(),
  timestamp: z.string().datetime(), // ISO datetime with timezone
  spreadType: SpreadTypeSchema,
  tier: UserTierSchema,
});

// Type exports
export type SpreadType = z.infer<typeof SpreadTypeSchema>;
export type InterpretationCard = z.infer<typeof InterpretationCardSchema>;
export type InterpretRequest = z.infer<typeof InterpretRequestSchema>;
export type InterpretResponse = z.infer<typeof InterpretResponseSchema>;
