import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signJwt } from '@/lib/jwt';
import { validate } from '@/lib/validation';
import { RegisterRequestSchema, AuthResponse } from '@/schemas';
import { handleError } from '@/middleware/error-handler';
import { ConflictError, ValidationError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
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

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return handleError(error, request);
  }
}
