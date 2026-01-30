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
  
  // 2. Parse payload after verification
  const payload: PolarWebhookPayload = JSON.parse(rawBody);
  const eventId = payload.id;
  
  // 3. Idempotency check at database level
  const existingEvent = await prisma.webhookEvent.findUnique({
    where: { eventId },
  });
  
  if (existingEvent) {
    return {
      success: true,
      message: 'Event already processed',
      eventId,
      alreadyProcessed: true,
    };
  }
  
  // 4. Process event in transaction
  try {
    await prisma.$transaction(async (tx) => {
      // Process the specific event type
      await processEvent(payload, tx);
      
      // Record the event as processed (within same transaction)
      await tx.webhookEvent.create({
        data: {
          eventId,
          eventType: payload.type,
          processedAt: new Date(),
        },
      });
    });
    
    return {
      success: true,
      message: `Event processed: ${payload.type}`,
      eventId,
    };
    
  } catch (error) {
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
  
  // Update user tier atomically
  await tx.user.update({
    where: { id: userId },
    data: { tier: newTier },
  });
  
  console.log(`Updated user ${userId} to tier ${newTier}`);
}

async function handleSubscriptionEnd(
  payload: PolarWebhookPayload,
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
): Promise<void> {
  const userId = payload.data.user_id || payload.data.customer_id;
  
  if (!userId) {
    throw new Error('Missing user_id in subscription end event');
  }
  
  // Downgrade to FREE tier
  await tx.user.update({
    where: { id: userId },
    data: { tier: 'FREE' },
  });
  
  console.log(`Downgraded user ${userId} to FREE tier`);
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
