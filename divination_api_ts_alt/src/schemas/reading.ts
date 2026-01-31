import { z } from 'zod';
import { CardSchema } from './card';

// Card in reading schema
export const CardInReadingSchema = z.object({
  id: z.number(),
  card: CardSchema,
  position: z.number(),
  reversed: z.boolean(),
});

// Reading schema
export const ReadingSchema = z.object({
  id: z.number(),
  userId: z.string().uuid(),
  llmInterpretation: z.string().nullable(),
  createdAt: z.string().datetime(), // ISO datetime string
  cardReadings: z.array(CardInReadingSchema),
});

// Request schemas
export const CreateReadingRequestSchema = z.object({
  cardReadings: z.array(
    z.object({
      card: z.object({
        id: z.number(),
      }),
      position: z.number(),
      reversed: z.boolean(),
    })
  ).min(1).max(78), // At least 1 card, max 78 cards
});

export const GetReadingByIdRequestSchema = z.object({
  id: z.coerce.number().positive().int(),
});

// Response schemas
export const GetAllReadingsResponseSchema = z.array(ReadingSchema);
export const GetReadingByIdResponseSchema = ReadingSchema;
export const CreateReadingResponseSchema = ReadingSchema;

// Delete response is empty (204)
export const DeleteReadingResponseSchema = z.null();

// Type exports
export type CardInReading = z.infer<typeof CardInReadingSchema>;
export type Reading = z.infer<typeof ReadingSchema>;
export type CreateReadingRequest = z.infer<typeof CreateReadingRequestSchema>;
export type GetReadingByIdRequest = z.infer<typeof GetReadingByIdRequestSchema>;
export type GetAllReadingsResponse = z.infer<typeof GetAllReadingsResponseSchema>;
export type GetReadingByIdResponse = z.infer<typeof GetReadingByIdResponseSchema>;
export type CreateReadingResponse = z.infer<typeof CreateReadingResponseSchema>;
export type DeleteReadingResponse = z.infer<typeof DeleteReadingResponseSchema>;
