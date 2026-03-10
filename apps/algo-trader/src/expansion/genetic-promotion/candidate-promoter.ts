/**
 * Promotes new strategy candidates that outperform the worst live strategy.
 */

import { EventEmitter } from 'events';
import type { StrategyPerformance } from '../expansion-config-types';

export interface PromoterConfig {
  maxLiveCandidates: number;
}

export interface PromotionRecord {
  promoted: StrategyPerformance;
  replaced: StrategyPerformance | null;
  promotedAt: number;
}

export class CandidatePromoter extends EventEmitter {
  private readonly liveStrategies: Map<string, StrategyPerformance> = new Map();
  private readonly config: PromoterConfig;
  private readonly history: PromotionRecord[] = [];

  constructor(config: PromoterConfig) {
    super();
    this.config = config;
  }

  /** Add a strategy directly to the live set (used for seeding). */
  addLive(perf: StrategyPerformance): void {
    this.liveStrategies.set(perf.id, perf);
  }

  /**
   * Attempt to promote a candidate.
   * Promotes if: slot available OR candidate Sharpe > worst live Sharpe.
   * Returns the promotion record, or null if rejected.
   */
  tryPromote(candidate: StrategyPerformance): PromotionRecord | null {
    const hasSlot = this.liveStrategies.size < this.config.maxLiveCandidates;

    if (hasSlot) {
      this.liveStrategies.set(candidate.id, candidate);
      const record: PromotionRecord = { promoted: candidate, replaced: null, promotedAt: Date.now() };
      this.history.push(record);
      this.emit('promoted', record);
      return record;
    }

    // Find worst live strategy
    const worst = Array.from(this.liveStrategies.values()).reduce(
      (w, p) => (p.sharpe < w.sharpe ? p : w),
    );

    if (candidate.sharpe <= worst.sharpe) {
      this.emit('rejected', { candidate, reason: 'does not outperform worst live' });
      return null;
    }

    this.liveStrategies.delete(worst.id);
    this.liveStrategies.set(candidate.id, candidate);

    const record: PromotionRecord = { promoted: candidate, replaced: worst, promotedAt: Date.now() };
    this.history.push(record);
    this.emit('promoted', record);
    return record;
  }

  getLiveStrategies(): StrategyPerformance[] {
    return Array.from(this.liveStrategies.values());
  }

  getHistory(): PromotionRecord[] {
    return [...this.history];
  }

  removeLive(id: string): boolean {
    const removed = this.liveStrategies.delete(id);
    if (removed) this.emit('removed', id);
    return removed;
  }
}
