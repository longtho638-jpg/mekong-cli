/**
 * Atomic Cross-Exchange Order Executor.
 * Executes buy and sell orders on two exchanges simultaneously via Promise.allSettled.
 * Performs rollback (market reverse) if one side fails to prevent naked positions.
 */

import { logger } from '../utils/logger';
import type { IExchange, IOrder } from '../interfaces/IExchange';
import { CircuitBreakerLegacy, CircuitBreakerConfig } from './circuit-breaker';
import { RetryHandler, RetryConfig } from './retry-handler';

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
  retryMetrics?: {
    attempts: number;
    successfulRetries: number;
    failedRetries: number;
    totalRetryDelayMs: number;
  };
  circuitBreakerMetrics?: {
    state: string;
    failureCount: number;
    successCount: number;
    totalRequests: number;
    totalFailures: number;
    totalSuccesses: number;
  };
}

export interface AtomicExecutorConfig {
  enableRetry?: boolean;
  retryAmountFraction?: number;
  retryConfig?: RetryConfig;
  circuitBreakerConfig?: CircuitBreakerConfig;
  rollbackRetryConfig?: RetryConfig;
}

export class AtomicCrossExchangeOrderExecutor {
  private retryHandler?: RetryHandler;
  private rollbackRetryHandler?: RetryHandler;
  private buyCircuitBreaker?: CircuitBreakerLegacy;
  private sellCircuitBreaker?: CircuitBreakerLegacy;

  constructor(private config: AtomicExecutorConfig = {}) {
    if (config.retryConfig) {
      this.retryHandler = new RetryHandler(config.retryConfig);
    }

    if (config.rollbackRetryConfig) {
      this.rollbackRetryHandler = new RetryHandler(config.rollbackRetryConfig);
    }

    if (config.circuitBreakerConfig) {
      this.buyCircuitBreaker = new CircuitBreakerLegacy(config.circuitBreakerConfig);
      this.sellCircuitBreaker = new CircuitBreakerLegacy({...config.circuitBreakerConfig});
    }
  }

  async executeAtomic(params: AtomicOrderParams): Promise<AtomicExecutionResult> {
    const { symbol, amount, buyExchange, sellExchange } = params;
    const startTime = Date.now();

    logger.info(`[AtomicExec] Starting atomic execution: ${symbol} x${amount} | buy=${buyExchange.name} sell=${sellExchange.name}`);

    let circuitBreakerMetrics: {
      buyState: string;
      sellState: string;
      buyFailureCount: number;
      sellFailureCount: number;
      buyTotalRequests: number;
      sellTotalRequests: number;
      buyTotalFailures: number;
      sellTotalFailures: number;
      buyTotalSuccesses: number;
      sellTotalSuccesses: number;
    } | undefined;

    try {
      let result: AtomicExecutionResult;

      if (this.retryHandler) {
        this.retryHandler.resetMetrics();

        result = await this.retryHandler.execute(async () => {
          if (this.buyCircuitBreaker && this.sellCircuitBreaker) {
            return await this.performAtomicExecutionWithCircuitBreakersCheck(params, startTime);
          } else {
            return await this.performAtomicExecution(params, startTime);
          }
        });

        const updatedRetryMetrics = this.retryHandler.getMetrics();
        result.retryMetrics = {
          attempts: updatedRetryMetrics.attempts,
          successfulRetries: updatedRetryMetrics.successfulRetries,
          failedRetries: updatedRetryMetrics.failedRetries,
          totalRetryDelayMs: updatedRetryMetrics.totalRetryDelayMs
        };
      } else if (this.buyCircuitBreaker && this.sellCircuitBreaker) {
        result = await this.performAtomicExecutionWithCircuitBreakersCheck(params, startTime);
      } else {
        result = await this.performAtomicExecution(params, startTime);
      }

      if (this.buyCircuitBreaker && this.sellCircuitBreaker) {
        const buyMetrics = this.buyCircuitBreaker.getMetrics();
        const sellMetrics = this.sellCircuitBreaker.getMetrics();

        circuitBreakerMetrics = {
          buyState: buyMetrics.state,
          sellState: sellMetrics.state,
          buyFailureCount: buyMetrics.failureCount,
          sellFailureCount: sellMetrics.failureCount,
          buyTotalRequests: buyMetrics.totalRequests,
          sellTotalRequests: sellMetrics.totalRequests,
          buyTotalFailures: buyMetrics.totalFailures,
          sellTotalFailures: sellMetrics.totalFailures,
          buyTotalSuccesses: buyMetrics.totalSuccesses,
          sellTotalSuccesses: sellMetrics.totalSuccesses
        };

        result.circuitBreakerMetrics = {
          state: `${circuitBreakerMetrics.buyState}/${circuitBreakerMetrics.sellState}`,
          failureCount: circuitBreakerMetrics.buyFailureCount + circuitBreakerMetrics.sellFailureCount,
          successCount: circuitBreakerMetrics.buyTotalSuccesses + circuitBreakerMetrics.sellTotalSuccesses,
          totalRequests: circuitBreakerMetrics.buyTotalRequests + circuitBreakerMetrics.sellTotalRequests,
          totalFailures: circuitBreakerMetrics.buyTotalFailures + circuitBreakerMetrics.sellTotalFailures,
          totalSuccesses: circuitBreakerMetrics.buyTotalSuccesses + circuitBreakerMetrics.sellTotalSuccesses
        };
      }

      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Circuit breaker is OPEN')) {
        throw error;
      }

      logger.error(`[AtomicExec] Failed with error: ${error instanceof Error ? error.message : String(error)}`);

      const totalLatency = Date.now() - startTime;
      return {
        success: false,
        buyLatency: 0,
        sellLatency: 0,
        totalLatency,
        netPnl: 0,
        error: error instanceof Error ? error.message : String(error),
        rollbackPerformed: false
      };
    }
  }

  private async performAtomicExecution(params: AtomicOrderParams, startTime: number): Promise<AtomicExecutionResult> {
    const { symbol, amount, buyExchange, sellExchange } = params;

    const buyStart = Date.now();
    const sellStart = Date.now();

    const buyResultPromise = buyExchange.createMarketOrder(symbol, 'buy', amount);
    const sellResultPromise = sellExchange.createMarketOrder(symbol, 'sell', amount);

    const [buyResult, sellResult] = await Promise.allSettled([
      buyResultPromise,
      sellResultPromise,
    ]);

    const buyLatency = Date.now() - buyStart;
    const sellLatency = Date.now() - sellStart;
    const totalLatency = Date.now() - startTime;

    const buyFulfilled = buyResult.status === 'fulfilled';
    const sellFulfilled = sellResult.status === 'fulfilled';

    if (buyFulfilled && sellFulfilled) {
      const buyOrder = buyResult.value;
      const sellOrder = sellResult.value;
      const netPnl = this.estimateNetPnl(buyOrder, sellOrder);
      logger.info(`[AtomicExec] Success: pnl≈${netPnl.toFixed(4)} USD, latency=${totalLatency}ms`);
      return { success: true, buyOrder, sellOrder, buyLatency, sellLatency, totalLatency, netPnl, rollbackPerformed: false };
    }

    const rollbackPerformed = await this.handlePartialFailure(
      buyFulfilled ? buyResult.value : null,
      sellFulfilled ? sellResult.value : null,
      symbol,
      buyExchange,
      sellExchange,
    );

    const errorMsg = this.extractError(buyResult, sellResult);
    logger.error(`[AtomicExec] Failed: ${errorMsg} | rollback=${rollbackPerformed}`);

    // Throw error to trigger retry when both exchanges fail (temporary failure)
    if (!buyFulfilled && !sellFulfilled) {
      throw new Error(errorMsg);
    }

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

  private async performAtomicExecutionWithCircuitBreakersCheck(params: AtomicOrderParams, startTime: number): Promise<AtomicExecutionResult> {
    const { symbol, amount, buyExchange, sellExchange } = params;

    const buyStart = Date.now();
    const sellStart = Date.now();

    let buyResult, sellResult;
    let buyFulfilled = false;
    let sellFulfilled = false;

    try {
      const buyResultPromise = this.buyCircuitBreaker!.execute(() =>
        buyExchange.createMarketOrder(symbol, 'buy', amount)
      );
      const sellResultPromise = this.sellCircuitBreaker!.execute(() =>
        sellExchange.createMarketOrder(symbol, 'sell', amount)
      );

      [buyResult, sellResult] = await Promise.allSettled([
        buyResultPromise,
        sellResultPromise,
      ]);

      buyFulfilled = buyResult.status === 'fulfilled';
      sellFulfilled = sellResult.status === 'fulfilled';
    } catch (error) {
      if (error instanceof Error && error.message.includes('Circuit breaker is open')) {
        throw error;
      }
      buyFulfilled = false;
      sellFulfilled = false;
      buyResult = { status: 'rejected', reason: error };
      sellResult = { status: 'rejected', reason: error };
    }

    // Record results in circuit breaker
    if (buyFulfilled && sellFulfilled) {
      const buyOrder = (buyResult as PromiseFulfilledResult<IOrder>).value;
      const sellOrder = (sellResult as PromiseFulfilledResult<IOrder>).value;
      const pnl = (sellOrder.price - buyOrder.price) * buyOrder.amount;
      this.buyCircuitBreaker!.recordTrade(pnl);
      this.sellCircuitBreaker!.recordTrade(pnl);
    } else {
      if (buyFulfilled) {
        this.buyCircuitBreaker!.recordTrade(0);
      } else if (buyResult.status === 'rejected') {
        const reason = buyResult.reason instanceof Error ? buyResult.reason.message : String(buyResult.reason);
        this.buyCircuitBreaker!.recordError(reason);
      }
      if (sellFulfilled) {
        this.sellCircuitBreaker!.recordTrade(0);
      } else if (sellResult.status === 'rejected') {
        const reason = sellResult.reason instanceof Error ? sellResult.reason.message : String(sellResult.reason);
        this.sellCircuitBreaker!.recordError(reason);
      }
    }

    const buyLatency = Date.now() - buyStart;
    const sellLatency = Date.now() - sellStart;
    const totalLatency = Date.now() - startTime;

    if (buyFulfilled && sellFulfilled) {
      const buyOrder = (buyResult as PromiseFulfilledResult<IOrder>).value;
      const sellOrder = (sellResult as PromiseFulfilledResult<IOrder>).value;
      const netPnl = this.estimateNetPnl(buyOrder, sellOrder);
      logger.info(`[AtomicExec] Success: pnl≈${netPnl.toFixed(4)} USD, latency=${totalLatency}ms`);
      return { success: true, buyOrder, sellOrder, buyLatency, sellLatency, totalLatency, netPnl, rollbackPerformed: false };
    }

    const rollbackPerformed = await this.handlePartialFailure(
      buyFulfilled ? (buyResult as PromiseFulfilledResult<IOrder>).value : null,
      sellFulfilled ? (sellResult as PromiseFulfilledResult<IOrder>).value : null,
      symbol,
      buyExchange,
      sellExchange,
    );

    const errorMsg = this.extractError(buyResult as PromiseSettledResult<IOrder>, sellResult as PromiseSettledResult<IOrder>);
    logger.error(`[AtomicExec] Failed: ${errorMsg} | rollback=${rollbackPerformed}`);

    return {
      success: false,
      buyOrder: buyFulfilled ? (buyResult as PromiseFulfilledResult<IOrder>).value : undefined,
      sellOrder: sellFulfilled ? (sellResult as PromiseFulfilledResult<IOrder>).value : undefined,
      buyLatency,
      sellLatency,
      totalLatency,
      netPnl: 0,
      error: errorMsg,
      rollbackPerformed,
    };
  }

  private async handlePartialFailure(
    buyOrder: IOrder | null,
    sellOrder: IOrder | null,
    symbol: string,
    buyExchange: IExchange,
    sellExchange: IExchange,
  ): Promise<boolean> {
    let performed = false;

    if (buyOrder && !sellOrder) {
      try {
        if (this.rollbackRetryHandler) {
          await this.rollbackRetryHandler.execute(async () =>
            buyExchange.createMarketOrder(symbol, 'sell', buyOrder.amount)
          );
        } else {
          await buyExchange.createMarketOrder(symbol, 'sell', buyOrder.amount);
        }
        logger.info(`[AtomicExec] Rollback: reversed buy order ${buyOrder.id} on ${buyExchange.name}`);
        performed = true;
      } catch (err) {
        logger.error(`[AtomicExec] Rollback FAILED for buy order ${buyOrder.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else if (sellOrder && !buyOrder) {
      try {
        if (this.rollbackRetryHandler) {
          await this.rollbackRetryHandler.execute(async () =>
            sellExchange.createMarketOrder(symbol, 'buy', sellOrder.amount)
          );
        } else {
          await sellExchange.createMarketOrder(symbol, 'buy', sellOrder.amount);
        }
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
