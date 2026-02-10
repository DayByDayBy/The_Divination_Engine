import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from './errors';

// Validate data against a Zod schema
export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      // Format Zod error messages to be more user-friendly
      const message = error.errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      throw new ValidationError(`Validation failed: ${message}`);
    }
    throw new ValidationError('Invalid data provided');
  }
}

// Validate request query parameters
export function validateQuery<T>(schema: ZodSchema<T>, searchParams: URLSearchParams): T {
  const params: Record<string, string | string[]> = {};
  
  searchParams.forEach((value, key) => {
    // Handle multiple values for the same key
    if (params[key]) {
      if (Array.isArray(params[key])) {
        params[key].push(value);
      } else {
        params[key] = [params[key] as string, value];
      }
    } else {
      params[key] = value;
    }
  });

  return validate(schema, params);
}

// Validate path parameters (e.g., /api/cards/[id])
export function validateParams<T>(schema: ZodSchema<T>, params: Record<string, string>): T {
  return validate(schema, params);
}

// Optional validation - returns null if data is null/undefined
export function validateOptional<T>(schema: ZodSchema<T>, data: unknown): T | null {
  if (data === null || data === undefined) {
    return null;
  }
  return validate(schema, data);
}
