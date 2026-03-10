/**
 * Market Regime Detector — Classifies market conditions using price history.
 * Supports: trending_up, trending_down, ranging, volatile
 * Uses linear regression slope, volatility (std dev of returns), and ADX-like directional strength.
 */

import { EventEmitter } from 'events';

export type MarketRegime = 'trending_up' | 'trending_down' | 'ranging' | 'volatile';

export interface RegimeStats {
  regime: MarketRegime;
  confidence: number;
  slope: number;
  volatility: number;
  directionalStrength: number;
  sampleCount: number;
}

export interface ArbParamSuggestion {
  minSpreadMultiplier: number;
  cooldownMultiplier: number;
  positionSizeMultiplier: number;
  reason: string;
}

interface RegimeDetectorConfig {
  /** Sliding window size. Default 50 */
  windowSize?: number;
  /** Directional strength threshold to confirm trend. Default 0.6 */
  trendStrengthThreshold?: number;
  /** Volatility multiplier to classify as volatile. Default 2.0 */
  volatilityMultiplier?: number;
  /** Minimum prices needed before detection. Default 5 */
  minSamples?: number;
}

interface RegimeRecord {
  regime: MarketRegime;
  timestamp: number;
}

/** Compute linear regression slope (y over x=0..n-1). */
function linearRegressionSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - meanX) * (values[i] - meanY);
    den += (i - meanX) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

/** Compute standard deviation of an array. */
function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * ADX-like directional strength: |net move| / total absolute moves.
 * 1 = perfectly directional; 0 = perfectly oscillating.
 */
function directionalStrength(closes: number[]): number {
  if (closes.length < 2) return 0;
  let totalAbs = 0;
  let net = 0;
  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    totalAbs += Math.abs(diff);
    net += diff;
  }
  return totalAbs === 0 ? 0 : Math.abs(net) / totalAbs;
}

/** Compute returns (percent change) between consecutive prices. */
function returns(closes: number[]): number[] {
  const r: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] !== 0) {
      r.push((closes[i] - closes[i - 1]) / closes[i - 1]);
    }
  }
  return r;
}

export class MarketRegimeDetector extends EventEmitter {
  private readonly config: Required<RegimeDetectorConfig>;
  private prices: number[] = [];
  private currentRegime: MarketRegime = 'ranging';
  private currentConfidence = 0;
  private regimeHistory: RegimeRecord[] = [];
  private longTermVolatility = 0; // rolling average volatility for baseline

  constructor(config: RegimeDetectorConfig = {}) {
    super();
    this.config = {
      windowSize: config.windowSize ?? 50,
      trendStrengthThreshold: config.trendStrengthThreshold ?? 0.6,
      volatilityMultiplier: config.volatilityMultiplier ?? 2.0,
      minSamples: config.minSamples ?? 5,
    };
  }

  /** Feed a new price (close) into the detector. */
  addPrice(price: number): void {
    this.prices.push(price);
    // Keep only the last windowSize * 2 prices for long-term vol baseline
    if (this.prices.length > this.config.windowSize * 2) {
      this.prices.shift();
    }
    this._recompute();
  }

  /** Get the current market regime. */
  getRegime(): MarketRegime {
    return this.currentRegime;
  }

  /** Get confidence in current regime (0–1). */
  getConfidence(): number {
    return this.currentConfidence;
  }

  /** Get detailed stats for the current window. */
  getStats(): RegimeStats {
    const window = this._window();
    const ret = returns(window);
    const vol = stdDev(ret);
    const slope = linearRegressionSlope(window);
    const ds = directionalStrength(window);
    return {
      regime: this.currentRegime,
      confidence: this.currentConfidence,
      slope,
      volatility: vol,
      directionalStrength: ds,
      sampleCount: window.length,
    };
  }

  /**
   * Suggest arb parameters based on current regime.
   * trending: wider spreads, smaller size (trend risk)
   * ranging: tighter spreads, normal size (ideal for arb)
   * volatile: wider spreads, smaller size, longer cooldown
   */
  suggestArbParams(): ArbParamSuggestion {
    switch (this.currentRegime) {
      case 'trending_up':
        return {
          minSpreadMultiplier: 1.5,
          cooldownMultiplier: 1.2,
          positionSizeMultiplier: 0.6,
          reason: 'Trending up: wider spreads and smaller positions to reduce trend risk',
        };
      case 'trending_down':
        return {
          minSpreadMultiplier: 1.5,
          cooldownMultiplier: 1.2,
          positionSizeMultiplier: 0.6,
          reason: 'Trending down: wider spreads and smaller positions to reduce trend risk',
        };
      case 'volatile':
        return {
          minSpreadMultiplier: 2.0,
          cooldownMultiplier: 2.0,
          positionSizeMultiplier: 0.4,
          reason: 'Volatile: significantly wider spreads, longer cooldown, reduced size',
        };
      case 'ranging':
      default:
        return {
          minSpreadMultiplier: 0.8,
          cooldownMultiplier: 0.8,
          positionSizeMultiplier: 1.0,
          reason: 'ranging: tighter spreads and normal position size — ideal for arb',
        };
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private _window(): number[] {
    return this.prices.slice(-this.config.windowSize);
  }

  private _recompute(): void {
    const window = this._window();
    if (window.length < this.config.minSamples) {
      return; // Not enough data yet
    }

    const ret = returns(window);
    const vol = stdDev(ret);
    const slope = linearRegressionSlope(window);
    const ds = directionalStrength(window);

    // Update long-term volatility baseline using exponential smoothing
    if (this.longTermVolatility === 0) {
      this.longTermVolatility = vol;
    } else {
      this.longTermVolatility = this.longTermVolatility * 0.95 + vol * 0.05;
    }

    const prevRegime = this.currentRegime;
    let regime: MarketRegime;
    let confidence: number;

    const volBaseline = this.longTermVolatility;
    const isVolatile =
      volBaseline > 0 && vol > this.config.volatilityMultiplier * volBaseline;

    if (isVolatile) {
      regime = 'volatile';
      confidence = Math.min(1, vol / (this.config.volatilityMultiplier * volBaseline + 1e-10));
    } else if (ds >= this.config.trendStrengthThreshold && slope > 0) {
      regime = 'trending_up';
      confidence = Math.min(1, ds);
    } else if (ds >= this.config.trendStrengthThreshold && slope < 0) {
      regime = 'trending_down';
      confidence = Math.min(1, ds);
    } else {
      regime = 'ranging';
      // Confidence: higher when ds is low (clearly ranging)
      confidence = Math.min(1, 1 - ds);
    }

    // Scale confidence with data sufficiency
    const dataSufficiency = Math.min(1, window.length / this.config.windowSize);
    confidence = confidence * dataSufficiency;

    this.currentRegime = regime;
    this.currentConfidence = Math.max(0, Math.min(1, confidence));

    if (regime !== prevRegime) {
      const record: RegimeRecord = { regime, timestamp: Date.now() };
      this.regimeHistory.push(record);
      this.emit('regime:change', { previous: prevRegime, current: regime, confidence: this.currentConfidence });
    }
  }
}
