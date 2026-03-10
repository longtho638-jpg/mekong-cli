/**
 * GeneticSynthesizerPromoter — evolution loop coordinator.
 * Evaluates strategies, promotes winners, guards against regressions.
 */

import { EventEmitter } from 'events';
import { StrategyEvaluator } from './strategy-evaluator';
import { CandidatePromoter } from './candidate-promoter';
import { RollbackGuard } from './rollback-guard';
import type { GeneticPromotionConfig, StrategyPerformance } from '../expansion-config-types';

export { StrategyEvaluator } from './strategy-evaluator';
export { CandidatePromoter } from './candidate-promoter';
export { RollbackGuard } from './rollback-guard';

export class GeneticSynthesizerPromoter extends EventEmitter {
  private readonly evaluator: StrategyEvaluator;
  private readonly promoter: CandidatePromoter;
  private readonly guard: RollbackGuard;
  private readonly config: GeneticPromotionConfig;

  constructor(config: GeneticPromotionConfig) {
    super();
    this.config = config;
    this.evaluator = new StrategyEvaluator({ sharpeThreshold: config.sharpeThreshold });
    this.promoter = new CandidatePromoter({ maxLiveCandidates: config.maxLiveCandidates });
    this.guard = new RollbackGuard({
      monitoringWindowMs: config.monitoringWindowMs,
      maxDrawdownPercent: 5,
    });
  }

  /**
   * Feed a candidate performance into the evolution loop.
   * Only attempts promotion if the strategy meets the Sharpe threshold.
   */
  ingest(perf: StrategyPerformance): void {
    this.evaluator.record(perf);
    if (perf.sharpe < this.config.sharpeThreshold) return;
    const record = this.promoter.tryPromote(perf);
    if (record) {
      this.guard.watch(perf.id, perf.totalPnl);
      this.emit('evolution-event', { type: 'promoted', record });
    }
  }

  /** Update live PnL for a monitored strategy. */
  updatePnl(id: string, currentPnl: number): void {
    this.guard.updatePnl(id, currentPnl);

    if (this.guard.isRolledBack(id)) {
      this.promoter.removeLive(id);
      this.evaluator.remove(id);
      this.emit('evolution-event', { type: 'rolled-back', id });
    }
  }

  start(): void {
    this.guard.startMonitoring(5_000);
    this.emit('started');
  }

  stop(): void {
    this.guard.stopMonitoring();
    this.emit('stopped');
  }

  getLiveStrategies(): StrategyPerformance[] {
    return this.promoter.getLiveStrategies();
  }

  getTopPerformers(): StrategyPerformance[] {
    return this.evaluator.getTopPerformers();
  }
}
