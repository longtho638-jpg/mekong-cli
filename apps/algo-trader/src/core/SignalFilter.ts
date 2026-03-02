/**
 * SignalFilter — Pre-trade signal quality filter.
 * Market regime detection, signal scoring, cooldown, volume confirmation.
 * Sits between SignalGenerator and order execution.
 */

import { ICandle } from '../interfaces/ICandle';
import { ConsensusSignal } from './SignalGenerator';
import {
  SignalFilterConfig,
  SignalScore,
  FilterResult,
  DEFAULT_SIGNAL_FILTER_CONFIG,
} from './signal-filter-types';
import { detectMarketRegime, RegimeState } from './signal-market-regime-detector';
import { calculateMomentumScore, averageVolume } from './signal-filter-math-helpers';

// Re-export types for backward compatibility
export type { MarketRegime, RegimeState } from './signal-market-regime-detector';
export type { SignalScore, FilterResult, SignalFilterConfig } from './signal-filter-types';

export class SignalFilter {
  private config: SignalFilterConfig;
  private recentCandles: ICandle[] = [];
  private lastTradeTime = 0;

  constructor(config?: Partial<SignalFilterConfig>) {
    this.config = { ...DEFAULT_SIGNAL_FILTER_CONFIG, ...config };
  }

  /**
   * Feed candle data for regime detection.
   * Must be called before evaluate() for accurate regime detection.
   */
  updateCandle(candle: ICandle): void {
    this.recentCandles.push(candle);
    const maxLen = this.config.lookbackPeriod + 20;
    if (this.recentCandles.length > maxLen) {
      this.recentCandles = this.recentCandles.slice(-maxLen);
    }
  }

  /**
   * Evaluate a consensus signal through all filters.
   */
  evaluate(signal: ConsensusSignal, currentCandle: ICandle): FilterResult {
    const regime = this.detectRegime();
    const score = this.scoreSignal(signal, currentCandle, regime);

    if (this.lastTradeTime > 0 && (currentCandle.timestamp - this.lastTradeTime) < this.config.cooldownMs) {
      return { pass: false, signal, score, regime, rejectReason: 'cooldown_active' };
    }

    if (score.volumeScore < this.config.minVolume * 100) {
      return { pass: false, signal, score, regime, rejectReason: 'low_volume' };
    }

    if (score.total < this.config.minScore) {
      return { pass: false, signal, score, regime, rejectReason: `score_${score.total}_below_${this.config.minScore}` };
    }

    return { pass: true, signal, score, regime };
  }

  /**
   * Mark that a trade was executed (for cooldown tracking).
   */
  recordTrade(timestamp: number): void {
    this.lastTradeTime = timestamp;
  }

  /**
   * Detect current market regime from recent candles.
   */
  detectRegime(): RegimeState {
    return detectMarketRegime(this.recentCandles, this.config);
  }

  /**
   * Score a signal on 0-100 scale based on multiple factors.
   */
  private scoreSignal(signal: ConsensusSignal, candle: ICandle, regime: RegimeState): SignalScore {
    // 1. Regime alignment (0-25): trend signals work best in trending, etc.
    let regimeAlignment = 15; // neutral
    if (regime.regime === 'trending' && signal.confidence > 0.7) {
      regimeAlignment = 25;
    } else if (regime.regime === 'volatile') {
      regimeAlignment = 5;
    } else if (regime.regime === 'ranging' && signal.confidence < 0.5) {
      regimeAlignment = 8;
    }

    // 2. Volume score (0-25): compare current volume to average
    const avgVol = averageVolume(this.recentCandles);
    const volumeScore = avgVol > 0
      ? Math.min(25, (candle.volume / avgVol) * 15)
      : 12.5;

    // 3. Momentum score (0-25): price direction alignment with signal
    const momentumScore = calculateMomentumScore(signal.type, this.recentCandles);

    // 4. Confluence score (0-25): based on consensus confidence + vote count
    const voteRatio = signal.votes.length / Math.max(signal.metadata.totalWeight, 1);
    const confluenceScore = Math.min(25, signal.confidence * 20 + voteRatio * 5);

    const total = Math.round(regimeAlignment + volumeScore + momentumScore + confluenceScore);

    return {
      total: Math.min(100, Math.max(0, total)),
      regimeAlignment,
      volumeScore,
      momentumScore,
      confluenceScore,
    };
  }
}
