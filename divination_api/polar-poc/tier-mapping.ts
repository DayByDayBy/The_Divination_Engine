/**
 * P0-004: Polar Product to User Tier Mapping
 * 
 * Maps Polar product IDs to application user tiers.
 * Update these mappings when creating new products in Polar.
 */

// =============================================================================
// Types
// =============================================================================

export type UserTier = 'FREE' | 'BASIC' | 'PREMIUM';

export interface TierConfig {
  tier: UserTier;
  name: string;
  readingsPerDay: number;
  features: string[];
}

// =============================================================================
// Product Mappings
// =============================================================================

/**
 * Map of Polar product IDs to user tiers
 * 
 * Update these when creating products in the Polar dashboard:
 * - Sandbox: https://sandbox.polar.sh/dashboard
 * - Production: https://polar.sh/dashboard
 */
const PRODUCT_TIER_MAP: Record<string, UserTier> = {
  // Sandbox product IDs (for testing)
  'prod_sandbox_basic': 'BASIC',
  'prod_sandbox_premium': 'PREMIUM',
  
  // Production product IDs (replace with real IDs)
  'prod_basic_monthly': 'BASIC',
  'prod_basic_yearly': 'BASIC',
  'prod_premium_monthly': 'PREMIUM',
  'prod_premium_yearly': 'PREMIUM',
};

/**
 * Tier configuration with limits and features
 */
const TIER_CONFIG: Record<UserTier, TierConfig> = {
  FREE: {
    tier: 'FREE',
    name: 'Free',
    readingsPerDay: 3,
    features: [
      'Basic tarot readings',
      '3 readings per day',
      'Standard interpretations',
    ],
  },
  BASIC: {
    tier: 'BASIC',
    name: 'Basic',
    readingsPerDay: 20,
    features: [
      'Enhanced tarot readings',
      '20 readings per day',
      'Detailed interpretations',
      'Reading history',
    ],
  },
  PREMIUM: {
    tier: 'PREMIUM',
    name: 'Premium',
    readingsPerDay: -1, // Unlimited
    features: [
      'Unlimited tarot readings',
      'Priority interpretations',
      'Full reading history',
      'Advanced spreads',
      'Priority support',
    ],
  },
};

// =============================================================================
// Functions
// =============================================================================

/**
 * Maps a Polar product ID to an application user tier
 * 
 * @param productId - Polar product ID
 * @returns User tier, defaults to FREE if product not found
 */
export function mapProductToTier(productId: string): UserTier {
  const tier = PRODUCT_TIER_MAP[productId];
  
  if (!tier) {
    console.warn(`Unknown product ID: ${productId}, defaulting to FREE`);
    return 'FREE';
  }
  
  return tier;
}

/**
 * Gets the configuration for a user tier
 * 
 * @param tier - User tier
 * @returns Tier configuration
 */
export function getTierConfig(tier: UserTier): TierConfig {
  return TIER_CONFIG[tier];
}

/**
 * Checks if a user tier allows a reading
 * 
 * @param tier - User tier
 * @param currentDailyCount - Number of readings today
 * @returns Whether the reading is allowed
 */
export function canPerformReading(tier: UserTier, currentDailyCount: number): boolean {
  const config = TIER_CONFIG[tier];
  
  // -1 means unlimited
  if (config.readingsPerDay === -1) {
    return true;
  }
  
  return currentDailyCount < config.readingsPerDay;
}

/**
 * Gets the readings remaining for a tier
 * 
 * @param tier - User tier
 * @param currentDailyCount - Number of readings today
 * @returns Number of readings remaining, or -1 for unlimited
 */
export function getReadingsRemaining(tier: UserTier, currentDailyCount: number): number {
  const config = TIER_CONFIG[tier];
  
  if (config.readingsPerDay === -1) {
    return -1; // Unlimited
  }
  
  return Math.max(0, config.readingsPerDay - currentDailyCount);
}

/**
 * Gets the upgrade path from current tier
 * 
 * @param currentTier - Current user tier
 * @returns Next tier to upgrade to, or null if already at max
 */
export function getUpgradeTier(currentTier: UserTier): UserTier | null {
  switch (currentTier) {
    case 'FREE':
      return 'BASIC';
    case 'BASIC':
      return 'PREMIUM';
    case 'PREMIUM':
      return null; // Already at max
    default:
      return 'BASIC';
  }
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validates that all product mappings point to valid tiers
 */
export function validateProductMappings(): boolean {
  const validTiers: UserTier[] = ['FREE', 'BASIC', 'PREMIUM'];
  
  for (const [productId, tier] of Object.entries(PRODUCT_TIER_MAP)) {
    if (!validTiers.includes(tier)) {
      console.error(`Invalid tier mapping: ${productId} -> ${tier}`);
      return false;
    }
  }
  
  return true;
}

// =============================================================================
// Export all mappings for documentation
// =============================================================================

export const productTierMap = PRODUCT_TIER_MAP;
export const tierConfig = TIER_CONFIG;
