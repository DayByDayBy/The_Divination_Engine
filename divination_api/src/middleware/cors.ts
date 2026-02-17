import { NextRequest, NextResponse } from 'next/server';

export function applyCors(request: NextRequest, response: NextResponse): NextResponse {
  const allowedOrigins = process.env.ALLOWED_ORIGINS || '';
  const origin = request.headers.get('origin') || '';

  // Allow all origins if ALLOWED_ORIGINS is *
  if (allowedOrigins === '*') {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
  }

  // Parse allowed origins
  const allowedList = allowedOrigins.split(',').map(o => o.trim()).filter(Boolean);

  // Check if origin is allowed
  if (origin && allowedList.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  return response;
}
