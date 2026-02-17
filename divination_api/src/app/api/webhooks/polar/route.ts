import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyWebhookSignature } from '../../../../../polar-poc/signature';

type UserTier = 'FREE' | 'BASIC' | 'PREMIUM';

const PRODUCT_TIER_MAP: Record<string, UserTier> = {
  [process.env.POLAR_PRODUCT_ID_BASIC || '']: 'BASIC',
  [process.env.POLAR_PRODUCT_ID_PREMIUM || '']: 'PREMIUM',
};

const UPGRADE_STATUSES = new Set(['active', 'trialing']);
const DOWNGRADE_STATUSES = new Set([
  'canceled', 'revoked', 'unpaid', 'past_due', 'incomplete', 'paused',
]);

export async function POST(request: NextRequest) {
  // 1. Read raw body BEFORE any JSON parsing
  const rawBody = await request.text();

  // 2. Verify signature
  const signature = request.headers.get('polar-signature');
  const secret = process.env.POLAR_WEBHOOK_SECRET;

  if (!signature || !secret || !verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 3. Parse verified body as JSON
  let event: { type: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // 4. Extract event ID for idempotency
  const eventId = (event.data?.id as string) || '';
  const { type, data } = event;

  // 5. Idempotency check: if we've already processed this event, return early
  if (eventId) {
    const existing = await prisma.webhookEvent.findUnique({ where: { eventId } });
    if (existing) {
      console.log(`Duplicate webhook event detected: ${eventId}`);
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }
  }

  // 6. Handle event types inside a transaction for atomicity
  try {
    if (type === 'subscription.created' || type === 'subscription.updated') {
      const customer = data.customer as { externalId?: string } | undefined;
      const product = data.product as { id?: string } | undefined;
      const status = (data.status as string) || 'active';
      const userId = customer?.externalId;
      const productId = product?.id;

      if (!userId) {
        console.warn('Webhook missing customer.externalId');
        return NextResponse.json({ received: true }, { status: 200 });
      }

      await prisma.$transaction(async (tx: any) => {
        // Record the webhook event for idempotency
        if (eventId) {
          await tx.webhookEvent.create({
            data: { eventId, eventType: type },
          });
        }

        // Look up user
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) {
          console.warn(`User not found for webhook (id: ${userId.substring(0, 8)}...)`);
          return;
        }

        if (type === 'subscription.created' || UPGRADE_STATUSES.has(status)) {
          // Upgrade: map product to tier
          const tier = productId ? (PRODUCT_TIER_MAP[productId] || 'FREE') : 'FREE';
          await tx.user.update({
            where: { id: userId },
            data: { tier },
          });
        } else if (DOWNGRADE_STATUSES.has(status)) {
          // Downgrade to FREE
          await tx.user.update({
            where: { id: userId },
            data: { tier: 'FREE' },
          });
        } else {
          console.warn(`Unrecognised subscription status: ${status}`);
        }
      });
    } else {
      console.log(`Unhandled webhook event type: ${type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
