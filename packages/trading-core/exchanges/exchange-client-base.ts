/**
 * ExchangeClientBase — CCXT wrapper implementing IExchange interface.
 * Provides connect, fetchTicker, createMarketOrder, fetchBalance, fetchOrderBook
 * with retry logic and rate limit handling.
 *
 * Used as base class for exchange-specific adapters (Binance, OKX, Bybit).
 * Requires ccxt as peer dependency at runtime.
 */

import { IExchange, IOrder, IBalance, IOrderBook } from '../interfaces/exchange-types';

/* eslint-disable @typescript-eslint/no-explicit-any */
// CCXT types are resolved at runtime via require() — typed as `unknown` at package boundary
// to avoid requiring ccxt type declarations as a build-time dependency.

export class ExchangeClientBase implements IExchange {
  name: string;
  protected exchange: unknown;

  constructor(exchangeId: string, apiKey?: string, secret?: string) {
    this.name = exchangeId;

    // Dynamic CCXT exchange instantiation (peer dependency)
    const ccxtLib = require('ccxt');
    const ExchangeClass = ccxtLib[exchangeId];
    if (!ExchangeClass) {
      throw new Error(`Exchange ${exchangeId} not found in CCXT`);
    }

    this.exchange = new ExchangeClass({
      apiKey,
      secret,
      enableRateLimit: true,
      timeout: 30000,
      options: { defaultType: 'spot' },
    });
  }

  async connect(): Promise<void> {
    await this.exchange.loadMarkets();
  }

  protected async retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) throw error;
      const isRateLimit = error instanceof Error && (
        error.message.includes('429') || error.message.includes('RateLimitExceeded')
      );
      const backoff = isRateLimit ? delay * 2 : delay;
      await new Promise(resolve => setTimeout(resolve, backoff));
      return this.retry(fn, retries - 1, backoff);
    }
  }

  async fetchTicker(symbol: string): Promise<number> {
    const ticker = await this.retry(() => this.exchange.fetchTicker(symbol)) as { last?: number };
    return ticker.last || 0;
  }

  async createMarketOrder(symbol: string, side: 'buy' | 'sell', amount: number): Promise<IOrder> {
    const preciseAmountStr = this.exchange.amountToPrecision(symbol, amount);
    const preciseAmount = parseFloat(preciseAmountStr);

    const market = this.exchange.markets?.[symbol];
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

    const order = await this.retry(() => this.exchange.createOrder(symbol, 'market', side, preciseAmount)) as {
      id: string; symbol: string; side: string; amount: number;
      average?: number; price?: number; status: string; timestamp: number;
    };
    const filledPrice = order.average || order.price || 0;

    return {
      id: order.id,
      symbol: order.symbol,
      side: order.side as 'buy' | 'sell',
      amount: order.amount,
      price: filledPrice,
      status: order.status === 'open' ? 'open' : 'closed',
      timestamp: order.timestamp,
    };
  }

  async fetchOrderBook(symbol: string, limit = 20): Promise<IOrderBook> {
    const book = await this.retry(() => this.exchange.fetchOrderBook(symbol, limit)) as {
      bids?: number[][]; asks?: number[][]; timestamp?: number;
    };
    return {
      symbol,
      bids: (book.bids || []).map((entry: number[]) => ({ price: Number(entry[0]) || 0, amount: Number(entry[1]) || 0 })),
      asks: (book.asks || []).map((entry: number[]) => ({ price: Number(entry[0]) || 0, amount: Number(entry[1]) || 0 })),
      timestamp: book.timestamp || Date.now(),
    };
  }

  async fetchBalance(): Promise<Record<string, IBalance>> {
    const balance = await this.retry(() => this.exchange.fetchBalance()) as {
      total?: Record<string, number>; free?: Record<string, number>; used?: Record<string, number>;
    };
    const result: Record<string, IBalance> = {};

    const total = balance.total;
    const free = balance.free;
    const used = balance.used;

    if (total) {
      for (const [currency, amount] of Object.entries(total)) {
        if (amount > 0) {
          result[currency] = {
            currency,
            free: free?.[currency] || 0,
            used: used?.[currency] || 0,
            total: amount,
          };
        }
      }
    }
    return result;
  }
}
