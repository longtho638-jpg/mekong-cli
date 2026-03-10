/**
 * PreemptiveExecutor — executes trades when high-probability arb is detected.
 * Fires only when consensus probability exceeds configurable threshold.
 * Module 3 of Phase 10 Cosmic — default disabled/dry-run.
 */

import type { ConsensusResult } from './shadow-consensus';

export interface PreemptiveExecutorConfig {
  /** Master switch. Default: false. */
  enabled: boolean;
  /** Dry-run: log but don't submit. Default: true. */
  dryRun: boolean;
  /** Minimum consensus probability to trigger execution. Default: 0.7. */
  probabilityThreshold: number;
  /** Maximum trade size in USD. Default: 10_000. */
  maxSizeUsd: number;
}

export interface PreemptiveTrade {
  id: string;
  stateRoot: string;
  probability: number;
  priceImpact: number;
  sizeUsd: number;
  /** Direction: 'buy' or 'sell' based on net price impact. */
  direction: 'buy' | 'sell';
  timestamp: number;
  dryRun: boolean;
  status: 'submitted' | 'skipped' | 'dry-run';
}

export interface ExecutionLog {
  trades: PreemptiveTrade[];
  totalSubmitted: number;
  totalSkipped: number;
  totalDryRun: number;
}

const DEFAULT_CONFIG: PreemptiveExecutorConfig = {
  enabled: false,
  dryRun: true,
  probabilityThreshold: 0.7,
  maxSizeUsd: 10_000,
};

let tradeCounter = 0;

export class PreemptiveExecutor {
  private cfg: PreemptiveExecutorConfig;
  private log: PreemptiveTrade[] = [];

  constructor(config: Partial<PreemptiveExecutorConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Evaluate a ConsensusResult and decide whether to trade.
   * Returns the trade record (status=skipped if below threshold).
   */
  evaluate(consensus: ConsensusResult, availableUsd: number): PreemptiveTrade {
    const sizeUsd = Math.min(availableUsd, this.cfg.maxSizeUsd);
    const direction: 'buy' | 'sell' = consensus.netPriceImpact >= 0 ? 'buy' : 'sell';
    const belowThreshold = consensus.probability < this.cfg.probabilityThreshold;
    const disabled = !this.cfg.enabled;

    let status: PreemptiveTrade['status'];
    if (belowThreshold || disabled) {
      status = 'skipped';
    } else if (this.cfg.dryRun) {
      status = 'dry-run';
    } else {
      status = 'submitted';
    }

    const trade: PreemptiveTrade = {
      id: `pre-${++tradeCounter}`,
      stateRoot: consensus.mostLikelyStateRoot,
      probability: consensus.probability,
      priceImpact: consensus.netPriceImpact,
      sizeUsd,
      direction,
      timestamp: Date.now(),
      dryRun: this.cfg.dryRun,
      status,
    };

    this.log.push(trade);
    return trade;
  }

  /**
   * Execute a trade directly (bypasses evaluate threshold check).
   * Intended for callers that have already validated the opportunity.
   */
  execute(
    stateRoot: string,
    probability: number,
    priceImpact: number,
    sizeUsd: number,
  ): PreemptiveTrade {
    const direction: 'buy' | 'sell' = priceImpact >= 0 ? 'buy' : 'sell';
    const status: PreemptiveTrade['status'] = !this.cfg.enabled
      ? 'skipped'
      : this.cfg.dryRun
        ? 'dry-run'
        : 'submitted';

    const trade: PreemptiveTrade = {
      id: `pre-${++tradeCounter}`,
      stateRoot,
      probability,
      priceImpact,
      sizeUsd: Math.min(sizeUsd, this.cfg.maxSizeUsd),
      direction,
      timestamp: Date.now(),
      dryRun: this.cfg.dryRun,
      status,
    };

    this.log.push(trade);
    return trade;
  }

  getExecutionLog(): ExecutionLog {
    return {
      trades: [...this.log],
      totalSubmitted: this.log.filter(t => t.status === 'submitted').length,
      totalSkipped: this.log.filter(t => t.status === 'skipped').length,
      totalDryRun: this.log.filter(t => t.status === 'dry-run').length,
    };
  }

  setThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 1) throw new RangeError('threshold must be in [0, 1]');
    this.cfg = { ...this.cfg, probabilityThreshold: threshold };
  }

  getThreshold(): number {
    return this.cfg.probabilityThreshold;
  }
}
