import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';
import { SpoofDetector, SpoofSignal, OrderbookDelta } from './spoof-detector';

export type ArbAction = 'proceed' | 'avoid' | 'fade';

export interface ArbDecision {
  action: ArbAction;
  reason: string;
  spoofSignals: SpoofSignal[];
  originalSpread: number;
  adjustedSpread?: number;
}

export interface StrategyHookConfig {
  spoofAvoidThreshold?: number;
  fadeThreshold?: number;
  fadeSpreadMultiplier?: number;
}

export class AdversarialStrategyHook extends EventEmitter {
  private config: Required<StrategyHookConfig>;

  constructor(
    private detector: SpoofDetector,
    config?: StrategyHookConfig
  ) {
    super();
    this.config = {
      spoofAvoidThreshold: config?.spoofAvoidThreshold ?? 0.7,
      fadeThreshold: config?.fadeThreshold ?? 0.9,
      fadeSpreadMultiplier: config?.fadeSpreadMultiplier ?? 1.5,
    };
  }

  evaluateArb(exchange: string, symbol: string, spread: number, side: 'buy' | 'sell'): ArbDecision {
    const allSignals = this.detector.analyze();
    const obSide = side === 'buy' ? 'ask' : 'bid';

    // Filter signals relevant to this exchange/symbol/side
    const relevantSignals = allSignals.filter(
      s => s.exchange === exchange && s.symbol === symbol && s.side === obSide
    );

    if (relevantSignals.length === 0) {
      return {
        action: 'proceed',
        reason: 'No manipulation signals detected',
        spoofSignals: [],
        originalSpread: spread,
      };
    }

    const maxConfidence = Math.max(...relevantSignals.map(s => s.confidence));

    if (maxConfidence >= this.config.fadeThreshold) {
      const adjustedSpread = spread * this.config.fadeSpreadMultiplier;
      const decision: ArbDecision = {
        action: 'fade',
        reason: `High-confidence manipulation (${(maxConfidence * 100).toFixed(1)}%) — fading spread x${this.config.fadeSpreadMultiplier}`,
        spoofSignals: relevantSignals,
        originalSpread: spread,
        adjustedSpread,
      };
      logger.warn(`[AdversarialHook] FADE on ${exchange}:${symbol} — confidence=${(maxConfidence * 100).toFixed(1)}%`);
      this.emit('decision', decision);
      return decision;
    }

    if (maxConfidence >= this.config.spoofAvoidThreshold) {
      const decision: ArbDecision = {
        action: 'avoid',
        reason: `Manipulation detected (${(maxConfidence * 100).toFixed(1)}%) — avoiding trade`,
        spoofSignals: relevantSignals,
        originalSpread: spread,
      };
      logger.warn(`[AdversarialHook] AVOID on ${exchange}:${symbol} — confidence=${(maxConfidence * 100).toFixed(1)}%`);
      this.emit('decision', decision);
      return decision;
    }

    // Below avoid threshold — proceed but note signals
    const decision: ArbDecision = {
      action: 'proceed',
      reason: `Low-confidence signals (${(maxConfidence * 100).toFixed(1)}%) — proceeding with caution`,
      spoofSignals: relevantSignals,
      originalSpread: spread,
    };
    this.emit('decision', decision);
    return decision;
  }

  processOrderbookDelta(delta: OrderbookDelta): void {
    this.detector.addDelta(delta);
  }

  getDashboardData(): { signals: SpoofSignal[]; scores: Map<string, number> } {
    const signals = this.detector.analyze();
    const scores = new Map<string, number>();

    for (const signal of signals) {
      const key = `${signal.exchange}:${signal.symbol}`;
      const existing = scores.get(key) ?? 0;
      scores.set(key, Math.max(existing, signal.confidence));
    }

    return { signals, scores };
  }
}
