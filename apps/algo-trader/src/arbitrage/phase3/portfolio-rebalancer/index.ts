/**
 * PortfolioRebalancerEngine — composes ExposureAggregator, RiskCalculator,
 * PortfolioOptimizer, and RebalancingExecutor into a timed rebalancing loop.
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';
import { ExposureAggregator } from './exposure-aggregator';
import { RiskCalculator } from './risk-calculator';
import { PortfolioOptimizer } from './optimizer-core';
import { RebalancingExecutor } from './rebalancing-executor';

export interface PortfolioRebalancerConfig {
  intervalMs?: number;
  maxSlippageBps?: number;
  exchanges?: string[];
}

interface RebalancerStatus {
  running: boolean;
  totalValueUsd: number;
  lastRebalanceTime: number;
  tradesExecuted: number;
}

const DEFAULT_CONFIG: Required<PortfolioRebalancerConfig> = {
  intervalMs: 500,
  maxSlippageBps: 5,
  exchanges: ['binance', 'bybit'],
};

export class PortfolioRebalancerEngine extends EventEmitter {
  private config: Required<PortfolioRebalancerConfig>;
  private aggregator: ExposureAggregator;
  private riskCalc: RiskCalculator;
  private optimizer: PortfolioOptimizer;
  private executor: RebalancingExecutor;
  private running = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastRebalanceTime = 0;
  private tradesExecuted = 0;

  constructor(config?: PortfolioRebalancerConfig) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.aggregator = new ExposureAggregator();
    this.riskCalc = new RiskCalculator();
    this.optimizer = new PortfolioOptimizer();
    this.executor = new RebalancingExecutor();

    this.executor.on('rebalance:complete', (summary: { executed: number }) => {
      this.tradesExecuted += summary.executed;
      this.emit('ws:message', { type: 'phase3:rebalance_action', payload: summary });
    });
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.timer = setInterval(() => this.runRebalanceCycle(), this.config.intervalMs);
    logger.info(`[PortfolioRebalancerEngine] Started (interval=${this.config.intervalMs}ms)`);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    logger.info('[PortfolioRebalancerEngine] Stopped');
  }

  private async runRebalanceCycle(): Promise<void> {
    const snapshot = this.aggregator.getSnapshot();
    if (snapshot.exposures.length === 0) return;

    // Simulate flat price changes for risk calculation
    const priceChanges = new Map<string, number>();
    for (const e of snapshot.exposures) {
      priceChanges.set(e.asset, (Math.random() - 0.5) * 0.02); // ±1% move
    }

    const riskMetrics = this.riskCalc.computeRisk(snapshot, priceChanges);
    const target = this.optimizer.optimize(snapshot, riskMetrics, {
      maxSlippageBps: this.config.maxSlippageBps,
    });
    const trades = this.executor.generateTrades(snapshot, target);
    if (trades.length > 0) {
      await this.executor.executeTrades(trades);
      this.lastRebalanceTime = Date.now();
    }
  }

  /** Expose aggregator for test data injection */
  getAggregator(): ExposureAggregator { return this.aggregator; }

  getStatus(): RebalancerStatus {
    return {
      running: this.running,
      totalValueUsd: this.aggregator.getSnapshot().totalValueUsd,
      lastRebalanceTime: this.lastRebalanceTime,
      tradesExecuted: this.tradesExecuted,
    };
  }
}

export type { AssetExposure, PortfolioSnapshot } from './exposure-aggregator';
export type { RiskMetrics } from './risk-calculator';
export type { TargetAllocation, OptimizationResult } from './optimizer-core';
export type { RebalanceTrade } from './rebalancing-executor';
