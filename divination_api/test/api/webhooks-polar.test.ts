import { NextRequest } from 'next/server';

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock signature verification - import from polar-poc
jest.mock('../../polar-poc/signature', () => ({
  verifyWebhookSignature: jest.fn(),
}));

import { prisma } from '@/lib/db';
import { verifyWebhookSignature } from '../../polar-poc/signature';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockVerify = verifyWebhookSignature as jest.MockedFunction<typeof verifyWebhookSignature>;

const mockUserId = '550e8400-e29b-41d4-a716-446655440000';

// Set env vars for product→tier mapping
const MOCK_BASIC_PRODUCT_ID = 'prod_basic_test';
const MOCK_PREMIUM_PRODUCT_ID = 'prod_premium_test';

beforeAll(() => {
  process.env.POLAR_WEBHOOK_SECRET = 'test-webhook-secret';
  process.env.POLAR_PRODUCT_ID_BASIC = MOCK_BASIC_PRODUCT_ID;
  process.env.POLAR_PRODUCT_ID_PREMIUM = MOCK_PREMIUM_PRODUCT_ID;
});

function createWebhookRequest(
  body: unknown,
  signature: string | null = 'valid-sig'
): NextRequest {
  const rawBody = typeof body === 'string' ? body : JSON.stringify(body);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (signature !== null) {
    headers['polar-signature'] = signature;
  }
  return new NextRequest('http://localhost:3000/api/webhooks/polar', {
    method: 'POST',
    headers,
    body: rawBody,
  });
}

function subscriptionEvent(
  type: string,
  productId: string,
  status: string = 'active'
) {
  return {
    type,
    data: {
      id: 'sub_123',
      status,
      customer: {
        externalId: mockUserId,
      },
      product: {
        id: productId,
      },
    },
  };
}

describe('POST /api/webhooks/polar', () => {
  let POST: (request: NextRequest) => Promise<Response>;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Dynamic import to pick up env vars and mocks
    const mod = await import('@/app/api/webhooks/polar/route');
    POST = mod.POST;
  });

  // --- Signature verification ---

  it('returns 401 when polar-signature header is missing', async () => {
    const request = createWebhookRequest(
      subscriptionEvent('subscription.created', MOCK_BASIC_PRODUCT_ID),
      null
    );
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 401 when signature verification fails', async () => {
    mockVerify.mockReturnValue(false);

    const request = createWebhookRequest(
      subscriptionEvent('subscription.created', MOCK_BASIC_PRODUCT_ID),
      'invalid-sig'
    );
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  // --- subscription.created ---

  it('upgrades user to BASIC on subscription.created with basic product', async () => {
    mockVerify.mockReturnValue(true);
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: mockUserId,
      tier: 'FREE',
    });
    (mockPrisma.user.update as jest.Mock).mockResolvedValue({
      id: mockUserId,
      tier: 'BASIC',
    });

    const request = createWebhookRequest(
      subscriptionEvent('subscription.created', MOCK_BASIC_PRODUCT_ID)
    );
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockUserId },
    });
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: mockUserId },
      data: { tier: 'BASIC' },
    });
  });

  it('upgrades user to PREMIUM on subscription.created with premium product', async () => {
    mockVerify.mockReturnValue(true);
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: mockUserId,
      tier: 'FREE',
    });
    (mockPrisma.user.update as jest.Mock).mockResolvedValue({
      id: mockUserId,
      tier: 'PREMIUM',
    });

    const request = createWebhookRequest(
      subscriptionEvent('subscription.created', MOCK_PREMIUM_PRODUCT_ID)
    );
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: mockUserId },
      data: { tier: 'PREMIUM' },
    });
  });

  // --- subscription.updated (active/trialing → upgrade) ---

  it('upgrades user tier on subscription.updated with status active', async () => {
    mockVerify.mockReturnValue(true);
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: mockUserId,
      tier: 'FREE',
    });
    (mockPrisma.user.update as jest.Mock).mockResolvedValue({
      id: mockUserId,
      tier: 'BASIC',
    });

    const request = createWebhookRequest(
      subscriptionEvent('subscription.updated', MOCK_BASIC_PRODUCT_ID, 'active')
    );
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: mockUserId },
      data: { tier: 'BASIC' },
    });
  });

  it('upgrades user tier on subscription.updated with status trialing', async () => {
    mockVerify.mockReturnValue(true);
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: mockUserId,
      tier: 'FREE',
    });
    (mockPrisma.user.update as jest.Mock).mockResolvedValue({
      id: mockUserId,
      tier: 'PREMIUM',
    });

    const request = createWebhookRequest(
      subscriptionEvent('subscription.updated', MOCK_PREMIUM_PRODUCT_ID, 'trialing')
    );
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: mockUserId },
      data: { tier: 'PREMIUM' },
    });
  });

  // --- subscription.updated (downgrade statuses → FREE) ---

  const downgradeStatuses = ['canceled', 'revoked', 'unpaid', 'past_due', 'incomplete', 'paused'];

  downgradeStatuses.forEach((status) => {
    it(`downgrades user to FREE on subscription.updated with status ${status}`, async () => {
      mockVerify.mockReturnValue(true);
      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: mockUserId,
        tier: 'PREMIUM',
      });
      (mockPrisma.user.update as jest.Mock).mockResolvedValue({
        id: mockUserId,
        tier: 'FREE',
      });

      const request = createWebhookRequest(
        subscriptionEvent('subscription.updated', MOCK_BASIC_PRODUCT_ID, status)
      );
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { tier: 'FREE' },
      });
    });
  });

  // --- subscription.updated (unknown status → no action) ---

  it('takes no action on subscription.updated with unknown status', async () => {
    mockVerify.mockReturnValue(true);
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const request = createWebhookRequest(
      subscriptionEvent('subscription.updated', MOCK_BASIC_PRODUCT_ID, 'some_future_status')
    );
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  // --- Unrecognised event type ---

  it('returns 200 and logs for unrecognised event type', async () => {
    mockVerify.mockReturnValue(true);
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const request = createWebhookRequest({
      type: 'checkout.completed',
      data: { id: 'chk_123' },
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  // --- User not found ---

  it('returns 200 when user not found by externalId (logs warning)', async () => {
    mockVerify.mockReturnValue(true);
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const request = createWebhookRequest(
      subscriptionEvent('subscription.created', MOCK_BASIC_PRODUCT_ID)
    );
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  // --- Malformed JSON ---

  it('returns 400 for malformed JSON body', async () => {
    mockVerify.mockReturnValue(true);

    const request = createWebhookRequest('not valid json{{{', 'valid-sig');
    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
