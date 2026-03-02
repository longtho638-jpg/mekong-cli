/**
 * Fee-Aware Cross-Exchange Spread Calculator.
 * Calculates net arbitrage spread after subtracting maker/taker fees and estimated slippage.
 * Dynamic fee lookup via CCXT with 5-minute TTL cache; fallback to static table.
 */

import { logger } from '../utils/logger';
import type { PriceTick } from './websocket-multi-exchange-price-feed-manager';

export interface SpreadResult {
  buyExchange: string;
  sellExchange: string;
  symbol: string;
  grossSpreadPct: number;
  netSpreadPct: number;
  buyPrice: number;
  sellPrice: number;
  buyFee: number;       // taker fee pct (e.g. 0.001 = 0.1%)
  sellFee: number;
  estimatedSlippagePct: number;
  profitable: boolean;
  estimatedProfitUsd: number;
  timestamp: number;
}

export interface SpreadCalculatorConfig {
  minProfitThresholdPct?: number; // default 0.0005 (0.05%)
  estimatedSlippagePct?: number;  // default 0.0005 (0.05%)
  positionSizeUsd?: number;       // for profit estimation, default 1000
  feeCacheTtlMs?: number;         // default 300_000 (5 min)
}

// Static fallback fee table: taker fees
const FALLBACK_TAKER_FEES: Record<string, number> = {
  binance: 0.001,  // 0.10%
  okx:     0.001,  // 0.10% (maker 0.08%, taker 0.10%)
  bybit:   0.001,  // 0.10%
};

interface FeeEntry {
  takerFee: number;
  cachedAt: number;
}

// Minimal CCXT exchange interface needed for fee lookup
interface CcxtExchangeLike {
  fetchTradingFee(symbol: string): Promise<{ taker?: number }>;
}

export class FeeAwareCrossExchangeSpreadCalculator {
  private feeCache = new Map<string, FeeEntry>(); // key: `${exchangeId}:${symbol}`
  private readonly minThreshold: number;
  private readonly slippage: number;
  private readonly positionSizeUsd: number;
  private readonly feeCacheTtlMs: number;

  constructor(
    private readonly exchangeClients: Record<string, CcxtExchangeLike>,
    config: SpreadCalculatorConfig = {},
  ) {
    this.minThreshold = config.minProfitThresholdPct ?? 0.0005;
    this.slippage = config.estimatedSlippagePct ?? 0.0005;
    this.positionSizeUsd = config.positionSizeUsd ?? 1000;
    this.feeCacheTtlMs = config.feeCacheTtlMs ?? 300_000;
  }

  /** Calculate spread for every unique exchange pair from latest ticks */
  async calculateAllSpreads(
    ticksByExchange: Map<string, PriceTick>,
    symbols: string[],
  ): Promise<SpreadResult[]> {
    const results: SpreadResult[] = [];
    const exchanges = Array.from(new Set(Array.from(ticksByExchange.values()).map(t => t.exchange)));

    for (const symbol of symbols) {
      for (let i = 0; i < exchanges.length; i++) {
        for (let j = 0; j < exchanges.length; j++) {
          if (i === j) continue;
          const buyExchange = exchanges[i];
          const sellExchange = exchanges[j];

          const buyTick = ticksByExchange.get(`${buyExchange}:${symbol}`);
          const sellTick = ticksByExchange.get(`${sellExchange}:${symbol}`);
          if (!buyTick || !sellTick) continue;

          const spread = await this.calculateSpread(buyExchange, sellExchange, symbol, buyTick.ask, sellTick.bid);
          if (spread) results.push(spread);
        }
      }
    }
    return results;
  }

  /** Calculate net spread for a single buy/sell exchange pair */
  async calculateSpread(
    buyExchange: string,
    sellExchange: string,
    symbol: string,
    buyPrice: number,
    sellPrice: number,
  ): Promise<SpreadResult | null> {
    if (buyPrice <= 0 || sellPrice <= 0) return null;

    const [buyFee, sellFee] = await Promise.all([
      this.getTakerFee(buyExchange, symbol),
      this.getTakerFee(sellExchange, symbol),
    ]);

    const grossSpreadPct = (sellPrice - buyPrice) / buyPrice;
    const netSpreadPct = grossSpreadPct - buyFee - sellFee - this.slippage;
    const profitable = netSpreadPct > this.minThreshold;
    const estimatedProfitUsd = profitable ? netSpreadPct * this.positionSizeUsd : 0;

    return {
      buyExchange,
      sellExchange,
      symbol,
      grossSpreadPct,
      netSpreadPct,
      buyPrice,
      sellPrice,
      buyFee,
      sellFee,
      estimatedSlippagePct: this.slippage,
      profitable,
      estimatedProfitUsd,
      timestamp: Date.now(),
    };
  }

  private async getTakerFee(exchangeId: string, symbol: string): Promise<number> {
    const cacheKey = `${exchangeId}:${symbol}`;
    const cached = this.feeCache.get(cacheKey);

    if (cached && (Date.now() - cached.cachedAt) < this.feeCacheTtlMs) {
      return cached.takerFee;
    }

    const client = this.exchangeClients[exchangeId];
    if (client) {
      try {
        const fee = await client.fetchTradingFee(symbol);
        const takerFee = fee.taker ?? FALLBACK_TAKER_FEES[exchangeId] ?? 0.001;
        this.feeCache.set(cacheKey, { takerFee, cachedAt: Date.now() });
        return takerFee;
      } catch (err) {
        logger.warn(`[SpreadCalc] Fee fetch failed for ${exchangeId}/${symbol}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    const fallback = FALLBACK_TAKER_FEES[exchangeId] ?? 0.001;
    this.feeCache.set(cacheKey, { takerFee: fallback, cachedAt: Date.now() });
    return fallback;
  }
}
