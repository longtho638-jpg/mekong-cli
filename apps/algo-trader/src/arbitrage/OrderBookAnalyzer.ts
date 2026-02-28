/**
 * OrderBookAnalyzer — Orderbook depth analysis for accurate slippage estimation.
 * Simulates market order fill against real orderbook levels to calculate
 * actual execution price, slippage cost, and liquidity scoring.
 *
 * Used by ArbitrageExecutor to pre-validate trade feasibility before execution.
 */

import { logger } from '../utils/logger';

export interface OrderBookLevel {
  price: number;
  amount: number;  // Base currency quantity at this level
}

export interface OrderBook {
  exchange: string;
  symbol: string;
  bids: OrderBookLevel[];  // Sorted descending (highest first)
  asks: OrderBookLevel[];  // Sorted ascending (lowest first)
  timestamp: number;
}

export interface SlippageEstimate {
  side: 'buy' | 'sell';
  exchange: string;
  symbol: string;
  requestedAmount: number;
  avgFillPrice: number;
  worstPrice: number;
  slippageBps: number;        // Slippage from best price in basis points
  slippageCostUsd: number;    // Dollar cost of slippage
  levelsConsumed: number;     // Number of orderbook levels needed
  fillable: boolean;          // Whether full amount can be filled
  filledAmount: number;       // Actual filled amount (may be less if illiquid)
  depthUsd: number;           // Total USD depth available
}

export interface LiquidityScore {
  exchange: string;
  symbol: string;
  bidDepthUsd: number;        // Total bid side depth in USD
  askDepthUsd: number;        // Total ask side depth in USD
  midPrice: number;           // Mid-market price
  bidAskSpreadBps: number;    // Native bid-ask spread in bps
  score: number;              // 0-100 liquidity score
  timestamp: number;
}

export interface ArbitrageFillSimulation {
  buyEstimate: SlippageEstimate;
  sellEstimate: SlippageEstimate;
  totalSlippageBps: number;
  totalSlippageCostUsd: number;
  effectiveSpreadPercent: number;   // Spread after accounting for slippage
  feasible: boolean;                // Whether trade is still profitable
}

export class OrderBookAnalyzer {
  private orderbooks: Map<string, OrderBook> = new Map(); // "exchange:symbol" → orderbook

  /**
   * Update orderbook data for an exchange/symbol pair.
   */
  updateOrderBook(orderbook: OrderBook): void {
    const key = `${orderbook.exchange}:${orderbook.symbol}`;
    this.orderbooks.set(key, orderbook);
  }

  /**
   * Estimate slippage for a market buy order.
   * Walks the ask side of the orderbook to simulate fill.
   */
  estimateBuySlippage(exchange: string, symbol: string, amountBase: number): SlippageEstimate {
    return this.estimateSlippage(exchange, symbol, amountBase, 'buy');
  }

  /**
   * Estimate slippage for a market sell order.
   * Walks the bid side of the orderbook to simulate fill.
   */
  estimateSellSlippage(exchange: string, symbol: string, amountBase: number): SlippageEstimate {
    return this.estimateSlippage(exchange, symbol, amountBase, 'sell');
  }

  /**
   * Core slippage estimation: simulate market order fill against orderbook.
   */
  private estimateSlippage(
    exchange: string,
    symbol: string,
    requestedAmount: number,
    side: 'buy' | 'sell'
  ): SlippageEstimate {
    const key = `${exchange}:${symbol}`;
    const ob = this.orderbooks.get(key);

    if (!ob) {
      return this.noDataEstimate(exchange, symbol, requestedAmount, side);
    }

    const levels = side === 'buy' ? ob.asks : ob.bids;
    if (levels.length === 0) {
      return this.noDataEstimate(exchange, symbol, requestedAmount, side);
    }

    const bestPrice = levels[0].price;
    let remainingAmount = requestedAmount;
    let totalCost = 0;
    let filledAmount = 0;
    let levelsConsumed = 0;
    let worstPrice = bestPrice;
    let totalDepthUsd = 0;

    for (const level of levels) {
      totalDepthUsd += level.price * level.amount;

      if (remainingAmount <= 0) break;

      const fillAtLevel = Math.min(remainingAmount, level.amount);
      totalCost += fillAtLevel * level.price;
      filledAmount += fillAtLevel;
      remainingAmount -= fillAtLevel;
      levelsConsumed++;
      worstPrice = level.price;
    }

    const avgFillPrice = filledAmount > 0 ? totalCost / filledAmount : bestPrice;
    const slippageBps = bestPrice > 0
      ? Math.abs(avgFillPrice - bestPrice) / bestPrice * 10000
      : 0;
    const slippageCostUsd = Math.abs(avgFillPrice - bestPrice) * filledAmount;

    return {
      side,
      exchange,
      symbol,
      requestedAmount,
      avgFillPrice,
      worstPrice,
      slippageBps,
      slippageCostUsd,
      levelsConsumed,
      fillable: remainingAmount <= 0,
      filledAmount,
      depthUsd: totalDepthUsd,
    };
  }

  /**
   * Simulate a full arbitrage fill: buy on one exchange, sell on another.
   * Returns combined slippage impact and whether the trade is still feasible.
   */
  simulateArbitrageFill(
    buyExchange: string,
    sellExchange: string,
    symbol: string,
    amountBase: number,
    feeRatePerSide: number
  ): ArbitrageFillSimulation {
    const buyEstimate = this.estimateBuySlippage(buyExchange, symbol, amountBase);
    const sellEstimate = this.estimateSellSlippage(sellExchange, symbol, amountBase);

    const totalSlippageBps = buyEstimate.slippageBps + sellEstimate.slippageBps;
    const totalSlippageCostUsd = buyEstimate.slippageCostUsd + sellEstimate.slippageCostUsd;

    // Calculate effective spread after slippage
    const effectiveBuyPrice = buyEstimate.avgFillPrice;
    const effectiveSellPrice = sellEstimate.avgFillPrice;
    const grossSpread = effectiveSellPrice - effectiveBuyPrice;
    const feesCost = (effectiveBuyPrice + effectiveSellPrice) * amountBase * feeRatePerSide;
    const netProfit = grossSpread * amountBase - feesCost - totalSlippageCostUsd;

    const effectiveSpreadPercent = effectiveBuyPrice > 0
      ? (grossSpread / effectiveBuyPrice) * 100
      : 0;

    return {
      buyEstimate,
      sellEstimate,
      totalSlippageBps,
      totalSlippageCostUsd,
      effectiveSpreadPercent,
      feasible: netProfit > 0 && buyEstimate.fillable && sellEstimate.fillable,
    };
  }

  /**
   * Calculate liquidity score for an exchange/symbol pair.
   * Higher score = more liquid = safer for arbitrage.
   */
  getLiquidityScore(exchange: string, symbol: string): LiquidityScore {
    const key = `${exchange}:${symbol}`;
    const ob = this.orderbooks.get(key);

    if (!ob || ob.bids.length === 0 || ob.asks.length === 0) {
      return {
        exchange, symbol,
        bidDepthUsd: 0, askDepthUsd: 0,
        midPrice: 0, bidAskSpreadBps: 0,
        score: 0, timestamp: Date.now(),
      };
    }

    const bidDepthUsd = ob.bids.reduce((sum, l) => sum + l.price * l.amount, 0);
    const askDepthUsd = ob.asks.reduce((sum, l) => sum + l.price * l.amount, 0);

    const bestBid = ob.bids[0].price;
    const bestAsk = ob.asks[0].price;
    const midPrice = (bestBid + bestAsk) / 2;
    const bidAskSpreadBps = midPrice > 0 ? ((bestAsk - bestBid) / midPrice) * 10000 : 0;

    // Score: combine depth + tight spread
    // Max depth contribution: 50 points (capped at $100k depth)
    // Max spread contribution: 50 points (spread < 5 bps = full score)
    const totalDepth = bidDepthUsd + askDepthUsd;
    const depthScore = Math.min(50, (totalDepth / 100000) * 50);
    const spreadScore = Math.max(0, 50 - bidAskSpreadBps * 10);
    const score = Math.round(depthScore + spreadScore);

    return {
      exchange, symbol,
      bidDepthUsd, askDepthUsd,
      midPrice, bidAskSpreadBps,
      score: Math.min(100, score),
      timestamp: Date.now(),
    };
  }

  /**
   * Get best exchange to buy from (lowest ask + best liquidity).
   */
  getBestBuyExchange(symbol: string, amountBase: number): { exchange: string; avgPrice: number; slippageBps: number } | null {
    const candidates: { exchange: string; avgPrice: number; slippageBps: number }[] = [];

    for (const [key, ob] of this.orderbooks) {
      if (!key.endsWith(`:${symbol}`)) continue;

      const estimate = this.estimateBuySlippage(ob.exchange, symbol, amountBase);
      if (estimate.fillable && estimate.avgFillPrice > 0) {
        candidates.push({
          exchange: ob.exchange,
          avgPrice: estimate.avgFillPrice,
          slippageBps: estimate.slippageBps,
        });
      }
    }

    if (candidates.length === 0) return null;
    return candidates.sort((a, b) => a.avgPrice - b.avgPrice)[0];
  }

  /**
   * Get best exchange to sell on (highest bid + best liquidity).
   */
  getBestSellExchange(symbol: string, amountBase: number): { exchange: string; avgPrice: number; slippageBps: number } | null {
    const candidates: { exchange: string; avgPrice: number; slippageBps: number }[] = [];

    for (const [key, ob] of this.orderbooks) {
      if (!key.endsWith(`:${symbol}`)) continue;

      const estimate = this.estimateSellSlippage(ob.exchange, symbol, amountBase);
      if (estimate.fillable && estimate.avgFillPrice > 0) {
        candidates.push({
          exchange: ob.exchange,
          avgPrice: estimate.avgFillPrice,
          slippageBps: estimate.slippageBps,
        });
      }
    }

    if (candidates.length === 0) return null;
    return candidates.sort((a, b) => b.avgPrice - a.avgPrice)[0]; // Highest price first
  }

  /** Check if orderbook data exists for an exchange/symbol */
  hasOrderBook(exchange: string, symbol: string): boolean {
    return this.orderbooks.has(`${exchange}:${symbol}`);
  }

  /** Clear all orderbook data */
  clear(): void {
    this.orderbooks.clear();
  }

  private noDataEstimate(exchange: string, symbol: string, amount: number, side: 'buy' | 'sell'): SlippageEstimate {
    logger.warn(`[OrderBook] No orderbook data for ${exchange}:${symbol}`);
    return {
      side, exchange, symbol,
      requestedAmount: amount,
      avgFillPrice: 0, worstPrice: 0,
      slippageBps: 0, slippageCostUsd: 0,
      levelsConsumed: 0, fillable: false,
      filledAmount: 0, depthUsd: 0,
    };
  }
}
