import * as ccxt from 'ccxt';
import { IExchange, IOrder, IBalance } from '../interfaces/IExchange';

import { logger } from '../utils/logger';

export class ExchangeClient implements IExchange {
  name: string;
  private exchange: ccxt.Exchange;

  constructor(exchangeId: string, apiKey?: string, secret?: string) {
    this.name = exchangeId;

    // Check if exchange exists in ccxt
    const exchangeClass = (ccxt as unknown as Record<string, new (config: Record<string, unknown>) => ccxt.Exchange>)[exchangeId];
    if (!exchangeClass) {
      throw new Error(`Exchange ${exchangeId} not found in CCXT`);
    }

    this.exchange = new exchangeClass({
      apiKey,
      secret,
      enableRateLimit: true,
      timeout: 30000, // Preempt silent hang via 30s timeout
      options: { defaultType: 'spot' } // Default to spot
    });
  }

  async connect(): Promise<void> {
    // CCXT doesn't strictly need connection for REST, but we can load markets
    logger.info(`Connecting to ${this.name}...`);
    await this.exchange.loadMarkets();
    logger.info(`Connected to ${this.name}. Loaded ${Object.keys(this.exchange.markets).length} markets.`);
  }

  private async retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) throw error;
      const isRateLimit = error instanceof Error && (
        error.message.includes('429') || error.message.includes('RateLimitExceeded')
      );
      const backoff = isRateLimit ? delay * 2 : delay;
      logger.warn(`Retrying on ${this.name} (${retries} left, wait ${backoff}ms): ${error instanceof Error ? error.message : String(error)}`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return this.retry(fn, retries - 1, backoff);
    }
  }

  async fetchTicker(symbol: string): Promise<number> {
    const ticker = await this.retry(() => this.exchange.fetchTicker(symbol));
    return ticker.last || 0;
  }

  async createMarketOrder(symbol: string, side: 'buy' | 'sell', amount: number): Promise<IOrder> {
    const preciseAmountStr = this.exchange.amountToPrecision(symbol, amount);
    const preciseAmount = parseFloat(preciseAmountStr);

    // Validate against exchange minimums
    const market = this.exchange.markets[symbol];
    if (market) {
      const minAmount = market.limits?.amount?.min;
      const minCost = market.limits?.cost?.min;
      if (minAmount && preciseAmount < minAmount) {
        throw new Error(`Order amount ${preciseAmount} below exchange minimum ${minAmount} for ${symbol}`);
      }
      if (minCost) {
        const ticker = await this.fetchTicker(symbol);
        const estimatedCost = preciseAmount * ticker;
        if (estimatedCost < minCost) {
          throw new Error(`Order cost ~$${estimatedCost.toFixed(2)} below exchange minimum $${minCost} for ${symbol}`);
        }
      }
    }

    const order = await this.retry(() => this.exchange.createOrder(symbol, 'market', side, preciseAmount));

    const filledPrice = order.average || order.price || 0;
    if (filledPrice === 0) {
      logger.warn(`[ExchangeClient] Order ${order.id} returned price=0 — may need manual verification`);
    }

    return {
      id: order.id,
      symbol: order.symbol,
      side: order.side as 'buy' | 'sell',
      amount: order.amount,
      price: filledPrice,
      status: order.status === 'open' ? 'open' : 'closed',
      timestamp: order.timestamp
    };
  }

  async fetchBalance(): Promise<Record<string, IBalance>> {
    const balance = await this.retry(() => this.exchange.fetchBalance());
    const result: Record<string, IBalance> = {};

    // ccxt types balance.total/free/used as Dictionary<number> which is
    // compatible with Record<string, number>. The double-cast through unknown
    // is required because ccxt's internal Dictionary type is not exported.
    type CurrencyMap = Record<string, number>;
    const total = balance.total as unknown as CurrencyMap | undefined;
    const free  = balance.free  as unknown as CurrencyMap | undefined;
    const used  = balance.used  as unknown as CurrencyMap | undefined;

    if (total) {
      for (const [currency, amount] of Object.entries(total)) {
        if (amount > 0) {
          result[currency] = {
            currency,
            free: free?.[currency] || 0,
            used: used?.[currency] || 0,
            total: amount
          };
        }
      }
    }
    return result;
  }
}
