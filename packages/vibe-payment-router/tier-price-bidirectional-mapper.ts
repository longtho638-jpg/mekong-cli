/**
 * @agencyos/vibe-payment-router — Tier ↔ Price Bidirectional Mapper
 *
 * Maps internal plan tiers to provider-specific price IDs and back.
 * Extracted from backend/services/stripe_service.py PRICE_TO_TIER_MAP pattern.
 *
 * Usage:
 *   const mapper = createTierPriceMapper({
 *     tiers: {
 *       starter: { stripe: { monthly: 'price_abc', yearly: 'price_def' } },
 *       pro: { stripe: { monthly: 'price_ghi', yearly: 'price_jkl' } },
 *     },
 *   });
 *   mapper.getPriceId('pro', 'stripe', 'monthly');  // 'price_ghi'
 *   mapper.getTier('stripe', 'price_ghi');           // 'pro'
 */

// ─── Types ──────────────────────────────────────────────────────

export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

export interface TierPriceEntry {
  [provider: string]: Partial<Record<BillingCycle, string>>;
}

export interface TierPriceMapperConfig {
  /** Map: tier → provider → cycle → priceId */
  tiers: Record<string, TierPriceEntry>;
  /** Default billing cycle when not specified */
  defaultCycle?: BillingCycle;
  /** Default provider when not specified */
  defaultProvider?: string;
}

// ─── Mapper Factory ─────────────────────────────────────────────

export function createTierPriceMapper(config: TierPriceMapperConfig) {
  const { tiers, defaultCycle = 'monthly', defaultProvider = 'stripe' } = config;

  // Build reverse index: priceId → { tier, provider, cycle }
  const reverseIndex = new Map<string, { tier: string; provider: string; cycle: BillingCycle }>();

  for (const [tier, providers] of Object.entries(tiers)) {
    for (const [provider, cycles] of Object.entries(providers)) {
      for (const [cycle, priceId] of Object.entries(cycles)) {
        if (priceId) {
          reverseIndex.set(priceId, { tier, provider, cycle: cycle as BillingCycle });
        }
      }
    }
  }

  return {
    /**
     * Get provider price ID for a given tier and billing cycle.
     * Returns undefined if not found.
     */
    getPriceId(tier: string, provider?: string, cycle?: BillingCycle): string | undefined {
      const p = provider ?? defaultProvider;
      const c = cycle ?? defaultCycle;
      return tiers[tier]?.[p]?.[c];
    },

    /**
     * Reverse lookup: get tier from a provider price ID.
     * Returns undefined if price ID is not mapped.
     */
    getTier(provider: string, priceId: string): string | undefined {
      const entry = reverseIndex.get(priceId);
      if (!entry || entry.provider !== provider) return undefined;
      return entry.tier;
    },

    /**
     * Get full mapping info from a price ID.
     */
    lookupPriceId(priceId: string): { tier: string; provider: string; cycle: BillingCycle } | undefined {
      return reverseIndex.get(priceId);
    },

    /**
     * Get all price IDs for a provider.
     */
    getProviderPrices(provider: string): Record<string, Partial<Record<BillingCycle, string>>> {
      const result: Record<string, Partial<Record<BillingCycle, string>>> = {};
      for (const [tier, providers] of Object.entries(tiers)) {
        if (providers[provider]) {
          result[tier] = providers[provider];
        }
      }
      return result;
    },

    /**
     * Get all available tiers.
     */
    getTiers(): string[] {
      return Object.keys(tiers);
    },

    /**
     * Get all providers that have price mappings.
     */
    getProviders(): string[] {
      const providers = new Set<string>();
      for (const entry of Object.values(tiers)) {
        for (const provider of Object.keys(entry)) {
          providers.add(provider);
        }
      }
      return Array.from(providers);
    },

    /**
     * Validate that all tiers have prices for a given provider + cycle.
     * Returns list of tiers missing price mappings.
     */
    validateCompleteness(provider: string, cycle: BillingCycle): string[] {
      const missing: string[] = [];
      for (const tier of Object.keys(tiers)) {
        if (!tiers[tier]?.[provider]?.[cycle]) {
          missing.push(tier);
        }
      }
      return missing;
    },
  };
}
