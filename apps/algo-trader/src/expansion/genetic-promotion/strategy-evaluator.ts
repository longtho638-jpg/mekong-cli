/**
 * Evaluates live strategy performance by Sharpe ratio.
 */

import { EventEmitter } from 'events';
import type { StrategyPerformance } from '../expansion-config-types';

export interface EvaluatorConfig {
  sharpeThreshold: number;
}

export class StrategyEvaluator extends EventEmitter {
  private readonly performances: Map<string, StrategyPerformance> = new Map();
  private readonly config: EvaluatorConfig;

  constructor(config: EvaluatorConfig) {
    super();
    this.config = config;
  }

  /** Record or update performance metrics for a strategy. */
  record(perf: StrategyPerformance): void {
    this.performances.set(perf.id, perf);
    this.emit('recorded', perf);

    if (perf.sharpe >= this.config.sharpeThreshold) {
      this.emit('above-threshold', perf);
    } else {
      this.emit('below-threshold', perf);
    }
  }

  /** Returns strategies above the Sharpe threshold. */
  getTopPerformers(): StrategyPerformance[] {
    return Array.from(this.performances.values()).filter(
      (p) => p.sharpe >= this.config.sharpeThreshold,
    );
  }

  /** Returns the worst performer by Sharpe (candidate for replacement). */
  getWorstPerformer(): StrategyPerformance | null {
    const all = Array.from(this.performances.values());
    if (all.length === 0) return null;
    return all.reduce((worst, p) => (p.sharpe < worst.sharpe ? p : worst));
  }

  /** Returns all tracked performances sorted descending by Sharpe. */
  getRanked(): StrategyPerformance[] {
    return Array.from(this.performances.values()).sort((a, b) => b.sharpe - a.sharpe);
  }

  getPerformance(id: string): StrategyPerformance | undefined {
    return this.performances.get(id);
  }

  remove(id: string): boolean {
    const removed = this.performances.delete(id);
    if (removed) this.emit('removed', id);
    return removed;
  }
}
