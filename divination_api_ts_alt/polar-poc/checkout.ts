/**
 * P0-004: Polar Checkout Flow
 * 
 * Creates checkout sessions for subscription upgrades.
 * Uses Polar SDK to generate checkout URLs.
 */

import { Polar } from '@polar-sh/sdk';

// =============================================================================
// Types
// =============================================================================

export interface CheckoutConfig {
  productId: string;
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl?: string;
}

export interface CheckoutResult {
  success: boolean;
  checkoutUrl?: string;
  checkoutId?: string;
  error?: string;
}

// =============================================================================
// Polar Client
// =============================================================================

/**
 * Creates a Polar SDK client
 */
function createPolarClient(accessToken: string): Polar {
  return new Polar({
    accessToken,
  });
}

// =============================================================================
// Checkout Creation
// =============================================================================

/**
 * Creates a Polar checkout session for a subscription
 * 
 * @param config - Checkout configuration
 * @param accessToken - Polar access token
 * @returns Checkout result with URL
 */
export async function createCheckout(
  config: CheckoutConfig,
  accessToken: string
): Promise<CheckoutResult> {
  try {
    const polar = createPolarClient(accessToken);

    // Ensure customer exists in Polar and get their Polar customer ID
    const polarCustomerId = await ensureCustomer(
      config.userId,
      config.userEmail,
      accessToken
    );

    // Create checkout session with Polar customer ID (not app user ID)
    const checkout = await polar.checkouts.create({
      productId: config.productId,
      customerId: polarCustomerId,
      customerEmail: config.userEmail,
      successUrl: config.successUrl,
      ...(config.cancelUrl && { cancelUrl: config.cancelUrl }),
    });

    return {
      success: true,
      checkoutUrl: checkout.url,
      checkoutId: checkout.id,
    };

  } catch (error) {
    console.error('Checkout creation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Gets checkout status
 * 
 * @param checkoutId - Checkout session ID
 * @param accessToken - Polar access token
 * @returns Checkout status
 */
export async function getCheckoutStatus(
  checkoutId: string,
  accessToken: string
): Promise<{
  status: string;
  customerId?: string;
  productId?: string;
}> {
  try {
    const polar = createPolarClient(accessToken);
    const checkout = await polar.checkouts.get({ id: checkoutId });

    return {
      status: checkout.status,
      customerId: checkout.customerId,
      productId: checkout.productId,
    };

  } catch (error) {
    console.error('Get checkout status error:', error);
    throw error;
  }
}

// =============================================================================
// Next.js API Route Example
// =============================================================================

/**
 * Example Next.js API route for creating checkouts
 * 
 * Usage in `app/api/checkout/route.ts`:
 * 
 * ```typescript
 * import { createCheckout } from '@/lib/polar/checkout';
 * import { getServerSession } from 'next-auth';
 * 
 * export async function POST(request: Request) {
 *   const session = await getServerSession();
 *   if (!session?.user) {
 *     return new Response('Unauthorized', { status: 401 });
 *   }
 * 
 *   const { productId } = await request.json();
 * 
 *   const result = await createCheckout(
 *     {
 *       productId,
 *       userId: session.user.id,
 *       userEmail: session.user.email,
 *       successUrl: `${process.env.NEXT_PUBLIC_URL}/checkout/success`,
 *       cancelUrl: `${process.env.NEXT_PUBLIC_URL}/pricing`,
 *     },
 *     process.env.POLAR_ACCESS_TOKEN!
 *   );
 * 
 *   if (!result.success) {
 *     return new Response(result.error, { status: 500 });
 *   }
 * 
 *   return Response.json({ checkoutUrl: result.checkoutUrl });
 * }
 * ```
 */

// =============================================================================
// Product Listing
// =============================================================================

/**
 * Lists available products from Polar
 * 
 * @param organizationId - Polar organization ID
 * @param accessToken - Polar access token
 * @returns List of products
 */
export async function listProducts(
  organizationId: string,
  accessToken: string
): Promise<Array<{
  id: string;
  name: string;
  description?: string;
  prices: Array<{
    id: string;
    amount: number;
    currency: string;
    recurring?: {
      interval: string;
    };
  }>;
}>> {
  try {
    const polar = createPolarClient(accessToken);
    
    // Paginate through all products
    let page = 1;
    const pageSize = 100;
    let products = await polar.products.list({
      organizationId,
      page,
      limit: pageSize,
    });
    
    // Collect all products across pages
    const allProducts = [...products.items];
    
    // Continue fetching while there are more pages
    while (products.items.length === pageSize) {
      page++;
      products = await polar.products.list({
        organizationId,
        page,
        limit: pageSize,
      });
      allProducts.push(...products.items);
    }

    return allProducts.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      prices: product.prices.map((price) => ({
        id: price.id,
        amount: price.priceAmount,
        currency: price.priceCurrency,
        recurring: price.recurring
          ? { interval: price.recurring.interval }
          : undefined,
      })),
    }));

  } catch (error) {
    console.error('List products error:', error);
    throw error;
  }
}

// =============================================================================
// Customer Management
// =============================================================================

/**
 * Creates or updates a customer in Polar
 * 
 * @param userId - Application user ID
 * @param email - User email
 * @param accessToken - Polar access token
 * @returns Customer ID
 */
export async function ensureCustomer(
  userId: string,
  email: string,
  accessToken: string
): Promise<string> {
  try {
    const polar = createPolarClient(accessToken);

    // Search for existing customer by metadata (not by ID)
    try {
      const customers = await polar.customers.list({
        metadata: { userId },
      });
      
      if (customers.items.length > 0) {
        return customers.items[0].id;
      }
    } catch (searchError) {
      // Log but continue to create if search fails
      console.warn('Customer search failed, attempting create:', searchError);
    }
    
    // Customer doesn't exist, create new one with metadata
    const customer = await polar.customers.create({
      email,
      metadata: { userId },
    });
    return customer.id;

  } catch (error) {
    console.error('Ensure customer error:', error);
    throw error;
  }
}
