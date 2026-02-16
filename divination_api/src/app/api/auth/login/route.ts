import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signJwt } from '@/lib/jwt';
import { validate } from '@/lib/validation';
import { LoginRequestSchema, AuthResponse } from '@/schemas';
import { handleError } from '@/middleware/error-handler';
import { AuthError } from '@/lib/errors';
import { applyRateLimit } from '@/middleware/rate-limit-middleware';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (IP-based for login)
    const rateLimitResult = applyRateLimit(request, {
      pathname: request.nextUrl.pathname,
    });
    
    if (rateLimitResult.response) {
      return rateLimitResult.response;
    }

    const body = await request.json();
    
    // Validate request body
    const { email, password } = validate(LoginRequestSchema, body);

    // Look up user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Perform dummy bcrypt compare to prevent timing attacks
      // Use a pre-computed hash of a fake password
      const fakeHash = '$2a$12$Z35RjQXF6qik0kNKpCG1U.IKAdy2v3Ybnv90azQ20JIImyhTjOEFK';
      await compare(password, fakeHash);
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

    const jsonResponse = NextResponse.json(response, { status: 200 });
    
    // Add rate limit headers
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      jsonResponse.headers.set(key, value);
    });

    return jsonResponse;
  } catch (error) {
    return handleError(error, request);
  }
}
