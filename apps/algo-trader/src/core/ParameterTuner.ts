/**
 * ParameterTuner - Dynamic parameter adjustment engine
 *
 * Monitors strategy performance and adjusts parameters dynamically:
 * - minEdgeThreshold based on win rate
 * - maxPositionSize based on Kelly criterion
 * - Volatility-based position sizing adjustments
 *
 * Supports manual overrides that persist until cleared.
 */

import { KellyCriterionCalculator, KellyConfig } from "./KellyCriterionCalculator";

/**
 * Strategy performance metrics
 */
export interface PerformanceMetrics {
  strategyId: string;
  winRate: number;        // Win probability (0-1)
  sharpeRatio: number;    // Risk-adjusted return
  totalPnl: number;       // Total P&L in USD
  tradesCount: number;    // Number of trades
  avgDrawdown: number;    // Average drawdown %
  lastUpdated: number;    // Timestamp
}

/**
 * Dynamic risk parameters output
 */
export interface DynamicRiskParams {
  minEdgeThreshold: number; // Minimum edge to enter trade
  maxPositionSize: number;  // Max position in USD
  positionMultiplier: number; // Volatility adjustment (0.5-1.5)
  leverageAdjustment: number; // Leverage multiplier
}

/**
 * Configuration for parameter tuner
 */
export interface ParameterTunerConfig {
  baseBankroll: number;
  baseEdgeThreshold?: number;      // Default: 0.05 (5%)
  basePositionPercent?: number;    // Default: 25%
  volatilitySensitivity?: number;  // Default: 0.5
  kellyConfig?: KellyConfig;
}

/**
 * Manual override for a strategy
 */
export interface ManualOverride {
  strategyId: string;
  minEdgeThreshold?: number;
  maxPositionSize?: number;
  positionMultiplier?: number;
  expiresAt?: number; // Optional expiry timestamp
}

/**
 * Volatility regime classification
 */
export type VolatilityRegime = "low" | "normal" | "high" | "extreme";

/**
 * Cache for performance metrics
 */
interface CachedMetrics {
  metrics: PerformanceMetrics;
  timestamp: number;
}

const DEFAULT_CONFIG: ParameterTunerConfig = {
  baseBankroll: 10000,
  baseEdgeThreshold: 0.05,
  basePositionPercent: 25,
  volatilitySensitivity: 0.5,
};

export class ParameterTuner {
  private config: ParameterTunerConfig;
  private kellyCalculator: KellyCriterionCalculator;
  private performanceCache: Map<string, CachedMetrics> = new Map();
  private manualOverrides: Map<string, ManualOverride> = new Map();
  private volatilityByMarket: Map<string, number> = new Map(); // marketId -> ATR

  constructor(config: ParameterTunerConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.kellyCalculator = new KellyCriterionCalculator(this.config.baseBankroll);
  }

  /**
   * Update bankroll (call when portfolio value changes)
   */
  setBankroll(value: number): void {
    if (value <= 0) {
      throw new Error("Bankroll must be positive");
    }
    this.config.baseBankroll = value;
    this.kellyCalculator.setPortfolioValue(value);
  }

  /**
   * Record trade for Kelly calculation
   */
  recordTrade(strategyId: string, pnl: number): void {
    this.kellyCalculator.recordTrade(strategyId, pnl);
  }

  /**
   * Update performance metrics for a strategy
   */
  updateMetrics(metrics: PerformanceMetrics): void {
    this.performanceCache.set(metrics.strategyId, {
      metrics,
      timestamp: Date.now(),
    });
  }

  /**
   * Get cached metrics for a strategy
   */
  getMetrics(strategyId: string): PerformanceMetrics | null {
    const cached = this.performanceCache.get(strategyId);
    return cached?.metrics ?? null;
  }

  /**
   * Set market volatility (ATR or similar measure)
   */
  setMarketVolatility(marketId: string, volatility: number): void {
    if (volatility < 0) {
      throw new Error("Volatility must be non-negative");
    }
    this.volatilityByMarket.set(marketId, volatility);
  }

  /**
   * Get volatility regime for a market
   */
  getVolatilityRegime(marketId: string, atrPercent?: number): VolatilityRegime {
    const vol = atrPercent ?? this.volatilityByMarket.get(marketId) ?? 2.0;

    if (vol < 1.0) return "low";
    if (vol < 3.0) return "normal";
    if (vol < 6.0) return "high";
    return "extreme";
  }

  /**
   * Calculate volatility-based position multiplier
   * Higher volatility = lower position size
   */
  calculateVolatilityMultiplier(marketId: string, atrPercent?: number): number {
    const vol = atrPercent ?? this.volatilityByMarket.get(marketId) ?? 2.0;
    const sensitivity = this.config.volatilitySensitivity || 0.5;

    // Base multiplier is 1.0 at normal volatility (2%)
    // Reduce by sensitivity * (vol - 2) / 2
    const adjustment = sensitivity * (vol - 2.0) / 2.0;
    const multiplier = 1.0 - adjustment;

    // Clamp to reasonable range [0.3, 1.5]
    return Math.max(0.3, Math.min(1.5, multiplier));
  }

  /**
   * Calculate dynamic risk parameters for a strategy
   */
  getDynamicParams(
    strategyId: string,
    marketId?: string,
    atrPercent?: number
  ): DynamicRiskParams {
    // Check for manual override first
    const override = this.manualOverrides.get(strategyId);
    if (override && (!override.expiresAt || override.expiresAt > Date.now())) {
      return {
        minEdgeThreshold: override.minEdgeThreshold ?? this.config.baseEdgeThreshold!,
        maxPositionSize: override.maxPositionSize ?? this.calculateBaseMaxPosition(strategyId),
        positionMultiplier: override.positionMultiplier ?? 1.0,
        leverageAdjustment: 1.0,
      };
    }

    // Get performance metrics
    const metrics = this.getMetrics(strategyId);
    const KellyResult = this.kellyCalculator.calculateKellyForStrategy(strategyId);

    // Adjust edge threshold based on performance
    let minEdgeThreshold = this.config.baseEdgeThreshold!;
    if (metrics) {
      // Lower threshold for high Sharpe, raise for low Sharpe
      const sharpeAdjustment = metrics.sharpeRatio > 1.5 ? -0.01 :
                               metrics.sharpeRatio < 0.5 ? 0.02 : 0;
      minEdgeThreshold = Math.max(0.02, minEdgeThreshold + sharpeAdjustment);
    }

    // Calculate max position from Kelly
    let maxPositionSize = KellyResult.positionSize;
    if (maxPositionSize <= 0) {
      // Fallback to base position if no Kelly data
      maxPositionSize = this.calculateBaseMaxPosition(strategyId);
    }

    // Apply volatility adjustment
    const volMultiplier = this.calculateVolatilityMultiplier(marketId || "default", atrPercent);

    // Adjust leverage based on volatility regime
    let leverageAdjustment = 1.0;
    const regime = this.getVolatilityRegime(marketId || "default", atrPercent);
    if (regime === "high") leverageAdjustment = 0.7;
    if (regime === "extreme") leverageAdjustment = 0.4;
    if (regime === "low") leverageAdjustment = 1.1;

    return {
      minEdgeThreshold,
      maxPositionSize: maxPositionSize * volMultiplier,
      positionMultiplier: volMultiplier,
      leverageAdjustment,
    };
  }

  /**
   * Set manual override for a strategy
   */
  setManualOverride(override: ManualOverride): void {
    this.manualOverrides.set(override.strategyId, override);
  }

  /**
   * Clear manual override for a strategy
   */
  clearManualOverride(strategyId: string): void {
    this.manualOverrides.delete(strategyId);
  }

  /**
   * Get all active manual overrides
   */
  getManualOverrides(): ManualOverride[] {
    return Array.from(this.manualOverrides.values());
  }

  /**
   * Calculate base max position (without volatility adjustment)
   */
  private calculateBaseMaxPosition(strategyId: string): number {
    const maxPercent = this.config.basePositionPercent! / 100;
    return this.config.baseBankroll * maxPercent;
  }

  /**
   * Get recommended parameters for tuning UI
   */
  getTuningRecommendations(strategyId: string): {
    current: DynamicRiskParams;
    recommended: DynamicRiskParams;
    reason: string;
  } {
    const current = this.getDynamicParams(strategyId);
    const metrics = this.getMetrics(strategyId);
    const reasons: string[] = [];

    // Build recommendation based on metrics
    let recommendedEdge = current.minEdgeThreshold;
    let recommendedPosition = current.maxPositionSize;
    let recommendedMultiplier = current.positionMultiplier;
    let recommendedLeverage = current.leverageAdjustment;

    if (metrics) {
      if (metrics.winRate > 0.6 && metrics.sharpeRatio > 1.5) {
        // Strong performance - can be more aggressive
        recommendedEdge = Math.max(0.02, current.minEdgeThreshold - 0.01);
        recommendedPosition = current.maxPositionSize * 1.1;
        reasons.push("Strong performance: lower edge threshold, increase position");
      } else if (metrics.winRate < 0.4 || metrics.sharpeRatio < 0) {
        // Poor performance - be more conservative
        recommendedEdge = Math.min(0.15, current.minEdgeThreshold + 0.02);
        recommendedPosition = current.maxPositionSize * 0.8;
        reasons.push("Weak performance: raise edge threshold, reduce position");
      }
    }

    return {
      current,
      recommended: {
        minEdgeThreshold: recommendedEdge,
        maxPositionSize: recommendedPosition,
        positionMultiplier: recommendedMultiplier,
        leverageAdjustment: recommendedLeverage,
      },
      reason: reasons.join("; ") || "No significant performance signals",
    };
  }

  /**
   * Reset all cached data (for testing)
   */
  reset(): void {
    this.performanceCache.clear();
    this.manualOverrides.clear();
    this.volatilityByMarket.clear();
    this.kellyCalculator.clearHistory();
  }
}
