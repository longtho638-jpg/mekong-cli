/**
 * Order Router — Smart Order Routing (SOR) for multi-exchange trading
 *
 * Routes orders to optimal exchange based on:
 * - Best spread (bid-ask)
 * - Trading fees
 * - Latency
 * - Slippage estimation
 *
 * PRO FEATURE: Requires PRO license for multi-exchange routing
 */

import { LicenseService, LicenseTier } from '../lib/raas-gate';
import { logger } from '../utils/logger';

export interface ExchangeQuote {
  exchange: string;
  symbol: string;
  bid: number;
  ask: number;
  feeRate: number;
  latencyMs: number;
  effectivePrice: number; // price after fees
}

export interface OrderSignal {
  symbol: string;
  side: 'BUY' | 'SELL';
  amount: number; // in quote currency (USDT)
  timestamp: number;
}

export interface OrderResult {
  success: boolean;
  exchange?: string;
  price?: number;
  amount?: number;
  fee?: number;
  error?: string;
}

interface ExchangeConfig {
  feeRate: number; // maker/taker fee (default 0.1%)
  enabled: boolean;
}

const DEFAULT_EXCHANGE_CONFIGS: Record<string, ExchangeConfig> = {
  binance: { feeRate: 0.001, enabled: true },
  okx: { feeRate: 0.0008, enabled: true },
  bybit: { feeRate: 0.001, enabled: true },
};

export class OrderRouter {
  private licenseService: LicenseService;
  private exchangeConfigs: Map<string, ExchangeConfig>;
  private latencies: Map<string, number>; // exchange -> avg latency ms
  private prices: Map<string, ExchangeQuote>; // symbol -> latest quotes

  constructor() {
    this.licenseService = LicenseService.getInstance();
    this.exchangeConfigs = new Map(Object.entries(DEFAULT_EXCHANGE_CONFIGS));
    this.latencies = new Map();
    this.prices = new Map();
  }

  /**
   * Route order to best exchange
   * PRO FEATURE: Multi-exchange routing requires PRO license
   */
  async routeOrder(signal: OrderSignal): Promise<OrderResult> {
    try {
      // Check for multi-exchange routing (PRO feature)
      const useMultiExchange = this.exchangeConfigs.size > 1;
      if (useMultiExchange) {
        this.licenseService.requireTier(LicenseTier.PRO, 'multi_exchange');
      }

      // Get best exchange
      const bestQuote = this.getBestExchange(signal.symbol, signal.side);
      if (!bestQuote) {
        return {
          success: false,
          error: 'No quotes available',
        };
      }

      // Estimate slippage
      const slippage = this.estimateSlippage(signal.symbol, signal.amount);
      const finalPrice = signal.side === 'BUY'
        ? bestQuote.ask * (1 + slippage)
        : bestQuote.bid * (1 - slippage);

      // Calculate fees
      const fee = signal.amount * bestQuote.feeRate;

      logger.info('[OrderRouter] Routing order', {
        exchange: bestQuote.exchange,
        symbol: signal.symbol,
        side: signal.side,
        amount: signal.amount,
        price: finalPrice,
        fee,
        slippage,
      });

      return {
        success: true,
        exchange: bestQuote.exchange,
        price: finalPrice,
        amount: signal.amount - fee,
        fee,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[OrderRouter] Failed to route order', { error: message });
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Get best exchange for a symbol
   * Considers: spread, fees, latency
   */
  getBestExchange(symbol: string, side: 'BUY' | 'SELL'): ExchangeQuote | null {
    const quotes: ExchangeQuote[] = [];

    for (const [exchange, config] of this.exchangeConfigs) {
      if (!config.enabled) continue;

      const key = `${exchange}:${symbol}`;
      const quote = this.prices.get(key);
      if (!quote) continue;

      const latency = this.latencies.get(exchange) ?? 100; // default 100ms
      const effectivePrice = side === 'BUY'
        ? quote.ask * (1 + config.feeRate)
        : quote.bid * (1 - config.feeRate);

      quotes.push({
        ...quote,
        feeRate: config.feeRate,
        latencyMs: latency,
        effectivePrice,
      });
    }

    if (quotes.length === 0) return null;

    // Sort by effective price (best first)
    quotes.sort((a, b) => {
      if (side === 'BUY') {
        return a.effectivePrice - b.effectivePrice; // Lower is better for buy
      }
      return b.effectivePrice - a.effectivePrice; // Higher is better for sell
    });

    return quotes[0];
  }

  /**
   * Estimate slippage based on order size
   * Simple model: 0.01% per 1000 USDT
   */
  estimateSlippage(symbol: string, amount: number): number {
    const baseSlippage = 0.0001; // 0.01%
    const slippagePerUnit = baseSlippage / 1000;
    return Math.min(baseSlippage + amount * slippagePerUnit, 0.01); // Cap at 1%
  }

  /**
   * Update price quote for an exchange
   */
  updateQuote(exchange: string, symbol: string, bid: number, ask: number): void {
    const key = `${exchange}:${symbol}`;
    const existing = this.prices.get(key);

    this.prices.set(key, {
      exchange,
      symbol,
      bid,
      ask,
      feeRate: this.exchangeConfigs.get(exchange)?.feeRate ?? 0.001,
      latencyMs: this.latencies.get(exchange) ?? 100,
      effectivePrice: 0,
    });
  }

  /**
   * Update latency for an exchange
   */
  updateLatency(exchange: string, latencyMs: number): void {
    // Exponential moving average
    const existing = this.latencies.get(exchange) ?? latencyMs;
    const alpha = 0.3; // Smoothing factor
    const smoothed = alpha * latencyMs + (1 - alpha) * existing;
    this.latencies.set(exchange, smoothed);
  }

  /**
   * Get current exchange quotes
   */
  getQuotes(symbol?: string): Map<string, ExchangeQuote> {
    if (!symbol) {
      return new Map(this.prices);
    }
    const filtered = new Map<string, ExchangeQuote>();
    for (const [key, quote] of this.prices) {
      if (key.includes(symbol)) {
        filtered.set(key, quote);
      }
    }
    return filtered;
  }

  /**
   * Enable/disable an exchange
   */
  setExchangeEnabled(exchange: string, enabled: boolean): void {
    const config = this.exchangeConfigs.get(exchange);
    if (config) {
      config.enabled = enabled;
      this.exchangeConfigs.set(exchange, config);
    }
  }

  /**
   * Get exchange latencies
   */
  getLatencies(): Map<string, number> {
    return new Map(this.latencies);
  }

  /**
   * Clear all state (for testing)
   */
  reset(): void {
    this.prices.clear();
    this.latencies.clear();
  }
}

// Singleton instance
let instance: OrderRouter | null = null;

export function getOrderRouter(): OrderRouter {
  if (!instance) {
    instance = new OrderRouter();
  }
  return instance;
}
