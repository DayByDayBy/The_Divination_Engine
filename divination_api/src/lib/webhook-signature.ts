/**
 * P0-004: Polar Webhook Signature Verification
 * 
 * Verifies webhook signatures using HMAC-SHA256.
 * CRITICAL: Always verify signature BEFORE parsing JSON.
 */

import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verifies a Polar webhook signature
 * 
 * @param payload - Raw request body as string
 * @param signature - Value from 'polar-signature' header
 * @param secret - Webhook secret from Polar dashboard
 * @returns true if signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!payload || !signature || !secret) {
    return false;
  }

  try {
    // Parse signature header
    // Format: "t=<timestamp>,v1=<signature>"
    const parts = parseSignatureHeader(signature);
    
    if (!parts.timestamp || !parts.signature) {
      console.error('Invalid signature header format');
      return false;
    }

    // Check timestamp to prevent replay attacks (5 minute tolerance)
    const timestampAge = Date.now() - parts.timestamp * 1000;
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    // Reject timestamps outside of allowed window (too old OR in the future)
    if (Math.abs(timestampAge) > maxAge) {
      console.error(timestampAge < 0 ? 'Webhook timestamp in future' : 'Webhook timestamp too old');
      return false;
    }

    // Compute expected signature
    const signedPayload = `${parts.timestamp}.${payload}`;
    const expectedSignature = createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    // Timing-safe comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(parts.signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(signatureBuffer, expectedBuffer);

  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Parses a Polar signature header
 * 
 * Format: "t=<timestamp>,v1=<signature>"
 */
function parseSignatureHeader(header: string): {
  timestamp: number | null;
  signature: string | null;
} {
  const result = {
    timestamp: null as number | null,
    signature: null as string | null,
  };

  const parts = header.split(',');
  
  for (const part of parts) {
    const [key, value] = part.split('=');
    
    if (key === 't') {
      result.timestamp = parseInt(value, 10);
    } else if (key === 'v1') {
      result.signature = value;
    }
  }

  return result;
}

/**
 * Generates a test signature (for testing purposes only)
 */
export function generateTestSignature(
  payload: string,
  secret: string,
  timestamp?: number
): string {
  const ts = timestamp ?? Math.floor(Date.now() / 1000);
  const signedPayload = `${ts}.${payload}`;
  const signature = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  return `t=${ts},v1=${signature}`;
}
