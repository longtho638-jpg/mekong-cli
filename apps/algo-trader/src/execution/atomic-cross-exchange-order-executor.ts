/**
 * Atomic Cross-Exchange Order Executor.
 * Executes buy and sell orders on two exchanges simultaneously via Promise.allSettled.
 * Performs rollback (market reverse) if one side fails to prevent naked positions.
 */

import { logger } from '../utils/logger';
import type { IExchange, IOrder } from '../interfaces/IExchange';

export interface AtomicOrderParams {
  symbol: string;
  amount: number;
  buyExchange: IExchange;
  sellExchange: IExchange;
}

export interface AtomicExecutionResult {
  success: boolean;
  buyOrder?: IOrder;
  sellOrder?: IOrder;
  buyLatency: number;
  sellLatency: number;
  totalLatency: number;
  netPnl: number;
  error?: string;
  rollbackPerformed: boolean;
}

export interface AtomicExecutorConfig {
  /** Allow one retry with reduced amount on partial fill */
  enableRetry?: boolean;
  /** Fraction of original amount to retry with. Default 0.5 */
  retryAmountFraction?: number;
}

export class AtomicCrossExchangeOrderExecutor {
  constructor(_config: AtomicExecutorConfig = {}) {
    // Config reserved for future retry logic
  }

  /** Execute buy on buyExchange and sell on sellExchange simultaneously */
  async executeAtomic(params: AtomicOrderParams): Promise<AtomicExecutionResult> {
    const { symbol, amount, buyExchange, sellExchange } = params;
    const startTime = Date.now();

    logger.info(`[AtomicExec] Starting atomic execution: ${symbol} x${amount} | buy=${buyExchange.name} sell=${sellExchange.name}`);

    const buyStart = Date.now();
    const sellStart = Date.now();

    const [buyResult, sellResult] = await Promise.allSettled([
      buyExchange.createMarketOrder(symbol, 'buy', amount),
      sellExchange.createMarketOrder(symbol, 'sell', amount),
    ]);

    const buyLatency = Date.now() - buyStart;
    const sellLatency = Date.now() - sellStart;
    const totalLatency = Date.now() - startTime;

    const buyFulfilled = buyResult.status === 'fulfilled';
    const sellFulfilled = sellResult.status === 'fulfilled';

    // Both succeeded
    if (buyFulfilled && sellFulfilled) {
      const buyOrder = buyResult.value;
      const sellOrder = sellResult.value;
      const netPnl = this.estimateNetPnl(buyOrder, sellOrder);
      logger.info(`[AtomicExec] Success: pnl≈${netPnl.toFixed(4)} USD, latency=${totalLatency}ms`);
      return { success: true, buyOrder, sellOrder, buyLatency, sellLatency, totalLatency, netPnl, rollbackPerformed: false };
    }

    // Partial failure — attempt rollback
    const rollbackPerformed = await this.handlePartialFailure(
      buyFulfilled ? buyResult.value : null,
      sellFulfilled ? sellResult.value : null,
      symbol,
      buyExchange,
      sellExchange,
    );

    const errorMsg = this.extractError(buyResult, sellResult);
    logger.error(`[AtomicExec] Failed: ${errorMsg} | rollback=${rollbackPerformed}`);

    return {
      success: false,
      buyOrder: buyFulfilled ? buyResult.value : undefined,
      sellOrder: sellFulfilled ? sellResult.value : undefined,
      buyLatency,
      sellLatency,
      totalLatency,
      netPnl: 0,
      error: errorMsg,
      rollbackPerformed,
    };
  }

  /** Rollback: if one side succeeded, reverse it with opposite market order */
  private async handlePartialFailure(
    buyOrder: IOrder | null,
    sellOrder: IOrder | null,
    symbol: string,
    buyExchange: IExchange,
    sellExchange: IExchange,
  ): Promise<boolean> {
    let performed = false;

    if (buyOrder && !sellOrder) {
      // Buy succeeded but sell failed — reverse the buy
      try {
        await buyExchange.createMarketOrder(symbol, 'sell', buyOrder.amount);
        logger.info(`[AtomicExec] Rollback: reversed buy order ${buyOrder.id} on ${buyExchange.name}`);
        performed = true;
      } catch (err) {
        logger.error(`[AtomicExec] Rollback FAILED for buy order ${buyOrder.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else if (sellOrder && !buyOrder) {
      // Sell succeeded but buy failed — reverse the sell
      try {
        await sellExchange.createMarketOrder(symbol, 'buy', sellOrder.amount);
        logger.info(`[AtomicExec] Rollback: reversed sell order ${sellOrder.id} on ${sellExchange.name}`);
        performed = true;
      } catch (err) {
        logger.error(`[AtomicExec] Rollback FAILED for sell order ${sellOrder.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return performed;
  }

  private estimateNetPnl(buyOrder: IOrder, sellOrder: IOrder): number {
    return (sellOrder.price - buyOrder.price) * buyOrder.amount;
  }

  private extractError(
    buyResult: PromiseSettledResult<IOrder>,
    sellResult: PromiseSettledResult<IOrder>,
  ): string {
    const errors: string[] = [];
    if (buyResult.status === 'rejected') {
      errors.push(`buy: ${buyResult.reason instanceof Error ? buyResult.reason.message : String(buyResult.reason)}`);
    }
    if (sellResult.status === 'rejected') {
      errors.push(`sell: ${sellResult.reason instanceof Error ? sellResult.reason.message : String(sellResult.reason)}`);
    }
    return errors.join('; ');
  }
}
