/**
 * DumpExecutor — cancels maker orders and fires an IOC short/sell when
 * dump threshold is reached. All execution is simulated.
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';
import type { MakerOrder } from './liquidity-trapper';

export interface DumpTrade {
  asset: string;
  side: 'sell' | 'short';
  amount: number;
  price: number;
  exchange: string;
  type: 'market' | 'ioc';
  pnlUsd?: number;
}

interface DumpExecutorConfig {
  dumpThreshold: number;   // probability threshold to trigger dump
  maxPositionUsd: number;
}

const DEFAULT_CONFIG: Required<DumpExecutorConfig> = {
  dumpThreshold: 0.9,
  maxPositionUsd: 10_000,
};

export class DumpExecutor extends EventEmitter {
  private config: Required<DumpExecutorConfig>;

  constructor(config?: Partial<DumpExecutorConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute a dump: cancel all provided maker positions then place IOC short.
   * Returns the simulated dump trade with estimated PnL.
   */
  async executeDump(
    asset: string,
    currentPrice: number,
    positions: MakerOrder[],
  ): Promise<DumpTrade> {
    // Cancel all active maker positions to free collateral
    const activePositions = positions.filter(p => p.status === 'active');
    logger.debug(`[DumpExecutor] Cancelling ${activePositions.length} maker orders before dump`);
    for (const pos of activePositions) {
      pos.status = 'cancelled';
    }

    // Size the dump: sum of sell-side maker amounts, capped at maxPositionUsd
    const totalSellAmount = activePositions
      .filter(p => p.side === 'sell')
      .reduce((sum, p) => sum + p.amount, 0);
    const dumpAmount = Math.min(
      totalSellAmount > 0 ? totalSellAmount : this.config.maxPositionUsd / currentPrice,
      this.config.maxPositionUsd / currentPrice,
    );

    // Simulated execution: IOC fills at slight slippage below current price
    const slippagePct = 0.001; // 0.1%
    const fillPrice = currentPrice * (1 - slippagePct);
    const avgEntryPrice = currentPrice * (1 + slippagePct); // assumed entry was slightly above
    const pnlUsd = (avgEntryPrice - fillPrice) * dumpAmount;

    const trade: DumpTrade = {
      asset,
      side: 'sell',
      amount: dumpAmount,
      price: fillPrice,
      exchange: 'binance',
      type: 'ioc',
      pnlUsd,
    };

    logger.info(`[DumpExecutor] DUMP ${asset} amount=${dumpAmount.toFixed(4)} @ ${fillPrice.toFixed(4)} pnl=$${pnlUsd.toFixed(2)}`);
    this.emit('dump:executed', trade);
    return trade;
  }
}
