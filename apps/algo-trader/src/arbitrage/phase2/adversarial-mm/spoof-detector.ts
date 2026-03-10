import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';

export interface OrderbookDelta {
  exchange: string;
  symbol: string;
  side: 'bid' | 'ask';
  price: number;
  sizeBefore: number;
  sizeAfter: number;
  timestamp: number;
}

export interface SpoofSignal {
  type: 'spoof' | 'iceberg' | 'layering';
  exchange: string;
  symbol: string;
  side: 'bid' | 'ask';
  confidence: number;
  priceLevel: number;
  evidence: string;
  timestamp: number;
}

export interface SpoofDetectorConfig {
  windowMs?: number;
  minConfidence?: number;
  cancelRatioThreshold?: number;
  sizeAsymmetryThreshold?: number;
  icebergRefillCount?: number;
}

// Tracks activity per price level
interface LevelActivity {
  placements: number;
  cancellations: number;
  refillCount: number;
  lastSize: number;
  timestamps: number[];
}

export class SpoofDetector extends EventEmitter {
  private deltas: OrderbookDelta[] = [];
  private config: Required<SpoofDetectorConfig>;
  // key: exchange:symbol:side:price
  private levelActivity: Map<string, LevelActivity> = new Map();

  constructor(config?: SpoofDetectorConfig) {
    super();
    this.config = {
      windowMs: config?.windowMs ?? 5000,
      minConfidence: config?.minConfidence ?? 0.6,
      cancelRatioThreshold: config?.cancelRatioThreshold ?? 0.85,
      sizeAsymmetryThreshold: config?.sizeAsymmetryThreshold ?? 3.0,
      icebergRefillCount: config?.icebergRefillCount ?? 3,
    };
  }

  addDelta(delta: OrderbookDelta): void {
    this.deltas.push(delta);
    this.updateLevelActivity(delta);
  }

  analyze(): SpoofSignal[] {
    const cutoff = Date.now() - this.config.windowMs;
    const windowDeltas = this.deltas.filter(d => d.timestamp >= cutoff);

    const signals: SpoofSignal[] = [
      ...this.detectSpoofing(windowDeltas),
      ...this.detectIceberg(windowDeltas),
      ...this.detectLayering(windowDeltas),
    ].filter(s => s.confidence >= this.config.minConfidence);

    for (const signal of signals) {
      logger.debug(`[SpoofDetector] Signal: ${signal.type} on ${signal.exchange}:${signal.symbol} confidence=${signal.confidence.toFixed(2)}`);
      this.emit('signal', signal);
    }

    return signals;
  }

  private detectSpoofing(windowDeltas: OrderbookDelta[]): SpoofSignal[] {
    // Group by exchange:symbol:side:price
    const levelMap = new Map<string, { placed: number; cancelled: number; price: number; exchange: string; symbol: string; side: 'bid' | 'ask' }>();

    for (const d of windowDeltas) {
      const key = `${d.exchange}:${d.symbol}:${d.side}:${d.price}`;
      if (!levelMap.has(key)) {
        levelMap.set(key, { placed: 0, cancelled: 0, price: d.price, exchange: d.exchange, symbol: d.symbol, side: d.side });
      }
      const entry = levelMap.get(key)!;
      const delta = d.sizeAfter - d.sizeBefore;
      if (delta > 0) entry.placed += delta;
      else entry.cancelled += Math.abs(delta);
    }

    const signals: SpoofSignal[] = [];
    for (const [, entry] of levelMap) {
      if (entry.placed === 0) continue;
      const cancelRatio = entry.cancelled / entry.placed;
      if (cancelRatio >= this.config.cancelRatioThreshold) {
        const confidence = Math.min(0.99, 0.5 + cancelRatio * 0.5);
        signals.push({
          type: 'spoof',
          exchange: entry.exchange,
          symbol: entry.symbol,
          side: entry.side,
          confidence,
          priceLevel: entry.price,
          evidence: `Cancel ratio ${(cancelRatio * 100).toFixed(1)}% of placed volume at ${entry.price}`,
          timestamp: Date.now(),
        });
      }
    }
    return signals;
  }

  private detectIceberg(windowDeltas: OrderbookDelta[]): SpoofSignal[] {
    // Detect same-size orders reappearing at same price level repeatedly
    const levelRefills = new Map<string, { count: number; size: number; exchange: string; symbol: string; side: 'bid' | 'ask'; price: number }>();

    for (const d of windowDeltas) {
      if (d.sizeAfter === 0 || d.sizeBefore === d.sizeAfter) continue;
      if (d.sizeAfter > d.sizeBefore) {
        // A refill appeared
        const key = `${d.exchange}:${d.symbol}:${d.side}:${d.price}:${d.sizeAfter.toFixed(6)}`;
        if (!levelRefills.has(key)) {
          levelRefills.set(key, { count: 0, size: d.sizeAfter, exchange: d.exchange, symbol: d.symbol, side: d.side, price: d.price });
        }
        levelRefills.get(key)!.count++;
      }
    }

    const signals: SpoofSignal[] = [];
    for (const [, entry] of levelRefills) {
      if (entry.count >= this.config.icebergRefillCount) {
        const confidence = Math.min(0.95, 0.5 + (entry.count / (this.config.icebergRefillCount * 2)) * 0.45);
        signals.push({
          type: 'iceberg',
          exchange: entry.exchange,
          symbol: entry.symbol,
          side: entry.side,
          confidence,
          priceLevel: entry.price,
          evidence: `Same-size order (${entry.size}) refilled ${entry.count}x at ${entry.price}`,
          timestamp: Date.now(),
        });
      }
    }
    return signals;
  }

  private detectLayering(windowDeltas: OrderbookDelta[]): SpoofSignal[] {
    // Aggregate total bid vs ask volume added in window
    const exchangeSymbols = new Set(windowDeltas.map(d => `${d.exchange}:${d.symbol}`));
    const signals: SpoofSignal[] = [];

    for (const esKey of exchangeSymbols) {
      const [exchange, symbol] = esKey.split(':');
      const subset = windowDeltas.filter(d => d.exchange === exchange && d.symbol === symbol);

      let bidAdded = 0;
      let askAdded = 0;
      for (const d of subset) {
        const delta = d.sizeAfter - d.sizeBefore;
        if (delta <= 0) continue;
        if (d.side === 'bid') bidAdded += delta;
        else askAdded += delta;
      }

      if (bidAdded === 0 || askAdded === 0) continue;

      const ratio = bidAdded > askAdded ? bidAdded / askAdded : askAdded / bidAdded;
      if (ratio >= this.config.sizeAsymmetryThreshold) {
        const dominantSide: 'bid' | 'ask' = bidAdded > askAdded ? 'bid' : 'ask';
        const confidence = Math.min(0.95, 0.4 + (ratio / (this.config.sizeAsymmetryThreshold * 2)) * 0.55);
        const representativePrice = subset.find(d => d.side === dominantSide)?.price ?? 0;
        signals.push({
          type: 'layering',
          exchange,
          symbol,
          side: dominantSide,
          confidence,
          priceLevel: representativePrice,
          evidence: `${dominantSide} volume ${ratio.toFixed(1)}x larger than opposite side (bid=${bidAdded.toFixed(2)}, ask=${askAdded.toFixed(2)})`,
          timestamp: Date.now(),
        });
      }
    }
    return signals;
  }

  getManipulationScore(exchange: string, symbol: string): number {
    const signals = this.analyze().filter(s => s.exchange === exchange && s.symbol === symbol);
    if (signals.length === 0) return 0;
    const max = Math.max(...signals.map(s => s.confidence));
    return Math.min(1, max);
  }

  reset(): void {
    this.deltas = [];
    this.levelActivity.clear();
  }

  private updateLevelActivity(delta: OrderbookDelta): void {
    const key = `${delta.exchange}:${delta.symbol}:${delta.side}:${delta.price}`;
    if (!this.levelActivity.has(key)) {
      this.levelActivity.set(key, { placements: 0, cancellations: 0, refillCount: 0, lastSize: 0, timestamps: [] });
    }
    const activity = this.levelActivity.get(key)!;
    const sizeDelta = delta.sizeAfter - delta.sizeBefore;
    if (sizeDelta > 0) {
      activity.placements += sizeDelta;
      if (activity.lastSize > 0 && Math.abs(delta.sizeAfter - activity.lastSize) < 0.0001) {
        activity.refillCount++;
      }
    } else {
      activity.cancellations += Math.abs(sizeDelta);
    }
    activity.lastSize = delta.sizeAfter;
    activity.timestamps.push(delta.timestamp);
  }
}
