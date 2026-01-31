import { z } from 'zod';

// Standard error response format (matches Spring Boot)
export const ErrorResponseSchema = z.object({
  timestamp: z.string().datetime(), // ISO datetime
  status: z.number(), // HTTP status code
  error: z.string(), // Error type (e.g., "Not Found", "Unauthorized")
  message: z.string(), // Human-readable error message
  path: z.string(), // Request path
});

// Success response wrapper
export const SuccessResponseSchema = z.object({
  data: z.unknown(),
  message: z.string().optional(),
});

// Pagination parameters
export const PaginationParamsSchema = z.object({
  page: z.coerce.number().positive().int().default(1),
  limit: z.coerce.number().positive().int().max(100).default(20),
  offset: z.coerce.number().int().min(0).optional(),
});

// Pagination metadata
export const PaginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

// Paginated response
export const PaginatedResponseSchema = z.object({
  data: z.array(z.unknown()),
  meta: PaginationMetaSchema,
});

// Type exports
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
export type PaginatedResponse = z.infer<typeof PaginatedResponseSchema>;
