/**
 * AdaptiveSpreadThreshold — Dynamic spread threshold based on market volatility.
 * Auto-adjusts minimum spread entry threshold using EMA of recent spreads,
 * volatility regime detection (low/medium/high), and historical spread distribution.
 *
 * Prevents over-trading in tight-spread markets, increases aggression in wide-spread windows.
 */

import { logger } from '../utils/logger';

export type VolatilityRegime = 'low' | 'medium' | 'high';

export interface RegimeConfig {
  regime: VolatilityRegime;
  spreadMultiplier: number;    // Multiply base threshold by this factor
  minThreshold: number;        // Absolute minimum threshold for this regime
  maxThreshold: number;        // Absolute maximum threshold for this regime
}

export interface ThresholdState {
  currentThreshold: number;       // Active threshold (basis points)
  baseThreshold: number;          // Base/default threshold
  regime: VolatilityRegime;       // Current volatility regime
  spreadEma: number;              // EMA of recent spreads
  volatilityEma: number;          // EMA of spread volatility
  samplesUsed: number;            // Number of samples in calculation
  lastUpdate: number;
  regimeChanges: number;          // Total regime transitions
}

export interface AdaptiveThresholdConfig {
  baseThresholdBps: number;           // Base threshold in basis points (default: 10 = 0.1%)
  emaAlpha: number;                   // EMA smoothing factor (default: 0.1)
  volatilityAlpha: number;            // Volatility EMA smoothing (default: 0.05)
  regimeConfigs: RegimeConfig[];      // Per-regime multipliers
  regimeLowVolThreshold: number;      // Below this = low vol regime (default: 0.05%)
  regimeHighVolThreshold: number;     // Above this = high vol regime (default: 0.3%)
  minSamplesForAdaptation: number;    // Min samples before adapting (default: 20)
  updateIntervalMs: number;           // How often to recalculate (default: 5000)
  cooldownAfterRegimeChangeMs: number; // Wait after regime change (default: 10000)
}

const DEFAULT_REGIME_CONFIGS: RegimeConfig[] = [
  { regime: 'low', spreadMultiplier: 1.5, minThreshold: 15, maxThreshold: 50 },
  { regime: 'medium', spreadMultiplier: 1.0, minThreshold: 10, maxThreshold: 30 },
  { regime: 'high', spreadMultiplier: 0.7, minThreshold: 5, maxThreshold: 25 },
];

const DEFAULT_CONFIG: AdaptiveThresholdConfig = {
  baseThresholdBps: 10,
  emaAlpha: 0.1,
  volatilityAlpha: 0.05,
  regimeConfigs: DEFAULT_REGIME_CONFIGS,
  regimeLowVolThreshold: 0.05,
  regimeHighVolThreshold: 0.3,
  minSamplesForAdaptation: 20,
  updateIntervalMs: 5000,
  cooldownAfterRegimeChangeMs: 10000,
};

export class AdaptiveSpreadThreshold {
  private config: AdaptiveThresholdConfig;
  private spreadHistory: number[] = [];
  private currentThreshold: number;
  private spreadEma = 0;
  private volatilityEma = 0;
  private currentRegime: VolatilityRegime = 'medium';
  private sampleCount = 0;
  private lastRegimeChangeTime = 0;
  private regimeChangeCount = 0;
  private updateTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<AdaptiveThresholdConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    if (!this.config.regimeConfigs || this.config.regimeConfigs.length === 0) {
      this.config.regimeConfigs = DEFAULT_REGIME_CONFIGS;
    }
    this.currentThreshold = this.config.baseThresholdBps;
  }

  /**
   * Feed a new spread observation (in %).
   * Updates EMA, volatility, regime, and threshold.
   */
  observeSpread(spreadPercent: number): void {
    this.sampleCount++;
    this.spreadHistory.push(spreadPercent);

    // Keep history bounded
    if (this.spreadHistory.length > 500) {
      this.spreadHistory.splice(0, this.spreadHistory.length - 500);
    }

    // Update EMAs
    if (this.sampleCount === 1) {
      this.spreadEma = spreadPercent;
      this.volatilityEma = 0;
    } else {
      const prevEma = this.spreadEma;
      this.spreadEma = this.config.emaAlpha * spreadPercent + (1 - this.config.emaAlpha) * this.spreadEma;

      // Volatility = EMA of absolute deviation from spread EMA
      const deviation = Math.abs(spreadPercent - prevEma);
      this.volatilityEma = this.config.volatilityAlpha * deviation + (1 - this.config.volatilityAlpha) * this.volatilityEma;
    }

    // Only adapt after minimum samples
    if (this.sampleCount >= this.config.minSamplesForAdaptation) {
      this.updateRegime();
      this.updateThreshold();
    }
  }

  /**
   * Get current minimum threshold in basis points.
   */
  getThreshold(): number {
    return this.currentThreshold;
  }

  /**
   * Get current threshold as a percentage.
   */
  getThresholdPercent(): number {
    return this.currentThreshold / 100; // bps to %
  }

  /**
   * Check if a spread meets the current adaptive threshold.
   */
  meetsThreshold(spreadPercent: number): boolean {
    return spreadPercent >= this.getThresholdPercent();
  }

  /**
   * Get full state for monitoring.
   */
  getState(): ThresholdState {
    return {
      currentThreshold: this.currentThreshold,
      baseThreshold: this.config.baseThresholdBps,
      regime: this.currentRegime,
      spreadEma: this.spreadEma,
      volatilityEma: this.volatilityEma,
      samplesUsed: this.sampleCount,
      lastUpdate: Date.now(),
      regimeChanges: this.regimeChangeCount,
    };
  }

  /**
   * Get current volatility regime.
   */
  getRegime(): VolatilityRegime {
    return this.currentRegime;
  }

  /**
   * Check if in cooldown after regime change.
   */
  isInCooldown(): boolean {
    return (Date.now() - this.lastRegimeChangeTime) < this.config.cooldownAfterRegimeChangeMs;
  }

  /**
   * Start auto-update timer (for periodic recalculation).
   */
  startAutoUpdate(): void {
    if (this.updateTimer) return;
    this.updateTimer = setInterval(() => {
      if (this.sampleCount >= this.config.minSamplesForAdaptation) {
        this.updateRegime();
        this.updateThreshold();
      }
    }, this.config.updateIntervalMs);
  }

  /**
   * Stop auto-update timer.
   */
  stopAutoUpdate(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  /**
   * Reset to defaults.
   */
  reset(): void {
    this.spreadHistory = [];
    this.currentThreshold = this.config.baseThresholdBps;
    this.spreadEma = 0;
    this.volatilityEma = 0;
    this.currentRegime = 'medium';
    this.sampleCount = 0;
    this.lastRegimeChangeTime = 0;
    this.regimeChangeCount = 0;
    this.stopAutoUpdate();
  }

  /**
   * Detect and update volatility regime based on spread EMA.
   */
  private updateRegime(): void {
    let newRegime: VolatilityRegime;

    if (this.volatilityEma < this.config.regimeLowVolThreshold) {
      newRegime = 'low';
    } else if (this.volatilityEma > this.config.regimeHighVolThreshold) {
      newRegime = 'high';
    } else {
      newRegime = 'medium';
    }

    if (newRegime !== this.currentRegime) {
      const oldRegime = this.currentRegime;
      this.currentRegime = newRegime;
      this.lastRegimeChangeTime = Date.now();
      this.regimeChangeCount++;

      logger.info(
        `[AdaptiveThreshold] Regime change: ${oldRegime} → ${newRegime} ` +
        `(vol EMA: ${this.volatilityEma.toFixed(4)}%, changes: ${this.regimeChangeCount})`
      );
    }
  }

  /**
   * Recalculate threshold based on current regime and spread EMA.
   */
  private updateThreshold(): void {
    const regimeConfig = this.config.regimeConfigs.find(r => r.regime === this.currentRegime);
    if (!regimeConfig) return;

    // Base threshold adjusted by regime multiplier
    let newThreshold = this.config.baseThresholdBps * regimeConfig.spreadMultiplier;

    // Further adjust based on spread EMA (if spreads are consistently wide, lower threshold)
    if (this.spreadEma > 0) {
      const spreadBps = this.spreadEma * 100; // % to bps
      // If avg spread is much higher than threshold, we can be more aggressive
      if (spreadBps > newThreshold * 2) {
        newThreshold *= 0.9; // Slightly lower threshold in wide-spread markets
      }
    }

    // Clamp to regime limits
    newThreshold = Math.max(regimeConfig.minThreshold, Math.min(regimeConfig.maxThreshold, newThreshold));

    this.currentThreshold = Math.round(newThreshold * 100) / 100; // 2 decimal places
  }
}
