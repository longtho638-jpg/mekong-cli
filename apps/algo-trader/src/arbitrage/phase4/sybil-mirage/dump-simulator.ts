/**
 * DumpSimulator — simulates a large sell order from a main wallet using
 * a square-root price impact model. No real execution. Pure simulation.
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';

export interface DumpResult {
  mainWallet: string;
  sellSize: number;
  priceImpact: number;
  prePrice: number;
  postPrice: number;
  timestamp: number;
}

// Liquidity constant used in sqrt impact model (notional pool depth in same units as price)
const DEFAULT_POOL_DEPTH = 1_000_000;

export class DumpSimulator extends EventEmitter {
  private history: DumpResult[] = [];
  private poolDepth: number;

  constructor(options?: { poolDepth?: number }) {
    super();
    this.poolDepth = options?.poolDepth ?? DEFAULT_POOL_DEPTH;
  }

  /**
   * Simulate a dump using square-root market impact:
   *   impact = sellSize / sqrt(poolDepth)  (as a fraction of price)
   * postPrice = prePrice * (1 - impact)
   */
  simulateDump(mainWallet: string, sellSize: number, currentPrice: number): DumpResult {
    if (sellSize <= 0 || currentPrice <= 0) {
      throw new Error('[DumpSimulator] sellSize and currentPrice must be positive');
    }

    const rawImpact = sellSize / Math.sqrt(this.poolDepth);
    const priceImpact = Math.min(rawImpact, 0.99); // cap at 99% to avoid negative price
    const postPrice = currentPrice * (1 - priceImpact);

    const result: DumpResult = {
      mainWallet,
      sellSize,
      priceImpact,
      prePrice: currentPrice,
      postPrice,
      timestamp: Date.now(),
    };

    logger.info(
      `[DumpSimulator] DUMP wallet=${mainWallet.slice(0, 10)}... ` +
      `sell=${sellSize.toFixed(4)} prePrice=${currentPrice.toFixed(4)} ` +
      `postPrice=${postPrice.toFixed(4)} impact=${(priceImpact * 100).toFixed(2)}%`
    );

    this.history.push(result);
    this.emit('dump_executed', result);
    return result;
  }

  getHistory(): DumpResult[] {
    return [...this.history];
  }

  reset(): void {
    this.history = [];
  }
}
