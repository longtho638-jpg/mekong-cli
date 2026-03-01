/**
 * RegimeDetector — Market regime classification for adaptive strategy routing.
 * Classifies market state into: trending, mean-reverting, volatile, or quiet.
 *
 * Uses:
 * - Volatility ratio (short/long) for trend detection
 * - Hurst exponent approximation (R/S analysis) for mean-reversion detection
 * - Spread coefficient of variation for noise classification
 *
 * Output drives AgiArbitrageEngine strategy selection:
 *   trending     → larger positions, wider thresholds
 *   mean-revert  → aggressive execution, tighter thresholds
 *   volatile     → reduce size, raise score threshold
 *   quiet        → minimal trading, wait for regime shift
 */

export type MarketRegime = 'trending' | 'mean-reverting' | 'volatile' | 'quiet';

export interface RegimeSignal {
  regime: MarketRegime;
  confidence: number;       // 0-1
  hurstExponent: number;    // <0.5 = mean-revert, >0.5 = trending
  volatilityRatio: number;  // short/long vol ratio
  spreadCv: number;         // coefficient of variation
  timestamp: number;
}

export interface RegimeDetectorConfig {
  shortWindow: number;      // Short vol window (default: 20)
  longWindow: number;       // Long vol window (default: 100)
  hurstLag: number;         // R/S lag count (default: 10)
  trendingHurst: number;    // Hurst > this = trending (default: 0.6)
  meanRevertHurst: number;  // Hurst < this = mean-reverting (default: 0.4)
  volatileThreshold: number; // Vol ratio > this = volatile (default: 1.5)
  quietThreshold: number;   // Vol ratio < this = quiet (default: 0.5)
}

const DEFAULT_CONFIG: RegimeDetectorConfig = {
  shortWindow: 20,
  longWindow: 100,
  hurstLag: 10,
  trendingHurst: 0.6,
  meanRevertHurst: 0.4,
  volatileThreshold: 1.5,
  quietThreshold: 0.5,
};

export class RegimeDetector {
  private config: RegimeDetectorConfig;
  private spreads: number[] = [];
  private history: RegimeSignal[] = [];

  constructor(config?: Partial<RegimeDetectorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** Add a spread observation (spread % between exchanges). */
  addSpread(spreadPercent: number): void {
    this.spreads.push(spreadPercent);
    // Keep max 2x longWindow to limit memory
    const maxLen = this.config.longWindow * 2;
    if (this.spreads.length > maxLen) {
      this.spreads = this.spreads.slice(-maxLen);
    }
  }

  /** Classify current market regime from accumulated spread data. */
  detect(): RegimeSignal {
    const now = Date.now();

    if (this.spreads.length < this.config.shortWindow) {
      const signal: RegimeSignal = {
        regime: 'quiet', confidence: 0, hurstExponent: 0.5,
        volatilityRatio: 1, spreadCv: 0, timestamp: now,
      };
      this.history.push(signal);
      return signal;
    }

    const volatilityRatio = this.calcVolatilityRatio();
    const hurstExponent = this.calcHurstExponent();
    const spreadCv = this.calcCoefficientOfVariation();

    const { regime, confidence } = this.classify(volatilityRatio, hurstExponent, spreadCv);

    const signal: RegimeSignal = {
      regime, confidence, hurstExponent, volatilityRatio, spreadCv, timestamp: now,
    };

    this.history.push(signal);
    if (this.history.length > 500) this.history.splice(0, this.history.length - 500);

    return signal;
  }

  /** Compute short/long volatility ratio. */
  private calcVolatilityRatio(): number {
    const shortVol = this.stddev(this.spreads.slice(-this.config.shortWindow));
    const longVol = this.stddev(
      this.spreads.slice(-Math.min(this.spreads.length, this.config.longWindow))
    );
    if (longVol === 0) return 1;
    return shortVol / longVol;
  }

  /** Approximate Hurst exponent via simplified R/S analysis. */
  private calcHurstExponent(): number {
    const data = this.spreads.slice(-Math.min(this.spreads.length, this.config.longWindow));
    if (data.length < 10) return 0.5;

    const lags: number[] = [];
    const rsValues: number[] = [];

    for (let lag = 2; lag <= Math.min(this.config.hurstLag, Math.floor(data.length / 2)); lag++) {
      const chunkSize = Math.floor(data.length / lag);
      if (chunkSize < 2) continue;

      let rsSum = 0;
      let chunks = 0;

      for (let i = 0; i < lag; i++) {
        const chunk = data.slice(i * chunkSize, (i + 1) * chunkSize);
        const rs = this.rescaledRange(chunk);
        if (rs > 0) {
          rsSum += rs;
          chunks++;
        }
      }

      if (chunks > 0) {
        lags.push(Math.log(chunkSize));
        rsValues.push(Math.log(rsSum / chunks));
      }
    }

    if (lags.length < 2) return 0.5;

    // Linear regression slope = Hurst exponent
    return this.linearRegressionSlope(lags, rsValues);
  }

  /** Rescaled range of a data chunk. */
  private rescaledRange(data: number[]): number {
    if (data.length < 2) return 0;
    const mean = this.mean(data);
    const deviations = data.map(d => d - mean);

    // Cumulative deviations
    const cumDev: number[] = [];
    let sum = 0;
    for (const d of deviations) {
      sum += d;
      cumDev.push(sum);
    }

    const range = Math.max(...cumDev) - Math.min(...cumDev);
    const s = this.stddev(data);

    return s === 0 ? 0 : range / s;
  }

  /** Coefficient of variation of recent spreads. */
  private calcCoefficientOfVariation(): number {
    const recent = this.spreads.slice(-this.config.shortWindow);
    const m = this.mean(recent);
    if (m === 0) return 0;
    return this.stddev(recent) / Math.abs(m);
  }

  /** Classify regime from indicators. */
  private classify(volRatio: number, hurst: number, cv: number): { regime: MarketRegime; confidence: number } {
    // Volatile: high short-term vol relative to long-term
    if (volRatio > this.config.volatileThreshold) {
      const confidence = Math.min(1, (volRatio - this.config.volatileThreshold) / 1.0);
      return { regime: 'volatile', confidence: 0.5 + confidence * 0.5 };
    }

    // Quiet: very low volatility
    if (volRatio < this.config.quietThreshold && cv < 0.3) {
      const confidence = Math.min(1, (this.config.quietThreshold - volRatio) / this.config.quietThreshold);
      return { regime: 'quiet', confidence: 0.5 + confidence * 0.5 };
    }

    // Trending: Hurst > threshold
    if (hurst > this.config.trendingHurst) {
      const confidence = Math.min(1, (hurst - this.config.trendingHurst) / 0.3);
      return { regime: 'trending', confidence: 0.5 + confidence * 0.5 };
    }

    // Mean-reverting: Hurst < threshold
    if (hurst < this.config.meanRevertHurst) {
      const confidence = Math.min(1, (this.config.meanRevertHurst - hurst) / 0.3);
      return { regime: 'mean-reverting', confidence: 0.5 + confidence * 0.5 };
    }

    // Ambiguous — default to quiet with low confidence
    return { regime: 'quiet', confidence: 0.3 };
  }

  // --- Math utilities ---

  private mean(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((s, v) => s + v, 0) / arr.length;
  }

  private stddev(arr: number[]): number {
    if (arr.length < 2) return 0;
    const m = this.mean(arr);
    const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1);
    return Math.sqrt(variance);
  }

  private linearRegressionSlope(x: number[], y: number[]): number {
    const n = x.length;
    const mx = this.mean(x);
    const my = this.mean(y);
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (x[i] - mx) * (y[i] - my);
      den += (x[i] - mx) ** 2;
    }
    return den === 0 ? 0.5 : num / den;
  }

  // --- Accessors ---

  getHistory(): RegimeSignal[] { return [...this.history]; }

  getLatestRegime(): MarketRegime {
    return this.history.length > 0 ? this.history[this.history.length - 1].regime : 'quiet';
  }

  getRegimeDistribution(): Record<MarketRegime, number> {
    const dist: Record<MarketRegime, number> = { trending: 0, 'mean-reverting': 0, volatile: 0, quiet: 0 };
    for (const s of this.history) dist[s.regime]++;
    return dist;
  }

  getSpreadCount(): number { return this.spreads.length; }

  reset(): void {
    this.spreads = [];
    this.history = [];
  }
}
