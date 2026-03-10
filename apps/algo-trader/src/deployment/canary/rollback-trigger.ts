/**
 * Rollback Trigger - Monitors metrics and triggers automatic rollback.
 */
import { MetricsThresholdConfig } from './canary-config-types';
import { ComparisonResult } from './metrics-comparator';

export interface RollbackEvent {
  timestamp: number;
  reason: string;
  metrics: ComparisonResult[];
  action: 'rollback' | 'alert';
}

export class RollbackTrigger {
  private events: RollbackEvent[] = [];
  private config: MetricsThresholdConfig;
  private onRollback?: (event: RollbackEvent) => void;

  constructor(config: MetricsThresholdConfig) {
    this.config = config;
  }

  setRollbackHandler(handler: (event: RollbackEvent) => void): void {
    this.onRollback = handler;
  }

  /**
   * Evaluate comparisons and trigger rollback if needed.
   * Returns a RollbackEvent if triggered, null otherwise.
   */
  evaluate(comparisons: ComparisonResult[]): RollbackEvent | null {
    if (!this.shouldRollback(comparisons)) return null;

    const degraded = comparisons.filter(r => r.degraded);
    const reasons = degraded.map(r =>
      `${r.metric}: canary=${r.canaryMean.toFixed(4)} vs baseline=${r.baselineMean.toFixed(4)} (p=${r.pValue.toFixed(3)})`
    );

    // Check hard threshold breaches
    const hardBreaches = this.checkHardThresholds(comparisons);

    const reason = [...hardBreaches, ...reasons].join('; ');

    const event: RollbackEvent = {
      timestamp: Date.now(),
      reason,
      metrics: comparisons,
      action: 'rollback',
    };

    this.events.push(event);

    if (this.onRollback) {
      this.onRollback(event);
    }

    return event;
  }

  getHistory(): RollbackEvent[] {
    return this.events;
  }

  shouldRollback(comparisons: ComparisonResult[]): boolean {
    if (comparisons.some(r => r.degraded)) return true;
    return this.checkHardThresholds(comparisons).length > 0;
  }

  private checkHardThresholds(comparisons: ComparisonResult[]): string[] {
    const breaches: string[] = [];

    for (const r of comparisons) {
      if (r.metric === 'slippageBps' && r.canaryMean > this.config.slippageThresholdBps) {
        breaches.push(`slippage hard breach: ${r.canaryMean.toFixed(2)} > ${this.config.slippageThresholdBps} bps`);
      }
      if (r.metric === 'errorRate' && r.canaryMean > this.config.errorRateThreshold) {
        breaches.push(`errorRate hard breach: ${r.canaryMean.toFixed(4)} > ${this.config.errorRateThreshold}`);
      }
      if (r.metric === 'antiBotFlags' && r.canaryMean >= this.config.antiBotFlagThreshold) {
        breaches.push(`antiBotFlags hard breach: ${r.canaryMean.toFixed(2)} >= ${this.config.antiBotFlagThreshold}`);
      }
    }

    return breaches;
  }
}
