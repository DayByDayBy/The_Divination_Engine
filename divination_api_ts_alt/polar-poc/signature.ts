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
    // Parse the signature header
    // Format: "t=<timestamp>,v1=<signature>"
    const parts = parseSignatureHeader(signature);
    
    if (!parts.timestamp || !parts.signature) {
      console.error('Invalid signature header format');
      return false;
    }

    // Check timestamp to prevent replay attacks (5 minute tolerance)
    const timestampAge = Date.now() - parts.timestamp * 1000;
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    // Reject timestamps outside the allowed window (too old OR in the future)
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
 * Parses the Polar signature header
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

// =============================================================================
// Tests (run with: npx ts-node signature.ts)
// =============================================================================

async function runTests() {
  console.log('=== Signature Verification Tests ===\n');
  
  const testSecret = 'test-webhook-secret-at-least-32-chars';
  const testPayload = JSON.stringify({
    id: 'evt_123',
    type: 'subscription.created',
    data: { user_id: 'user_456' },
  });

  // Test 1: Valid signature
  console.log('1. Testing valid signature...');
  const validSignature = generateTestSignature(testPayload, testSecret);
  const isValid = verifyWebhookSignature(testPayload, validSignature, testSecret);
  console.log(`   Result: ${isValid ? '✓ PASS' : '✗ FAIL'}`);

  // Test 2: Invalid signature
  console.log('\n2. Testing invalid signature...');
  const invalidSignature = generateTestSignature(testPayload, 'wrong-secret-key');
  const isInvalid = !verifyWebhookSignature(testPayload, invalidSignature, testSecret);
  console.log(`   Result: ${isInvalid ? '✓ PASS' : '✗ FAIL'}`);

  // Test 3: Tampered payload
  console.log('\n3. Testing tampered payload...');
  const tamperedPayload = testPayload.replace('user_456', 'user_789');
  const isTamperDetected = !verifyWebhookSignature(tamperedPayload, validSignature, testSecret);
  console.log(`   Result: ${isTamperDetected ? '✓ PASS' : '✗ FAIL'}`);

  // Test 4: Expired timestamp
  console.log('\n4. Testing expired timestamp...');
  const oldTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
  const expiredSignature = generateTestSignature(testPayload, testSecret, oldTimestamp);
  const isExpiredRejected = !verifyWebhookSignature(testPayload, expiredSignature, testSecret);
  console.log(`   Result: ${isExpiredRejected ? '✓ PASS' : '✗ FAIL'}`);

  // Test 5: Missing parameters
  console.log('\n5. Testing missing parameters...');
  const handlesNull = !verifyWebhookSignature('', '', '');
  console.log(`   Result: ${handlesNull ? '✓ PASS' : '✗ FAIL'}`);

  console.log('\n=== All Tests Complete ===');
}

// Run if executed directly
if (require.main === module) {
  runTests();
}
