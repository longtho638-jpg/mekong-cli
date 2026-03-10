/**
 * Arbitrage Executor
 *
 * Executes simultaneous buy+sell orders across two exchanges.
 * Handles partial fills with rollback logic.
 */

import { ExchangeClientBase } from '@agencyos/trading-core/exchanges';
import { IArbitrageOpportunity } from '../interfaces/IArbitrageOpportunity';
import { IOrder } from '../interfaces/IExchange';
import { ArbitrageRiskManager } from './arbitrage-risk-manager';
import { OrderManager } from '../core/OrderManager';
import {
  ArbitrageTradeResult,
  createRejectedResult,
  createDryRunResult,
} from './arbitrage-trade-result';
import { logger } from '../utils/logger';

interface LegResult {
  success: boolean;
  order: IOrder | null;
  error?: string;
  exchange: string;
}

export class ArbitrageExecutor {
  private clients: Map<string, ExchangeClientBase>;
  private riskManager: ArbitrageRiskManager;
  private orderManager: OrderManager;
  private dryRun: boolean;

  constructor(
    clients: Map<string, ExchangeClientBase>,
    riskManager: ArbitrageRiskManager,
    orderManager: OrderManager,
    dryRun: boolean = true
  ) {
    this.clients = clients;
    this.riskManager = riskManager;
    this.orderManager = orderManager;
    this.dryRun = dryRun;
  }

  /**
   * Execute arbitrage opportunity
   * Places simultaneous market buy on cheap exchange + market sell on expensive exchange
   */
  async execute(opp: IArbitrageOpportunity): Promise<ArbitrageTradeResult> {
    const startTime = Date.now();
    logger.info(
      `[ArbitrageExecutor] ${opp.id}: Executing arb ${opp.symbol} | ` +
      `BUY ${opp.buyExchange} @ ${opp.buyPrice} | SELL ${opp.sellExchange} @ ${opp.sellPrice} | ` +
      `Est. Profit: ${opp.netProfitPercent.toFixed(4)}% (${opp.estimatedProfitUsd.toFixed(2)} USD)`
    );

    // Dry run mode
    if (this.dryRun) {
      logger.info(`[ArbitrageExecutor] ${opp.id}: DRY RUN MODE - No real orders placed`);
      const dryRunResult = this.simulateDryRun(opp);
      return dryRunResult;
    }

    // Pre-check: Calculate position size based on available balance
    const positionSizeUsd = Math.min(
      opp.estimatedProfitUsd > 0 ? 100 : 0, // Default max position
      this.riskManager.getStatus().dailyPnlUsd > -500 ? 100 : 0
    );

    if (positionSizeUsd <= 0) {
      return createRejectedResult(opp, 'Insufficient balance or risk limits exceeded', Date.now() - startTime);
    }

    // Calculate amounts for each leg
    const buyAmount = positionSizeUsd / opp.buyPrice;
    const sellAmount = buyAmount; // Same quantity on both sides

    // Pre-execution risk check
    const buyBalance = await this.getExchangeBalance(opp.buyExchange);
    const sellBalance = await this.getExchangeBalance(opp.sellExchange);

    const preCheckResult = this.riskManager.preCheck(
      positionSizeUsd,
      buyBalance,
      sellBalance,
      sellAmount
    );

    if (!preCheckResult.allowed) {
      logger.warn(`[ArbitrageExecutor] ${opp.id}: Pre-check failed: ${preCheckResult.reason}`);
      return createRejectedResult(opp, preCheckResult.reason || 'Pre-check failed', Date.now() - startTime);
    }

    // Execute both legs simultaneously
    logger.info(`[ArbitrageExecutor] ${opp.id}: Placing simultaneous orders...`);
    const legs = await this.executeBothLegs(opp, buyAmount, sellAmount);

    // Handle outcomes
    const buyLeg = legs.find(l => l.exchange === opp.buyExchange);
    const sellLeg = legs.find(l => l.exchange === opp.sellExchange);

    let result: ArbitrageTradeResult;

    if (buyLeg?.success && sellLeg?.success) {
      // Both legs successful
      result = this.createSuccessResult(opp, buyLeg.order!, sellLeg.order!, startTime);
      logger.info(
        `[ArbitrageExecutor] ${opp.id}: SUCCESS | Profit: ${result.actualProfitUsd.toFixed(2)} USD ` +
        `(${result.actualProfitPercent.toFixed(4)}%)`
      );
    } else if (buyLeg?.success && !sellLeg?.success) {
      // Partial fill: bought but couldn't sell - rollback (sell back)
      logger.warn(`[ArbitrageExecutor] ${opp.id}: PARTIAL FILL - Buy succeeded, sell failed. Rolling back...`);
      const rollbackOrder = await this.rollback(opp.sellExchange, opp.symbol, 'buy', buyLeg.order!.amount);
      result = this.createPartialResult(opp, buyLeg.order, rollbackOrder, startTime, sellLeg?.error);
    } else if (!buyLeg?.success && sellLeg?.success) {
      // Partial fill: sold but couldn't buy - rollback (buy back)
      logger.warn(`[ArbitrageExecutor] ${opp.id}: PARTIAL FILL - Sell succeeded, buy failed. Rolling back...`);
      const rollbackOrder = await this.rollback(opp.buyExchange, opp.symbol, 'sell', sellLeg.order!.amount);
      result = this.createPartialResult(opp, rollbackOrder, sellLeg.order, startTime, buyLeg?.error);
    } else {
      // Both failed
      logger.error(`[ArbitrageExecutor] ${opp.id}: FAILED - Both legs rejected`);
      result = createRejectedResult(
        opp,
        `Buy: ${buyLeg?.error || 'unknown'} | Sell: ${sellLeg?.error || 'unknown'}`,
        Date.now() - startTime
      );
    }

    // Record trade in risk manager
    this.riskManager.recordTrade(result.actualProfitUsd);

    // Add orders to order manager
    if (result.buyOrder) {
      this.orderManager.addOrder(result.buyOrder);
    }
    if (result.sellOrder) {
      this.orderManager.addOrder(result.sellOrder);
    }

    return result;
  }

  /**
   * Execute both legs in parallel
   */
  private async executeBothLegs(
    opp: IArbitrageOpportunity,
    buyAmount: number,
    sellAmount: number
  ): Promise<LegResult[]> {
    const buyPromise = this.executeLeg(
      opp.buyExchange,
      opp.symbol,
      'buy',
      buyAmount,
      opp.buyPrice
    );

    const sellPromise = this.executeLeg(
      opp.sellExchange,
      opp.symbol,
      'sell',
      sellAmount,
      opp.sellPrice
    );

    const results = await Promise.allSettled([buyPromise, sellPromise]);

    return results.map((result, idx) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const exchange = idx === 0 ? opp.buyExchange : opp.sellExchange;
        return {
          success: false,
          order: null,
          error: result.reason || 'Promise rejected',
          exchange,
        };
      }
    });
  }

  /**
   * Execute single leg (buy or sell)
   */
  private async executeLeg(
    exchange: string,
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    expectedPrice: number
  ): Promise<LegResult> {
    const client = this.clients.get(exchange);
    if (!client) {
      return { success: false, order: null, error: `No client for ${exchange}`, exchange };
    }

    try {
      // Place market order
      const order = await client.createMarketOrder(symbol, side, amount);
      logger.info(
        `[ArbitrageExecutor] ${exchange}: ${side.toUpperCase()} ${amount} @ ${order.price} | ` +
        `Filled: ${order.amount} | Status: ${order.status}`
      );
      return { success: true, order, exchange };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[ArbitrageExecutor] ${exchange}: ${side.toUpperCase()} failed - ${errorMsg}`);
      return { success: false, order: null, error: errorMsg, exchange };
    }
  }

  /**
   * Rollback a partial fill by executing reverse trade
   */
  private async rollback(
    exchange: string,
    symbol: string,
    originalSide: 'buy' | 'sell',
    amount: number
  ): Promise<IOrder | null> {
    const client = this.clients.get(exchange);
    if (!client) {
      logger.error(`[ArbitrageExecutor] Rollback failed: No client for ${exchange}`);
      return null;
    }

    const reverseSide: 'buy' | 'sell' = originalSide === 'buy' ? 'sell' : 'buy';

    try {
      logger.warn(`[ArbitrageExecutor] Rolling back: ${reverseSide.toUpperCase()} ${amount} on ${exchange}`);
      const order = await client.createMarketOrder(symbol, reverseSide, amount);
      logger.info(`[ArbitrageExecutor] Rollback successful: ${reverseSide.toUpperCase()} ${amount} @ ${order.price}`);
      return order;
    } catch (error) {
      logger.error(
        `[ArbitrageExecutor] Rollback failed: ${error instanceof Error ? error.message : String(error)}`
      );
      return null;
    }
  }

  /**
   * Get balance for an exchange (cached or fetched)
   */
  private async getExchangeBalance(exchange: string): Promise<number> {
    const client = this.clients.get(exchange);
    if (!client) return 0;

    try {
      const balance = await client.fetchBalance();
      // Return USDT balance for simplicity
      return balance.USDT?.free || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Create success result from executed orders
   */
  private createSuccessResult(
    opp: IArbitrageOpportunity,
    buyOrder: IOrder,
    sellOrder: IOrder,
    startTime: number
  ): ArbitrageTradeResult {
    const { profitUsd, profitPercent } = this.calculateProfit(buyOrder, sellOrder);

    return {
      opportunity: opp,
      status: 'success',
      buyOrder,
      sellOrder,
      actualBuyPrice: buyOrder.price,
      actualSellPrice: sellOrder.price,
      actualProfitUsd: profitUsd,
      actualProfitPercent: profitPercent,
      executionTimeMs: Date.now() - startTime,
      timestamp: Date.now(),
    };
  }

  /**
   * Create partial fill result
   */
  private createPartialResult(
    opp: IArbitrageOpportunity,
    buyOrder: IOrder | null,
    sellOrder: IOrder | null,
    startTime: number,
    error?: string
  ): ArbitrageTradeResult {
    const { profitUsd, profitPercent } = this.calculateProfit(buyOrder, sellOrder);

    return {
      opportunity: opp,
      status: 'partial_fill',
      buyOrder,
      sellOrder,
      actualBuyPrice: buyOrder?.price || 0,
      actualSellPrice: sellOrder?.price || 0,
      actualProfitUsd: profitUsd,
      actualProfitPercent: profitPercent,
      executionTimeMs: Date.now() - startTime,
      error,
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate profit from orders
   */
  private calculateProfit(
    buyOrder: IOrder | null,
    sellOrder: IOrder | null
  ): { profitUsd: number; profitPercent: number } {
    if (!buyOrder || !sellOrder) {
      return { profitUsd: 0, profitPercent: 0 };
    }

    const cost = buyOrder.amount * buyOrder.price;
    const revenue = sellOrder.amount * sellOrder.price;
    const profitUsd = revenue - cost;
    const profitPercent = cost > 0 ? (profitUsd / cost) * 100 : 0;

    return { profitUsd, profitPercent };
  }

  /**
   * Simulate dry-run execution (no real orders)
   */
  private simulateDryRun(opp: IArbitrageOpportunity): ArbitrageTradeResult {
    const executionTimeMs = Math.floor(Math.random() * 200) + 100; // 100-300ms simulated latency
    return createDryRunResult(opp, executionTimeMs);
  }
}
