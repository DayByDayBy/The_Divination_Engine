import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signJwt } from '@/lib/jwt';
import { validate } from '@/lib/validation';
import { RegisterRequestSchema, AuthResponse } from '@/schemas';
import { handleError } from '@/middleware/error-handler';
import { ConflictError } from '@/lib/errors';
import { applyRateLimit } from '@/middleware/rate-limit-middleware';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (IP-based for register)
    const rateLimitResult = applyRateLimit(request, {
      pathname: request.nextUrl.pathname,
    });
    
    if (rateLimitResult.response) {
      return rateLimitResult.response;
    }

    const body = await request.json();
    
    // Validate request body
    const { email, password } = validate(RegisterRequestSchema, body);

    // Hash password with bcrypt (cost 12)
    const passwordHash = await hash(password, 12);

    // Create user in database
    let user;
    try {
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          tier: 'FREE', // Default tier
        },
      });
    } catch (error) {
      // Handle Prisma unique constraint violation
      if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as { code: string };
        if (prismaError.code === 'P2002') {
          throw new ConflictError('User already exists');
        }
      }
      throw error;
    }

    // Generate JWT
    const token = await signJwt(user.id, user.tier);

    // Return auth response
    const response: AuthResponse = {
      token,
      type: 'Bearer',
      email: user.email,
      tier: user.tier,
    };

    const jsonResponse = NextResponse.json(response, { status: 201 });
    
    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      jsonResponse.headers.set(key, value);
    });

    return jsonResponse;
  } catch (error) {
    return handleError(error, request);
  }
}
