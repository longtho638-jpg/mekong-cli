/**
 * Alpha Signal Generator — emits pre-emptive limit order signals
 * when orderbook imbalance exceeds a configurable threshold.
 * Uses EventEmitter pattern consistent with other phases.
 */

import { EventEmitter } from 'events';
import type { ImbalancePrediction } from './orderbook-imbalance-model';
import type { LiquidityScore } from './liquidity-score-calculator';
import type { FeatureVector } from './feature-extractor';

export type SignalSide = 'buy' | 'sell';

export interface AlphaSignal {
  side: SignalSide;
  symbol: string;
  /** Suggested limit price relative to mid */
  limitPrice: number;
  /** Suggested order size in base currency */
  size: number;
  /** Confidence of the signal [0,1] */
  confidence: number;
  /** Imbalance value that triggered the signal */
  imbalance: number;
  liquidityScore: number;
  timestamp: number;
}

export interface AlphaSignalConfig {
  symbol: string;
  /** Imbalance threshold to trigger a signal [0,1] */
  imbalanceThreshold: number;
  /** Minimum liquidity score required to emit signal */
  minLiquidityScore: number;
  /** Limit price offset in bps from mid */
  limitOffsetBps: number;
  /** Base order size in currency units */
  baseOrderSize: number;
  dryRun: boolean;
}

const DEFAULT_CONFIG: AlphaSignalConfig = {
  symbol: 'BTC/USDT',
  imbalanceThreshold: 0.7,
  minLiquidityScore: 0.4,
  limitOffsetBps: 2,
  baseOrderSize: 0.01,
  dryRun: true,
};

export class AlphaSignalGenerator extends EventEmitter {
  private readonly cfg: AlphaSignalConfig;
  private signalCount = 0;

  constructor(config: Partial<AlphaSignalConfig> = {}) {
    super();
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Evaluate features, prediction and liquidity score.
   * Emits 'signal' event if conditions are met.
   */
  evaluate(
    features: FeatureVector,
    prediction: ImbalancePrediction,
    liquidity: LiquidityScore,
  ): AlphaSignal | null {
    if (liquidity.score < this.cfg.minLiquidityScore) return null;

    const imbalance = prediction.buyPressure - prediction.sellPressure;
    const absImbalance = Math.abs(imbalance);

    if (absImbalance < this.cfg.imbalanceThreshold) return null;

    const side: SignalSide = imbalance > 0 ? 'buy' : 'sell';
    const offsetFactor = this.cfg.limitOffsetBps / 10_000;

    // Place limit slightly inside the book to improve fill probability
    const limitPrice =
      side === 'buy'
        ? features.midPrice * (1 - offsetFactor)
        : features.midPrice * (1 + offsetFactor);

    // Scale size by imbalance strength and liquidity
    const sizeMultiplier = absImbalance * liquidity.score;
    const size = this.cfg.baseOrderSize * sizeMultiplier;

    const signal: AlphaSignal = {
      side,
      symbol: this.cfg.symbol,
      limitPrice,
      size,
      confidence: prediction.confidence * absImbalance,
      imbalance,
      liquidityScore: liquidity.score,
      timestamp: features.timestamp,
    };

    this.signalCount++;

    if (!this.cfg.dryRun) {
      this.emit('signal', signal);
    } else {
      this.emit('signal:dry', signal);
    }

    return signal;
  }

  getSignalCount(): number {
    return this.signalCount;
  }

  getConfig(): AlphaSignalConfig {
    return { ...this.cfg };
  }
}
