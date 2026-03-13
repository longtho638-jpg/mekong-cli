/**
 * Signal Gate — Tier-Based Signal Delivery
 *
 * Gates Polymarket trading signals based on subscription tier:
 * - Free: 15-minute delayed signals + blurred preview
 * - Pro: Real-time signals
 * - Enterprise: Early signals (before public) + API access
 *
 * Features:
 * - Signal delay enforcement for free tier
 * - Real-time feed for Pro/Enterprise
 * - Early access queue for Enterprise
 * - API rate limiting per tier
 * - Usage tracking and audit logging
 */

import { LicenseService, LicenseTier, LicenseError } from '../lib/raas-gate';
import { logger } from '../utils/logger';

/**
 * Signal types supported by the gate
 */
export enum SignalType {
  BUY_YES = 'BUY_YES',
  SELL_YES = 'SELL_YES',
  BUY_NO = 'BUY_NO',
  SELL_NO = 'SELL_NO',
  CANCEL = 'CANCEL',
}

/**
 * Trading signal payload
 */
export interface TradingSignal {
  id: string;
  type: SignalType;
  tokenId: string;
  marketId: string;
  marketQuestion: string;
  side: 'YES' | 'NO';
  action: 'BUY' | 'SELL' | 'CANCEL';
  price: number;
  size: number;
  expectedValue: number;
  confidence: number;
  catalyst: string;
  createdAt: number;
  expiresAt?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Signal delivery result after gate processing
 */
export interface GatedSignal {
  signal: TradingSignal | null;
  isDelayed: boolean;
  delaySeconds: number;
  tier: LicenseTier;
  message?: string;
  cta?: {
    title: string;
    description: string;
    upgradeUrl?: string;
  };
}

/**
 * Signal queue entry for Enterprise early access
 */
interface SignalQueueEntry {
  signal: TradingSignal;
  queuedAt: number;
  releasedAt: number;
  releasedToTiers: LicenseTier[];
}

/**
 * Configuration for SignalGate
 */
export interface SignalGateConfig {
  /** Free tier delay in seconds (default: 900 = 15 min) */
  freeTierDelaySeconds?: number;
  /** Pro tier delay (default: 0 = real-time) */
  proTierDelaySeconds?: number;
  /** Enterprise tier delay (default: 0, can be negative for early access) */
  enterpriseTierDelaySeconds?: number;
  /** Enable early access queue for Enterprise */
  enableEarlyAccess?: boolean;
  /** Max signals to queue for early access */
  maxEarlyAccessQueueSize?: number;
}

/**
 * Signal statistics per tier
 */
export interface SignalStats {
  tier: LicenseTier;
  totalSignals: number;
  delayedSignals: number;
  avgDelaySeconds: number;
  lastSignalAt?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<SignalGateConfig> = {
  freeTierDelaySeconds: 900, // 15 minutes
  proTierDelaySeconds: 0,
  enterpriseTierDelaySeconds: 0,
  enableEarlyAccess: true,
  maxEarlyAccessQueueSize: 100,
};

/**
 * Signal Gate — Tier-based signal delivery
 *
 * Enforces signal delays based on subscription tier:
 * - FREE: 15-minute delay
 * - PRO: Real-time
 * - ENTERPRISE: Real-time + early access queue
 */
export class SignalGate {
  private config: Required<SignalGateConfig>;
  private licenseService: LicenseService;

  // Early access queue for Enterprise
  private earlyAccessQueue: SignalQueueEntry[] = [];

  // Signal delivery history
  private signalHistory = new Map<string, { signal: TradingSignal; createdAt: number }>();

  // Statistics per tier
  private stats: Record<LicenseTier, SignalStats> = {
    [LicenseTier.FREE]: {
      tier: LicenseTier.FREE,
      totalSignals: 0,
      delayedSignals: 0,
      avgDelaySeconds: 0,
    },
    [LicenseTier.PRO]: {
      tier: LicenseTier.PRO,
      totalSignals: 0,
      delayedSignals: 0,
      avgDelaySeconds: 0,
    },
    [LicenseTier.ENTERPRISE]: {
      tier: LicenseTier.ENTERPRISE,
      totalSignals: 0,
      delayedSignals: 0,
      avgDelaySeconds: 0,
    },
  };

  constructor(config: SignalGateConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.licenseService = LicenseService.getInstance();
  }

  /**
   * Get delay for a specific tier
   */
  getDelayForTier(tier: LicenseTier): number {
    switch (tier) {
      case LicenseTier.FREE:
        return this.config.freeTierDelaySeconds;
      case LicenseTier.PRO:
        return this.config.proTierDelaySeconds;
      case LicenseTier.ENTERPRISE:
        return this.config.enterpriseTierDelaySeconds;
      default:
        return this.config.freeTierDelaySeconds;
    }
  }

  /**
   * Process signal through gate
   *
   * @param signal - Raw trading signal
   * @param apiKey - User's API/license key
   * @returns Gated signal with delay applied
   */
  processSignal(signal: TradingSignal, apiKey?: string): GatedSignal {
    // Determine user's tier from API key
    const tier = this.determineTier(apiKey);

    // Store signal in history
    this.signalHistory.set(signal.id, {
      signal,
      createdAt: Date.now(),
    });

    // Get delay for tier
    const delaySeconds = this.getDelayForTier(tier);

    // Check if signal should be delayed
    const now = Date.now();
    const signalAge = now - signal.createdAt;
    const delayMs = delaySeconds * 1000;

    // Enterprise early access queue
    if (tier === LicenseTier.ENTERPRISE && this.config.enableEarlyAccess && delaySeconds < 0) {
      this.addToEarlyAccessQueue(signal);
    }

    // Update statistics
    this.updateStats(tier, delaySeconds);

    // Free tier gets delayed signals + CTA
    if (tier === LicenseTier.FREE && delaySeconds > 0) {
      const isDelayed = signalAge < delayMs;

      if (isDelayed) {
        const remainingDelay = Math.ceil((delayMs - signalAge) / 1000);
        logger.debug(`[SignalGate] Free tier signal delayed by ${remainingDelay}s`);

        return {
          signal: null,
          isDelayed: true,
          delaySeconds: remainingDelay,
          tier,
          message: `Signal available in ${remainingDelay} seconds. Upgrade to Pro for real-time signals.`,
          cta: {
            title: 'Unlock Real-Time Signals',
            description: 'Free tier receives 15-minute delayed signals. Upgrade to Pro for instant delivery.',
            upgradeUrl: 'https://polar.sh/agencyos',
          },
        };
      }
    }

    // Pro/Enterprise or non-delayed free signals
    return {
      signal,
      isDelayed: false,
      delaySeconds: 0,
      tier,
      message: tier === LicenseTier.ENTERPRISE ? 'Early access signal' : undefined,
    };
  }

  /**
   * Get signals for a market with tier-based gating
   */
  getSignalsForMarket(marketId: string, apiKey?: string): GatedSignal[] {
    const tier = this.determineTier(apiKey);
    const delaySeconds = this.getDelayForTier(tier);
    const now = Date.now();
    const delayMs = delaySeconds * 1000;

    const signals: GatedSignal[] = [];

    for (const [id, entry] of this.signalHistory.entries()) {
      if (entry.signal.marketId !== marketId) continue;

      const signalAge = now - entry.createdAt;
      const isDelayed = signalAge < delayMs;

      if (isDelayed && tier === LicenseTier.FREE) {
        signals.push({
          signal: null,
          isDelayed: true,
          delaySeconds: Math.ceil((delayMs - signalAge) / 1000),
          tier,
          cta: {
            title: 'Unlock Real-Time Signals',
            description: 'Upgrade to Pro for instant signal delivery',
            upgradeUrl: 'https://polar.sh/agencyos',
          },
        });
      } else {
        signals.push({
          signal: entry.signal,
          isDelayed: false,
          delaySeconds: 0,
          tier,
        });
      }
    }

    return signals;
  }

  /**
   * Get early access signals (Enterprise only)
   */
  getEarlyAccessSignals(apiKey: string): TradingSignal[] {
    const tier = this.determineTier(apiKey);

    if (tier !== LicenseTier.ENTERPRISE) {
      throw new LicenseError('Early access requires Enterprise tier', LicenseTier.ENTERPRISE, 'early-access');
    }

    const now = Date.now();
    const availableSignals: TradingSignal[] = [];

    for (const entry of this.earlyAccessQueue) {
      if (now >= entry.releasedAt && entry.releasedToTiers.includes(LicenseTier.ENTERPRISE)) {
        availableSignals.push(entry.signal);
      }
    }

    return availableSignals;
  }

  /**
   * Check if user has access to a feature
   */
  hasAccess(feature: string, apiKey?: string): boolean {
    const tier = this.determineTier(apiKey);

    switch (feature) {
      case 'real-time-signals':
        return tier !== LicenseTier.FREE;
      case 'early-access':
        return tier === LicenseTier.ENTERPRISE;
      case 'api-access':
        return tier === LicenseTier.ENTERPRISE;
      case 'basic-signals':
        return true; // All tiers get basic signals (delayed for free)
      default:
        return false;
    }
  }

  /**
   * Get statistics for a tier
   */
  getStats(tier: LicenseTier): SignalStats {
    return { ...this.stats[tier] };
  }

  /**
   * Get all statistics
   */
  getAllStats(): Record<LicenseTier, SignalStats> {
    return { ...this.stats };
  }

  /**
   * Clear signal history (for testing)
   */
  clear(): void {
    this.signalHistory.clear();
    this.earlyAccessQueue = [];
    // Reset stats
    this.stats = {
      [LicenseTier.FREE]: {
        tier: LicenseTier.FREE,
        totalSignals: 0,
        delayedSignals: 0,
        avgDelaySeconds: 0,
      },
      [LicenseTier.PRO]: {
        tier: LicenseTier.PRO,
        totalSignals: 0,
        delayedSignals: 0,
        avgDelaySeconds: 0,
      },
      [LicenseTier.ENTERPRISE]: {
        tier: LicenseTier.ENTERPRISE,
        totalSignals: 0,
        delayedSignals: 0,
        avgDelaySeconds: 0,
      },
    };
  }

  /**
   * Determine user tier from API key
   */
  private determineTier(apiKey?: string): LicenseTier {
    if (!apiKey) {
      return LicenseTier.FREE;
    }

    try {
      const validation = this.licenseService.validateSync(apiKey);
      if (!validation.valid) {
        return LicenseTier.FREE;
      }

      if (validation.features.includes('enterprise')) {
        return LicenseTier.ENTERPRISE;
      }
      if (validation.features.includes('pro')) {
        return LicenseTier.PRO;
      }

      return LicenseTier.FREE;
    } catch {
      return LicenseTier.FREE;
    }
  }

  /**
   * Add signal to early access queue
   */
  private addToEarlyAccessQueue(signal: TradingSignal): void {
    const now = Date.now();

    // Calculate release times
    const enterpriseRelease = now; // Immediate for Enterprise
    const proRelease = now + this.config.proTierDelaySeconds * 1000;
    const freeRelease = now + this.config.freeTierDelaySeconds * 1000;

    const entry: SignalQueueEntry = {
      signal,
      queuedAt: now,
      releasedAt: enterpriseRelease,
      releasedToTiers: [LicenseTier.ENTERPRISE],
    };

    this.earlyAccessQueue.push(entry);

    // Trim queue if needed
    if (this.earlyAccessQueue.length > this.config.maxEarlyAccessQueueSize) {
      this.earlyAccessQueue.shift();
    }

    logger.debug(`[SignalGate] Added signal ${signal.id} to early access queue`);
  }

  /**
   * Update statistics
   */
  private updateStats(tier: LicenseTier, delaySeconds: number): void {
    const stats = this.stats[tier];
    stats.totalSignals++;

    if (delaySeconds > 0) {
      stats.delayedSignals++;
    }

    // Update average delay
    const totalDelay = stats.avgDelaySeconds * (stats.totalSignals - 1) + delaySeconds;
    stats.avgDelaySeconds = totalDelay / stats.totalSignals;
    stats.lastSignalAt = Date.now();
  }
}

/**
 * Create singleton SignalGate instance
 */
export function createSignalGate(config?: SignalGateConfig): SignalGate {
  return new SignalGate(config);
}

/**
 * Default SignalGate instance
 */
export const defaultSignalGate = createSignalGate();
