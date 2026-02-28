/**
 * Signal Filter — Pre-trade signal quality filter.
 * Market regime detection (trending/ranging/volatile), signal scoring, cooldown, volume confirmation.
 */

import { ICandle } from '../interfaces/candle-types';
import { SignalType } from '../interfaces/strategy-types';
import { ConsensusSignal } from './signal-generator';

export type MarketRegime = 'trending' | 'ranging' | 'volatile';

export interface RegimeState {
  regime: MarketRegime;
  adx: number;
  volatilityRatio: number;
  trendStrength: number;
}

export interface SignalScore {
  total: number;
  regimeAlignment: number;
  volumeScore: number;
  momentumScore: number;
  confluenceScore: number;
}

export interface FilterResult {
  pass: boolean;
  signal: ConsensusSignal;
  score: SignalScore;
  regime: RegimeState;
  rejectReason?: string;
}

export interface SignalFilterConfig {
  minScore: number;
  cooldownMs: number;
  minVolume: number;
  adxTrendThreshold: number;
  adxRangingThreshold: number;
  volatilityHighThreshold: number;
  lookbackPeriod: number;
}

const DEFAULT_CONFIG: SignalFilterConfig = {
  minScore: 50, cooldownMs: 3600000, minVolume: 0.5,
  adxTrendThreshold: 25, adxRangingThreshold: 20,
  volatilityHighThreshold: 2.0, lookbackPeriod: 50,
};

export class SignalFilter {
  private config: SignalFilterConfig;
  private recentCandles: ICandle[] = [];
  private lastTradeTime = 0;

  constructor(config?: Partial<SignalFilterConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** Feed candle data for regime detection */
  updateCandle(candle: ICandle): void {
    this.recentCandles.push(candle);
    const maxLen = this.config.lookbackPeriod + 20;
    if (this.recentCandles.length > maxLen) {
      this.recentCandles = this.recentCandles.slice(-maxLen);
    }
  }

  /** Evaluate consensus signal through all filters */
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

  recordTrade(timestamp: number): void { this.lastTradeTime = timestamp; }

  /** Detect current market regime from recent candles */
  detectRegime(): RegimeState {
    if (this.recentCandles.length < 14) {
      return { regime: 'ranging', adx: 0, volatilityRatio: 1, trendStrength: 0 };
    }
    const closes = this.recentCandles.map(c => c.close);
    const period = Math.min(this.config.lookbackPeriod, closes.length);
    const recent = closes.slice(-period);

    const adx = this.calculateADX(this.recentCandles.slice(-period));
    const recentVol = this.stddev(recent.slice(-14));
    const historicalVol = this.stddev(recent);
    const volatilityRatio = historicalVol > 0 ? recentVol / historicalVol : 1;
    const trendStrength = this.rSquared(recent);

    let regime: MarketRegime;
    if (volatilityRatio > this.config.volatilityHighThreshold) regime = 'volatile';
    else if (adx > this.config.adxTrendThreshold) regime = 'trending';
    else regime = 'ranging';

    return { regime, adx, volatilityRatio, trendStrength };
  }

  private scoreSignal(signal: ConsensusSignal, candle: ICandle, regime: RegimeState): SignalScore {
    let regimeAlignment = 15;
    if (regime.regime === 'trending' && signal.confidence > 0.7) regimeAlignment = 25;
    else if (regime.regime === 'volatile') regimeAlignment = 5;
    else if (regime.regime === 'ranging' && signal.confidence < 0.5) regimeAlignment = 8;

    const avgVolume = this.averageVolume();
    const volumeScore = avgVolume > 0 ? Math.min(25, (candle.volume / avgVolume) * 15) : 12.5;
    const momentumScore = this.calculateMomentumScore(signal.type);
    const voteRatio = signal.votes.length / Math.max(signal.metadata.totalWeight, 1);
    const confluenceScore = Math.min(25, signal.confidence * 20 + voteRatio * 5);
    const total = Math.round(regimeAlignment + volumeScore + momentumScore + confluenceScore);

    return { total: Math.min(100, Math.max(0, total)), regimeAlignment, volumeScore, momentumScore, confluenceScore };
  }

  private calculateADX(candles: ICandle[]): number {
    if (candles.length < 14) return 0;
    let plusDM = 0, minusDM = 0, trSum = 0;
    for (let i = 1; i < candles.length; i++) {
      const upMove = candles[i].high - candles[i - 1].high;
      const downMove = candles[i - 1].low - candles[i].low;
      if (upMove > downMove && upMove > 0) plusDM += upMove;
      if (downMove > upMove && downMove > 0) minusDM += downMove;
      const tr = Math.max(candles[i].high - candles[i].low,
        Math.abs(candles[i].high - candles[i - 1].close),
        Math.abs(candles[i].low - candles[i - 1].close));
      trSum += tr;
    }
    if (trSum === 0) return 0;
    const plusDI = (plusDM / trSum) * 100;
    const minusDI = (minusDM / trSum) * 100;
    const diSum = plusDI + minusDI;
    return diSum === 0 ? 0 : (Math.abs(plusDI - minusDI) / diSum) * 100;
  }

  private calculateMomentumScore(signalType: SignalType): number {
    if (this.recentCandles.length < 10) return 12.5;
    const recent = this.recentCandles.slice(-10);
    const pctChange = ((recent[recent.length - 1].close - recent[0].close) / recent[0].close) * 100;
    if (signalType === SignalType.BUY && pctChange > 0) return Math.min(25, 15 + pctChange * 2);
    if (signalType === SignalType.SELL && pctChange < 0) return Math.min(25, 15 + Math.abs(pctChange) * 2);
    return Math.max(5, 12 - Math.abs(pctChange));
  }

  private averageVolume(): number {
    if (this.recentCandles.length === 0) return 0;
    return this.recentCandles.reduce((s, c) => s + c.volume, 0) / this.recentCandles.length;
  }

  private stddev(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    return Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1));
  }

  private rSquared(values: number[]): number {
    if (values.length < 3) return 0;
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = 0; i < n; i++) {
      sumX += i; sumY += values[i]; sumXY += i * values[i]; sumX2 += i * i; sumY2 += values[i] * values[i];
    }
    const num = n * sumXY - sumX * sumY;
    const den = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2));
    if (den === 0) return 0;
    const r = num / den;
    return r * r;
  }
}
