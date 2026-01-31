import { ErrorResponse } from '@/schemas';

// Base error class
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly type: string;

  constructor(message: string, public readonly isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  // Convert error to standardized response format
  toResponse(path: string): ErrorResponse {
    return {
      timestamp: new Date().toISOString(),
      status: this.statusCode,
      error: this.type,
      message: this.message,
      path,
    };
  }
}

// Validation Error (400)
export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly type = 'Bad Request';

  constructor(message: string = 'Invalid request data') {
    super(message);
  }
}

// Authentication Errors
export class AuthError extends AppError {
  readonly statusCode = 401;
  readonly type = 'Unauthorized';

  constructor(message: string = 'Authentication required') {
    super(message);
  }
}

// Authorization Error (403)
export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly type = 'Forbidden';

  constructor(message: string = 'Access denied') {
    super(message);
  }
}

// Not Found Error (404)
export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly type = 'Not Found';

  constructor(resource: string = 'Resource') {
    super(`${resource} not found`);
  }
}

// Conflict Error (409)
export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly type = 'Conflict';

  constructor(message: string = 'Resource conflict') {
    super(message);
  }
}

// Rate Limit Error (429)
export class RateLimitError extends AppError {
  readonly statusCode = 429;
  readonly type = 'Too Many Requests';

  constructor(message: string = 'Rate limit exceeded') {
    super(message);
  }
}

// Internal Server Error (500)
export class InternalError extends AppError {
  readonly statusCode = 500;
  readonly type = 'Internal Server Error';

  constructor(message: string = 'An unexpected error occurred') {
    super(message);
  }
}

// Service-specific errors
export class DatabaseError extends InternalError {
  constructor(message: string = 'Database operation failed') {
    super(message);
  }
}

export class LlmError extends InternalError {
  constructor(message: string = 'LLM service unavailable') {
    super(message);
  }
}

export class ExternalServiceError extends InternalError {
  constructor(service: string, message: string = 'External service error') {
    super(`${service}: ${message}`);
  }
}

// Type guard to check if error is an AppError
export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};
