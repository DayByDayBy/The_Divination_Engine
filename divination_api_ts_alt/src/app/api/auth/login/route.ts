import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signJwt } from '@/lib/jwt';
import { validate } from '@/lib/validation';
import { LoginRequestSchema, AuthResponse } from '@/schemas';
import { handleError } from '@/middleware/error-handler';
import { AuthError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const { email, password } = validate(LoginRequestSchema, body);

    // Look up user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AuthError('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      throw new AuthError('Invalid credentials');
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
