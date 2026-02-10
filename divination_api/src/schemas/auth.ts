import { z } from 'zod';

// User tier enum
export const UserTierSchema = z.enum(['FREE', 'BASIC', 'PREMIUM']);

// Request schemas
export const RegisterRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const LoginRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Response schemas
export const AuthResponseSchema = z.object({
  token: z.string(),
  type: z.literal('Bearer'),
  email: z.string().email(),
  tier: UserTierSchema,
});

// JWT claims schema
export const JwtClaimsSchema = z.object({
  sub: z.string().uuid(), // User ID
  tier: UserTierSchema,
  iat: z.number(), // Issued at (Unix timestamp)
  exp: z.number(), // Expires at (Unix timestamp)
});

// Type exports
export type UserTier = z.infer<typeof UserTierSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type JwtClaims = z.infer<typeof JwtClaimsSchema>;
