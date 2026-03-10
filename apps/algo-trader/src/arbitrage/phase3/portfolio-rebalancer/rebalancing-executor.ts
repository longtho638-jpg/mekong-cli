/**
 * RebalancingExecutor — generates and simulates execution of rebalancing trades
 * derived from optimizer output. No real exchange calls.
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';
import type { PortfolioSnapshot } from './exposure-aggregator';
import type { OptimizationResult } from './optimizer-core';

export interface RebalanceTrade {
  asset: string;
  exchange: string;
  side: 'buy' | 'sell';
  amount: number;
  estimatedPrice: number;
  feeUsd: number;
}

interface ExecutionSummary {
  executed: number;
  failed: number;
  totalCostUsd: number;
}

const SIMULATED_PRICE = 100; // fallback price per asset unit
const FEE_RATE = 0.001;      // 0.1% maker fee

export class RebalancingExecutor extends EventEmitter {
  /**
   * Convert optimizer target allocations into concrete trade list.
   * Trades are generated only where adjustmentUsd exceeds $1 threshold.
   */
  generateTrades(
    current: PortfolioSnapshot,
    target: OptimizationResult,
  ): RebalanceTrade[] {
    const trades: RebalanceTrade[] = [];
    const MIN_TRADE_USD = 1;

    for (const alloc of target.allocations) {
      const absAdjustment = Math.abs(alloc.adjustmentUsd);
      if (absAdjustment < MIN_TRADE_USD) continue;

      // Pick first exchange that holds this asset, fallback to 'binance'
      const exposure = current.exposures.find(e => e.asset === alloc.asset);
      const exchange = exposure?.exchange ?? 'binance';

      const side: 'buy' | 'sell' = alloc.adjustmentUsd > 0 ? 'buy' : 'sell';
      const estimatedPrice = exposure
        ? exposure.valueUsd / Math.max(exposure.amount, 0.000001)
        : SIMULATED_PRICE;
      const amount = absAdjustment / estimatedPrice;
      const feeUsd = absAdjustment * FEE_RATE;

      trades.push({ asset: alloc.asset, exchange, side, amount, estimatedPrice, feeUsd });
      logger.debug(`[RebalancingExecutor] Trade: ${side} ${amount.toFixed(4)} ${alloc.asset} @ $${estimatedPrice.toFixed(2)} on ${exchange}`);
    }

    return trades;
  }

  /**
   * Simulate executing a list of trades. In production, dispatches to exchange APIs.
   */
  async executeTrades(trades: RebalanceTrade[]): Promise<ExecutionSummary> {
    let executed = 0;
    let failed = 0;
    let totalCostUsd = 0;

    for (const trade of trades) {
      // Simulate 95% success rate
      const success = Math.random() > 0.05;
      if (success) {
        executed++;
        totalCostUsd += trade.feeUsd;
        this.emit('trade:executed', { asset: trade.asset, side: trade.side, exchange: trade.exchange });
        logger.debug(`[RebalancingExecutor] Executed ${trade.side} ${trade.asset} fee=$${trade.feeUsd.toFixed(4)}`);
      } else {
        failed++;
        logger.warn(`[RebalancingExecutor] Failed ${trade.side} ${trade.asset} on ${trade.exchange}`);
      }
    }

    this.emit('rebalance:complete', { executed, failed, totalCostUsd });
    logger.info(`[RebalancingExecutor] Rebalance complete: ${executed}/${trades.length} executed cost=$${totalCostUsd.toFixed(4)}`);
    return { executed, failed, totalCostUsd };
  }
}
