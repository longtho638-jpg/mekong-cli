/**
 * Max Order Limits
 *
 * Enforces maximum order size limits and daily volume caps
 * to prevent catastrophic losses from fat-finger errors or runaway algorithms.
 */

export interface OrderLimitsConfig {
  /** Maximum order size in base currency (e.g., BTC) */
  maxOrderSize: number;
  /** Maximum order value in quote currency (e.g., USDT) */
  maxOrderValue: number;
  /** Daily volume limit in quote currency */
  dailyVolumeLimit: number;
  /** Volume spike detection threshold (multiplier) */
  volumeSpikeThreshold: number;
  /** Lookback period for baseline calculation (hours) */
  baselineLookbackHours: number;
  /** Maximum allowed leverage (1x = spot only) */
  maxLeverage?: number;
}

/** Tier-based leverage caps: FREE=1x, PRO=10x, ENTERPRISE=20x */
export const TIER_LEVERAGE_CAPS: Record<string, number> = {
  free: 1,
  pro: 10,
  enterprise: 20,
};

export interface LeverageCheckResult {
  passed: boolean;
  rejectedReason?: string;
  requestedLeverage: number;
  maxAllowed: number;
  tier: string;
}

export interface VolumeRecord {
  timestamp: number;
  amount: number;
  value: number;
  symbol: string;
  side: 'buy' | 'sell';
}

export interface LimitsCheckResult {
  passed: boolean;
  rejectedReason?: string;
  currentUsage?: {
    dailyVolume: number;
    dailyLimit: number;
    usagePercent: number;
  };
}

/**
 * Default conservative limits
 */
export const DEFAULT_LIMITS: OrderLimitsConfig = {
  maxOrderSize: 10, // 10 BTC max
  maxOrderValue: 1_000_000, // $1M max per order
  dailyVolumeLimit: 10_000_000, // $10M daily limit
  volumeSpikeThreshold: 5, // 5x baseline = spike
  baselineLookbackHours: 24,
};

/**
 * Check maximum order size limits
 */
export function checkMaxOrderSize(
  amount: number,
  price: number | undefined,
  config: OrderLimitsConfig
): LimitsCheckResult {
  // Check base currency limit
  if (amount > config.maxOrderSize) {
    return {
      passed: false,
      rejectedReason: `Order amount ${amount} exceeds maximum ${config.maxOrderSize}`,
    };
  }

  // Check quote currency value limit
  if (price !== undefined) {
    const orderValue = amount * price;
    if (orderValue > config.maxOrderValue) {
      return {
        passed: false,
        rejectedReason: `Order value $${orderValue.toLocaleString()} exceeds maximum $${config.maxOrderValue.toLocaleString()}`,
      };
    }
  }

  return { passed: true };
}

/**
 * Check daily volume limit
 */
export function checkDailyVolumeLimit(
  tenantId: string,
  newOrderValue: number,
  config: OrderLimitsConfig,
  volumeHistory: VolumeRecord[]
): LimitsCheckResult {
  const now = Date.now();
  const lookbackMs = 24 * 60 * 60 * 1000; // 24 hours
  const cutoffTime = now - lookbackMs;

  // Filter to last 24 hours
  const recentVolumes = volumeHistory.filter(
    (record) => record.timestamp >= cutoffTime && record.symbol.startsWith(tenantId)
  );

  // Calculate total daily volume
  const dailyVolume = recentVolumes.reduce(
    (sum, record) => sum + record.value,
    0
  );

  const projectedVolume = dailyVolume + newOrderValue;
  const usagePercent = (projectedVolume / config.dailyVolumeLimit) * 100;

  if (projectedVolume > config.dailyVolumeLimit) {
    return {
      passed: false,
      rejectedReason: `Projected daily volume $${projectedVolume.toLocaleString()} exceeds limit $${config.dailyVolumeLimit.toLocaleString()}`,
      currentUsage: {
        dailyVolume,
        dailyLimit: config.dailyVolumeLimit,
        usagePercent,
      },
    };
  }

  return {
    passed: true,
    currentUsage: {
      dailyVolume,
      dailyLimit: config.dailyVolumeLimit,
      usagePercent,
    },
  };
}

/**
 * Detect volume spike compared to baseline
 */
export function checkVolumeSpike(
  currentVolume: number,
  baselineHistory: VolumeRecord[],
  threshold: number
): { isSpike: boolean; baselineAverage: number; spikeMultiplier: number } {
  if (baselineHistory.length === 0) {
    return {
      isSpike: false,
      baselineAverage: 0,
      spikeMultiplier: 0,
    };
  }

  // Calculate average volume from baseline
  const baselineAverage =
    baselineHistory.reduce((sum, r) => sum + r.value, 0) / baselineHistory.length;

  if (baselineAverage === 0) {
    return {
      isSpike: false,
      baselineAverage: 0,
      spikeMultiplier: 0,
    };
  }

  const spikeMultiplier = currentVolume / baselineAverage;
  const isSpike = spikeMultiplier > threshold;

  return {
    isSpike,
    baselineAverage,
    spikeMultiplier,
  };
}

/**
 * Max Order Limits checker class
 */
export class MaxOrderLimitsChecker {
  private volumeHistory: VolumeRecord[] = [];
  private readonly maxHistorySize = 10000;

  constructor(
    private config: OrderLimitsConfig = DEFAULT_LIMITS
  ) {}

  /**
   * Validate order against all limits
   */
  validateOrder(
    tenantId: string,
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    price?: number
  ): LimitsCheckResult {
    // Check max order size
    const sizeCheck = checkMaxOrderSize(amount, price, this.config);
    if (!sizeCheck.passed) {
      return sizeCheck;
    }

    // Check daily volume limit
    const orderValue = price !== undefined ? amount * price : amount;
    const volumeCheck = checkDailyVolumeLimit(
      tenantId,
      orderValue,
      this.config,
      this.volumeHistory
    );

    if (!volumeCheck.passed) {
      return volumeCheck;
    }

    // Check volume spike
    const spikeCheck = this.checkForVolumeSpike(tenantId, orderValue);
    if (spikeCheck.isSpike) {
      return {
        passed: false,
        rejectedReason: `Volume spike detected: ${spikeCheck.spikeMultiplier.toFixed(2)}x baseline (threshold: ${this.config.volumeSpikeThreshold}x)`,
      };
    }

    return { passed: true };
  }

  /**
   * Record executed order volume
   */
  recordExecution(
    tenantId: string,
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    price: number
  ): void {
    this.volumeHistory.push({
      timestamp: Date.now(),
      amount,
      value: amount * price,
      symbol: `${tenantId}:${symbol}`,
      side,
    });

    // Rotate history if exceeds max size
    if (this.volumeHistory.length > this.maxHistorySize) {
      this.volumeHistory = this.volumeHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<OrderLimitsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current daily usage stats
   */
  getDailyUsage(tenantId: string): { volume: number; limit: number; percent: number } {
    const now = Date.now();
    const cutoffTime = now - (24 * 60 * 60 * 1000);

    const recentVolumes = this.volumeHistory.filter(
      (record) => record.timestamp >= cutoffTime && record.symbol.startsWith(tenantId)
    );

    const volume = recentVolumes.reduce((sum, r) => sum + r.value, 0);
    const percent = (volume / this.config.dailyVolumeLimit) * 100;

    return {
      volume,
      limit: this.config.dailyVolumeLimit,
      percent,
    };
  }

  /**
   * Clear volume history
   */
  clearHistory(): void {
    this.volumeHistory = [];
  }

  /**
   * Private helper: check for volume spike
   */
  private checkForVolumeSpike(
    tenantId: string,
    newOrderValue: number
  ): { isSpike: boolean; baselineAverage: number; spikeMultiplier: number } {
    const now = Date.now();
    const lookbackMs = this.config.baselineLookbackHours * 60 * 60 * 1000;
    const cutoffTime = now - lookbackMs;

    const baselineHistory = this.volumeHistory.filter(
      (record) =>
        record.timestamp >= cutoffTime &&
        record.timestamp < now &&
        record.symbol.startsWith(tenantId)
    );

    return checkVolumeSpike(newOrderValue, baselineHistory, this.config.volumeSpikeThreshold);
  }
}

/**
 * Check leverage against tier-based caps
 * Returns rejection if requested leverage exceeds tier maximum
 */
export function checkLeverageCap(
  requestedLeverage: number,
  tier: string
): LeverageCheckResult {
  const normalizedTier = tier.toLowerCase();
  const maxAllowed = TIER_LEVERAGE_CAPS[normalizedTier] ?? TIER_LEVERAGE_CAPS.free;

  if (requestedLeverage > maxAllowed) {
    return {
      passed: false,
      rejectedReason: `Leverage ${requestedLeverage}x exceeds ${normalizedTier.toUpperCase()} tier maximum of ${maxAllowed}x`,
      requestedLeverage,
      maxAllowed,
      tier: normalizedTier,
    };
  }

  return {
    passed: true,
    requestedLeverage,
    maxAllowed,
    tier: normalizedTier,
  };
}

/**
 * Factory function to create limits checker
 */
export function createMaxOrderLimitsChecker(
  config?: OrderLimitsConfig
): MaxOrderLimitsChecker {
  return new MaxOrderLimitsChecker(config);
}
