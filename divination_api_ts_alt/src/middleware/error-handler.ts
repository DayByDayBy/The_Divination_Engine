import { NextRequest, NextResponse } from 'next/server';
import { isAppError, AppError } from '@/lib/errors';
import { ErrorResponse } from '@/schemas';

// Global error handler for API routes
export function handleError(error: unknown, request: NextRequest): NextResponse {
  // Log the error for debugging
  console.error('Error occurred:', {
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    url: request.url,
    method: request.method,
  });

  // If it's our custom AppError, use its structured response
  if (isAppError(error)) {
    const errorResponse: ErrorResponse = error.toResponse(request.nextUrl.pathname);
    return NextResponse.json(errorResponse, { status: error.statusCode });
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: any };
    
    switch (prismaError.code) {
      case 'P2002':
        // Unique constraint violation
        const target = prismaError.meta?.target as string[] | undefined;
        const field = target?.[0] || 'resource';
        const conflictError: ErrorResponse = {
          timestamp: new Date().toISOString(),
          status: 409,
          error: 'Conflict',
          message: `${field} already exists`,
          path: request.nextUrl.pathname,
        };
        return NextResponse.json(conflictError, { status: 409 });

      case 'P2025':
        // Record not found
        const notFoundError: ErrorResponse = {
          timestamp: new Date().toISOString(),
          status: 404,
          error: 'Not Found',
          message: 'Record not found',
          path: request.nextUrl.pathname,
        };
        return NextResponse.json(notFoundError, { status: 404 });

      default:
        // Other Prisma errors
        const dbError: ErrorResponse = {
          timestamp: new Date().toISOString(),
          status: 500,
          error: 'Internal Server Error',
          message: 'Database operation failed',
          path: request.nextUrl.pathname,
        };
        return NextResponse.json(dbError, { status: 500 });
    }
  }

  // Handle JWT errors specifically
  if (error && typeof error === 'object' && 'code' in error) {
    const jwtError = error as { code: string };
    
    if (jwtError.code === 'ERR_JWT_EXPIRED') {
      const expiredError: ErrorResponse = {
        timestamp: new Date().toISOString(),
        status: 401,
        error: 'Unauthorized',
        message: 'Token has expired',
        path: request.nextUrl.pathname,
      };
      return NextResponse.json(expiredError, { status: 401 });
    }

    if (jwtError.code === 'ERR_JWT_INVALID' || jwtError.code === 'ERR_JWT_SIGNATURE_VERIFICATION_FAILED') {
      const invalidError: ErrorResponse = {
        timestamp: new Date().toISOString(),
        status: 401,
        error: 'Unauthorized',
        message: 'Invalid token',
        path: request.nextUrl.pathname,
      };
      return NextResponse.json(invalidError, { status: 401 });
    }
  }

  // For any other error, return a generic internal server error
  // Don't leak error details in production
  const genericError: ErrorResponse = {
    timestamp: new Date().toISOString(),
    status: 500,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    path: request.nextUrl.pathname,
  };

  return NextResponse.json(genericError, { status: 500 });
}

// Wrapper for API route handlers to provide consistent error handling
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      // The request is always the first argument in Next.js API routes
      const request = args[0] as NextRequest;
      return handleError(error, request);
    }
  };
}
