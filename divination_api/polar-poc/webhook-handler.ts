/**
 * P0-004: Polar Webhook Handler
 * 
 * Demonstrates idempotent webhook processing with database-level guarantees.
 * This pattern ensures webhooks can be safely replayed without side effects.
 */

import { PrismaClient } from '@prisma/client';
import { verifyWebhookSignature } from './signature';
import { mapProductToTier, type UserTier } from './tier-mapping';

const prisma = new PrismaClient();

// =============================================================================
// Types
// =============================================================================

interface PolarWebhookPayload {
  id: string;
  type: string;
  data: {
    id: string;
    customer_id?: string;
    user_id?: string;
    product_id?: string;
    status?: string;
    [key: string]: unknown;
  };
  created_at: string;
}

interface WebhookResult {
  success: boolean;
  message: string;
  eventId: string;
  alreadyProcessed?: boolean;
}

/**
 * Error thrown when webhook event was already processed (for idempotency)
 */
class AlreadyProcessedError extends Error {
  constructor(eventId: string) {
    super(`Event ${eventId} already processed`);
    this.name = 'AlreadyProcessedError';
  }
}

// =============================================================================
// Main Handler
// =============================================================================

/**
 * Idempotent webhook handler
 * 
 * Key properties:
 * 1. Signature verified before JSON parsing
 * 2. Idempotency enforced at database level
 * 3. Transactional processing
 * 4. Safe under retries and replays
 */
export async function handlePolarWebhook(
  rawBody: string,
  signature: string | null,
  webhookSecret: string
): Promise<WebhookResult> {
  
  // 1. Verify signature BEFORE parsing JSON
  if (!signature || !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    return {
      success: false,
      message: 'Invalid webhook signature',
      eventId: 'unknown',
    };
  }
  
  // 2. Parse payload after verification (with error handling)
  let payload: PolarWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch (parseError) {
    console.error('Failed to parse webhook payload:', parseError);
    return {
      success: false,
      message: 'Invalid JSON payload',
      eventId: 'unknown',
    };
  }
  const eventId = payload.id;
  
  // 3. Idempotency check and processing in single transaction (atomic)
  try {
    await prisma.$transaction(async (tx) => {
      // Create-first pattern: attempt to create the webhook event record first
      // This provides database-level idempotency via unique constraint on eventId
      try {
        await tx.webhookEvent.create({
          data: {
            eventId,
            eventType: payload.type,
            processedAt: new Date(),
          },
        });
      } catch (createError: any) {
        // Check if this is a unique constraint violation (P2002)
        if (createError?.code === 'P2002') {
          throw new AlreadyProcessedError(eventId);
        }
        // Re-throw other errors
        throw createError;
      }
      
      // Only process the event if we successfully created the record
      await processEvent(payload, tx);
    });
    
    return {
      success: true,
      message: `Event processed: ${payload.type}`,
      eventId,
    };
    
  } catch (error) {
    // Handle already processed events gracefully
    if (error instanceof AlreadyProcessedError) {
      return {
        success: true,
        message: 'Event already processed',
        eventId,
        alreadyProcessed: true,
      };
    }
    
    console.error('Webhook processing error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      eventId,
    };
  }
}

// =============================================================================
// Event Processors
// =============================================================================

async function processEvent(
  payload: PolarWebhookPayload,
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
): Promise<void> {
  
  switch (payload.type) {
    case 'subscription.created':
    case 'subscription.updated':
      await handleSubscriptionChange(payload, tx);
      break;
      
    case 'subscription.canceled':
    case 'subscription.revoked':
      await handleSubscriptionEnd(payload, tx);
      break;
      
    case 'checkout.created':
    case 'checkout.updated':
      // Log for analytics, no action needed
      console.log(`Checkout event: ${payload.type}`, payload.data.id);
      break;
      
    default:
      console.log(`Unhandled event type: ${payload.type}`);
  }
}

async function handleSubscriptionChange(
  payload: PolarWebhookPayload,
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
): Promise<void> {
  const userId = payload.data.user_id || payload.data.customer_id;
  const productId = payload.data.product_id;
  
  if (!userId || !productId) {
    throw new Error('Missing user_id or product_id in subscription event');
  }
  
  const newTier = mapProductToTier(productId);
  
  // Safe lookup before update to handle missing users gracefully
  const user = await tx.user.findUnique({
    where: { id: userId },
  });
  
  if (!user) {
    console.warn(`User not found for subscription change (id: ${userId.substring(0, 8)}...)`);
    return;
  }
  
  // Update user tier atomically
  await tx.user.update({
    where: { id: userId },
    data: { tier: newTier },
  });
  
  console.log(`Updated user ${userId.substring(0, 8)}... to tier ${newTier}`);
}

async function handleSubscriptionEnd(
  payload: PolarWebhookPayload,
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
): Promise<void> {
  const userId = payload.data.user_id || payload.data.customer_id;
  
  if (!userId) {
    throw new Error('Missing user_id in subscription end event');
  }
  
  // Safe lookup before update
  const user = await tx.user.findUnique({
    where: { id: userId },
  });
  
  if (!user) {
    console.warn(`User not found for subscription end (id: ${userId.substring(0, 8)}...)`);
    return;
  }
  
  // Downgrade to FREE tier
  await tx.user.update({
    where: { id: userId },
    data: { tier: 'FREE' },
  });
  
  console.log(`Downgraded user ${userId.substring(0, 8)}... to FREE tier`);
}

// =============================================================================
// Express/Next.js Route Handler Example
// =============================================================================

/**
 * Example Next.js API route handler
 * 
 * Usage in `app/api/webhook/polar/route.ts`:
 * 
 * ```typescript
 * import { handlePolarWebhook } from '@/lib/polar/webhook-handler';
 * 
 * export async function POST(request: Request) {
 *   const rawBody = await request.text();
 *   const signature = request.headers.get('polar-signature');
 *   
 *   const result = await handlePolarWebhook(
 *     rawBody,
 *     signature,
 *     process.env.POLAR_WEBHOOK_SECRET!
 *   );
 *   
 *   if (!result.success) {
 *     return new Response(result.message, { status: 401 });
 *   }
 *   
 *   return new Response('OK', { status: 200 });
 * }
 * ```
 */

export { verifyWebhookSignature } from './signature';
export { mapProductToTier, type UserTier } from './tier-mapping';
