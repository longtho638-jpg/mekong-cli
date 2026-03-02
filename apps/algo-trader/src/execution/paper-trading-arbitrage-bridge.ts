/**
 * PaperTradingArbBridge — Bridge multiple PaperTradingEngine instances for arbitrage simulation.
 * Each exchange engine holds both USDT and base-currency balances (split 50/50 by value).
 * Routes buy orders to the buy-exchange engine and sell orders to the sell-exchange engine.
 * Aggregates P&L across all virtual exchanges.
 */

import { PaperTradingEngine, PaperTrade, PaperPosition, PaperPnl } from '../core/paper-trading-engine';
import { logger } from '../utils/logger';

export interface PaperArbConfig {
  exchanges: string[];
  initialBalancePerExchange: number; // USD per exchange
  slippagePct?: number;
  feeRate?: number;
  /** Approximate price used to seed base-currency balance. Default: 50000 (BTC-like). */
  seedPrice?: number;
}

export interface PaperArbExecuteParams {
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  amount: number;
  buyPrice: number;
  sellPrice: number;
}

export interface PaperArbResult {
  success: boolean;
  buyTradeId?: string;
  sellTradeId?: string;
  netPnl: number;
  fee: number;
  error?: string;
}

export interface AggregatedPnl {
  realized: number;
  unrealized: number;
  total: number;
  perExchange: Record<string, PaperPnl>;
}

export class PaperTradingArbBridge {
  private readonly engines: Map<string, PaperTradingEngine>;
  private readonly config: PaperArbConfig;

  constructor(config: PaperArbConfig) {
    this.config = config;
    this.engines = new Map();

    // Seed each engine with full USDT (for buy leg) AND equivalent base currency (for sell leg).
    // This allows any engine to act as buy-side or sell-side without running out of funds.
    const usd = config.initialBalancePerExchange;
    const seedPrice = config.seedPrice ?? 50000;
    const baseAmount = usd / seedPrice; // base units equivalent to full USD balance

    for (const exchangeId of config.exchanges) {
      const engine = new PaperTradingEngine({
        initialBalances: { USDT: usd, BTC: baseAmount, ETH: baseAmount * 15 },
        slippagePct: config.slippagePct ?? 0.001,
        feeRate: config.feeRate ?? 0.001,
      });
      this.engines.set(exchangeId, engine);
    }

    logger.info(`[PaperArb] Initialized ${config.exchanges.length} paper engines: ${config.exchanges.join(', ')}`);
  }

  /** Execute paper arb: buy on buyExchange, sell on sellExchange. */
  async executeArb(params: PaperArbExecuteParams): Promise<PaperArbResult> {
    const { symbol, buyExchange, sellExchange, amount, buyPrice, sellPrice } = params;

    const buyEngine = this.engines.get(buyExchange);
    const sellEngine = this.engines.get(sellExchange);

    if (!buyEngine) return { success: false, netPnl: 0, fee: 0, error: `Unknown buy exchange: ${buyExchange}` };
    if (!sellEngine) return { success: false, netPnl: 0, fee: 0, error: `Unknown sell exchange: ${sellExchange}` };

    try {
      buyEngine.updatePrice(symbol, buyPrice);
      sellEngine.updatePrice(symbol, sellPrice);

      const buyOrder = await buyEngine.createMarketOrder(symbol, 'buy', amount);
      const sellOrder = await sellEngine.createMarketOrder(symbol, 'sell', amount);

      const grossPnl = (sellOrder.price - buyOrder.price) * amount;
      const fee = (buyOrder.price + sellOrder.price) * amount * (this.config.feeRate ?? 0.001);

      return {
        success: true,
        buyTradeId: buyOrder.id,
        sellTradeId: sellOrder.id,
        netPnl: grossPnl - fee,
        fee,
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.warn(`[PaperArb] executeArb failed: ${msg}`);
      return { success: false, netPnl: 0, fee: 0, error: msg };
    }
  }

  /** Update prices across all paper engines. */
  updatePrices(ticks: Map<string, number>): void {
    for (const [exchangeId, engine] of this.engines) {
      for (const [symbol, price] of ticks) {
        engine.updatePrice(symbol, price);
      }
      logger.info(`[PaperArb] Updated ${ticks.size} prices on ${exchangeId}`);
    }
  }

  /** Aggregate P&L across all engines. */
  getAggregatedPnl(): AggregatedPnl {
    let realized = 0;
    let unrealized = 0;
    const perExchange: Record<string, PaperPnl> = {};

    for (const [exchangeId, engine] of this.engines) {
      const pnl = engine.getPnl();
      perExchange[exchangeId] = pnl;
      realized += pnl.realized;
      unrealized += pnl.unrealized;
    }

    return { realized, unrealized, total: realized + unrealized, perExchange };
  }

  /** Get all positions across all exchanges. */
  getAllPositions(): PaperPosition[] {
    const positions: PaperPosition[] = [];
    for (const engine of this.engines.values()) {
      positions.push(...engine.getPositions());
    }
    return positions;
  }

  /** Get combined trade history from all engines, sorted by timestamp ascending. */
  getCombinedHistory(): PaperTrade[] {
    const trades: PaperTrade[] = [];
    for (const engine of this.engines.values()) {
      trades.push(...engine.getTradeHistory());
    }
    return trades.sort((a, b) => a.timestamp - b.timestamp);
  }

  /** Reset all engines to initial state. */
  reset(): void {
    for (const engine of this.engines.values()) {
      engine.reset();
    }
    logger.info('[PaperArb] All engines reset');
  }

  getEngineIds(): string[] {
    return Array.from(this.engines.keys());
  }
}
