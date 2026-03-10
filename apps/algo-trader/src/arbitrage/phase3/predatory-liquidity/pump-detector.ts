/**
 * PumpDetector — aggregates social sentiment, whale alerts, and volume signals
 * to compute pump probability per asset. Emits 'pump:detected' when threshold exceeded.
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';

export interface PumpSignal {
  asset: string;
  probability: number;
  source: 'social' | 'whale' | 'volume';
  evidence: string;
  timestamp: number;
}

interface SocialSignalInput {
  asset: string;
  sentiment: number; // 0–1, higher = more bullish
  source: string;
}

interface WhaleAlertInput {
  asset: string;
  amount: number;      // USD equivalent
  direction: 'in' | 'out';
  exchange: string;
}

interface PumpDetectorConfig {
  pumpThreshold: number;  // probability 0–1 to emit pump:detected
  windowMs?: number;
}

interface SignalAccumulator {
  socialScore: number;
  whaleScore: number;
  socialCount: number;
  whaleCount: number;
  lastUpdated: number;
}

const DEFAULT_WINDOW_MS = 60_000;

export class PumpDetector extends EventEmitter {
  private config: Required<PumpDetectorConfig>;
  private signals: Map<string, SignalAccumulator> = new Map();

  constructor(config: PumpDetectorConfig) {
    super();
    this.config = {
      pumpThreshold: config.pumpThreshold,
      windowMs: config.windowMs ?? DEFAULT_WINDOW_MS,
    };
  }

  ingestSocialSignal(signal: SocialSignalInput): void {
    const acc = this.getOrCreate(signal.asset);
    // Exponential moving average of sentiment
    acc.socialScore = acc.socialCount === 0
      ? signal.sentiment
      : acc.socialScore * 0.8 + signal.sentiment * 0.2;
    acc.socialCount++;
    acc.lastUpdated = Date.now();
    logger.debug(`[PumpDetector] Social signal ${signal.asset} sentiment=${signal.sentiment.toFixed(2)} from ${signal.source}`);
    this.checkThreshold(signal.asset, 'social', signal.source);
  }

  ingestWhaleAlert(alert: WhaleAlertInput): void {
    const acc = this.getOrCreate(alert.asset);
    // Large inflows are bullish (pump signal)
    const whaleScore = alert.direction === 'in'
      ? Math.min(1, alert.amount / 1_000_000) // normalize to $1M
      : 0;
    acc.whaleScore = acc.whaleCount === 0
      ? whaleScore
      : acc.whaleScore * 0.7 + whaleScore * 0.3;
    acc.whaleCount++;
    acc.lastUpdated = Date.now();
    logger.debug(`[PumpDetector] Whale alert ${alert.asset} $${alert.amount} ${alert.direction} on ${alert.exchange}`);
    this.checkThreshold(alert.asset, 'whale', `${alert.exchange} ${alert.direction}`);
  }

  analyze(asset: string): PumpSignal {
    const acc = this.signals.get(asset);
    if (!acc) {
      return { asset, probability: 0, source: 'volume', evidence: 'No signals', timestamp: Date.now() };
    }

    const probability = (acc.socialScore * 0.5 + acc.whaleScore * 0.5);
    const dominantSource: 'social' | 'whale' | 'volume' =
      acc.socialScore >= acc.whaleScore ? 'social' : 'whale';
    const evidence = `social=${acc.socialScore.toFixed(2)} whale=${acc.whaleScore.toFixed(2)} counts(s=${acc.socialCount},w=${acc.whaleCount})`;

    return { asset, probability, source: dominantSource, evidence, timestamp: Date.now() };
  }

  private checkThreshold(asset: string, source: 'social' | 'whale' | 'volume', evidence: string): void {
    const signal = this.analyze(asset);
    if (signal.probability >= this.config.pumpThreshold) {
      logger.info(`[PumpDetector] PUMP DETECTED ${asset} prob=${signal.probability.toFixed(2)}`);
      this.emit('pump:detected', signal);
    }
  }

  private getOrCreate(asset: string): SignalAccumulator {
    if (!this.signals.has(asset)) {
      this.signals.set(asset, { socialScore: 0, whaleScore: 0, socialCount: 0, whaleCount: 0, lastUpdated: 0 });
    }
    return this.signals.get(asset)!;
  }

  reset(): void {
    this.signals.clear();
  }
}
