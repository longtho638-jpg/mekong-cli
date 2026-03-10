/**
 * Arbitrage Executor — executes RWA arbitrage opportunities.
 * In production: submits on-chain transactions + CEX orders atomically.
 * Mock: generates trade IDs via crypto.randomBytes, simulates P&L,
 * records execution log in memory.
 * All instances default to dryRun: true.
 */

import { randomBytes } from 'crypto';
import type { SpreadOpportunity } from './spread-detector';

export interface ArbitrageExecutorConfig {
  /** Dry-run mode — no real orders placed. Default: true. */
  dryRun: boolean;
  /** Maximum notional position in USD. Default: 10_000. */
  maxPositionUsd: number;
}

export interface ExecutionResult {
  tradeId: string;
  assetId: string;
  direction: 'buy_onchain' | 'sell_onchain';
  entryPrice: number;
  exitPrice: number;
  /** Realised profit in basis points (net of costs already baked into opportunity). */
  profitBps: number;
  success: boolean;
  dryRun: boolean;
  timestamp: number;
}

const DEFAULT_CONFIG: ArbitrageExecutorConfig = {
  dryRun: true,
  maxPositionUsd: 10_000,
};

export class ArbitrageExecutor {
  private readonly cfg: ArbitrageExecutorConfig;
  private readonly log: ExecutionResult[] = [];

  constructor(config: Partial<ArbitrageExecutorConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute an arbitrage opportunity.
   * Returns an ExecutionResult with a unique tradeId and simulated P&L.
   * In dryRun mode the result is identical but flagged accordingly.
   */
  execute(opportunity: SpreadOpportunity): ExecutionResult {
    const tradeId = randomBytes(8).toString('hex');

    // Determine entry / exit prices based on direction
    const entryPrice =
      opportunity.direction === 'buy_onchain'
        ? opportunity.onChainPrice   // buy cheaper on-chain
        : opportunity.offChainPrice; // buy cheaper on CEX

    const exitPrice =
      opportunity.direction === 'buy_onchain'
        ? opportunity.offChainPrice  // sell on CEX
        : opportunity.onChainPrice;  // sell on-chain

    // Profit in bps mirrors the net spread already computed by SpreadDetector
    const profitBps = parseFloat(opportunity.netSpreadBps.toFixed(4));

    const result: ExecutionResult = {
      tradeId,
      assetId: opportunity.assetId,
      direction: opportunity.direction,
      entryPrice,
      exitPrice,
      profitBps,
      success: true,
      dryRun: this.cfg.dryRun,
      timestamp: Date.now(),
    };

    this.log.push(result);
    return result;
  }

  /** Return a shallow copy of the execution log. */
  getExecutionLog(): ExecutionResult[] {
    return [...this.log];
  }

  /** Clear execution log. */
  clearLog(): void {
    this.log.length = 0;
  }

  getConfig(): ArbitrageExecutorConfig {
    return { ...this.cfg };
  }
}
