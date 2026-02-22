import * as ccxt from 'ccxt';
import { IExchange, IOrder, IBalance } from '../interfaces/IExchange';

import { logger } from '../utils/logger';

export class ExchangeClient implements IExchange {
  name: string;
  private exchange: ccxt.Exchange;

  constructor(exchangeId: string, apiKey?: string, secret?: string) {
    this.name = exchangeId;

    // Check if exchange exists in ccxt
    const exchangeClass = (ccxt as Record<string, any>)[exchangeId];
    if (!exchangeClass) {
      throw new Error(`Exchange ${exchangeId} not found in CCXT`);
    }

    this.exchange = new exchangeClass({
      apiKey,
      secret,
      enableRateLimit: true,
      options: { defaultType: 'spot' } // Default to spot
    });
  }

  async connect(): Promise<void> {
    // CCXT doesn't strictly need connection for REST, but we can load markets
    logger.info(`Connecting to ${this.name}...`);
    await this.exchange.loadMarkets();
    logger.info(`Connected to ${this.name}. Loaded ${Object.keys(this.exchange.markets).length} markets.`);
  }

  async fetchTicker(symbol: string): Promise<number> {
    const ticker = await this.exchange.fetchTicker(symbol);
    return ticker.last || 0;
  }

  async createMarketOrder(symbol: string, side: 'buy' | 'sell', amount: number): Promise<IOrder> {
    const order = await this.exchange.createOrder(symbol, 'market', side, amount);

    return {
      id: order.id,
      symbol: order.symbol,
      side: order.side as 'buy' | 'sell',
      amount: order.amount,
      price: order.price || order.average || 0, // Fallback if price is not immediately available
      status: order.status === 'open' ? 'open' : 'closed', // Simplified mapping
      timestamp: order.timestamp
    };
  }

  async fetchBalance(): Promise<Record<string, IBalance>> {
    const balance = await this.exchange.fetchBalance();
    const result: Record<string, IBalance> = {};

    if (balance.total) {
      for (const currency in balance.total) {
        if ((balance.total as unknown as Record<string, number>)[currency] > 0) {
          result[currency] = {
            currency,
            free: (balance.free as unknown as Record<string, number>)[currency] || 0,
            used: (balance.used as unknown as Record<string, number>)[currency] || 0,
            total: (balance.total as unknown as Record<string, number>)[currency] || 0
          };
        }
      }
    }
    return result;
  }
}
