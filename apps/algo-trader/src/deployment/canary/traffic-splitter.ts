/**
 * Traffic Splitter - Routes orders to baseline or canary instances.
 * Supports percentage-based and symbol-based splitting.
 */
import { TrafficSplitConfig } from './canary-config-types';

export type SplitMode = 'percentage' | 'symbol' | 'time';

export interface SplitDecision {
  target: 'baseline' | 'canary';
  reason: string;
}

/** Deterministic hash of a string to an integer [0, 99] */
function hashMod100(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
    h = h >>> 0; // keep 32-bit unsigned
  }
  return h % 100;
}

export class TrafficSplitter {
  private currentPercent: number;
  private config: TrafficSplitConfig;
  private orderCount: number = 0;
  private canaryOrders: number = 0;

  constructor(config: TrafficSplitConfig) {
    this.config = config;
    this.currentPercent = config.initialPercent;
  }

  /**
   * Route an order to baseline or canary.
   * Symbol-based takes priority: if symbols list is non-empty and symbol matches, route to canary.
   * Otherwise use percentage split via deterministic hash of symbol+timestamp.
   */
  routeOrder(symbol: string, timestamp: number): SplitDecision {
    this.orderCount++;

    // Symbol-based routing takes priority
    if (this.config.symbols.length > 0 && this.config.symbols.includes(symbol)) {
      this.canaryOrders++;
      return { target: 'canary', reason: `symbol match: ${symbol}` };
    }

    // Percentage-based using deterministic hash
    const key = `${symbol}:${timestamp}`;
    const bucket = hashMod100(key);
    if (bucket < this.currentPercent) {
      this.canaryOrders++;
      return { target: 'canary', reason: `hash bucket ${bucket} < ${this.currentPercent}%` };
    }

    return { target: 'baseline', reason: `hash bucket ${bucket} >= ${this.currentPercent}%` };
  }

  setPercent(pct: number): void {
    this.currentPercent = Math.max(0, Math.min(100, pct));
  }

  getPercent(): number {
    return this.currentPercent;
  }

  getStats(): { total: number; canary: number; baseline: number; actualPercent: number } {
    const baseline = this.orderCount - this.canaryOrders;
    const actualPercent = this.orderCount > 0 ? (this.canaryOrders / this.orderCount) * 100 : 0;
    return { total: this.orderCount, canary: this.canaryOrders, baseline, actualPercent };
  }

  reset(): void {
    this.orderCount = 0;
    this.canaryOrders = 0;
    this.currentPercent = this.config.initialPercent;
  }
}
