/**
 * Order Book Depth Analyzer — Analyzes real order book depth to calculate
 * actual slippage, liquidity score, and optimal execution size before
 * executing arbitrage trades. Replaces estimated slippage with real data.
 */

import type { IOrderBook } from '../interfaces/IExchange';

export interface DepthAnalysis {
  exchange: string;
  symbol: string;
  side: 'buy' | 'sell';
  requestedAmount: number;
  /** Weighted average fill price based on order book depth */
  avgFillPrice: number;
  /** Best available price (top of book) */
  bestPrice: number;
  /** Actual slippage percentage from best price */
  slippagePct: number;
  /** Total cost/revenue in quote currency */
  totalQuote: number;
  /** Number of order book levels consumed */
  levelsConsumed: number;
  /** Whether the book has enough liquidity for the full amount */
  fullyFillable: boolean;
  /** Maximum fillable amount at current depth */
  maxFillableAmount: number;
  /** Liquidity score 0-100 (higher = deeper book) */
  liquidityScore: number;
  timestamp: number;
}

export interface SpreadDepthAnalysis {
  buyAnalysis: DepthAnalysis;
  sellAnalysis: DepthAnalysis;
  /** Net spread after real slippage on both sides */
  netSpreadPct: number;
  /** Whether both sides are fully fillable */
  executable: boolean;
  /** Estimated real profit in USD */
  estimatedProfitUsd: number;
  /** Combined slippage from both sides */
  totalSlippagePct: number;
}

export interface DepthAnalyzerConfig {
  /** Min liquidity score to allow trade. Default 30 */
  minLiquidityScore?: number;
  /** Max acceptable slippage %. Default 0.005 (0.5%) */
  maxSlippagePct?: number;
  /** Depth levels to consider. Default 20 */
  maxDepthLevels?: number;
}

export class OrderBookDepthAnalyzer {
  private readonly config: Required<DepthAnalyzerConfig>;

  constructor(config: DepthAnalyzerConfig = {}) {
    this.config = {
      minLiquidityScore: config.minLiquidityScore ?? 30,
      maxSlippagePct: config.maxSlippagePct ?? 0.005,
      maxDepthLevels: config.maxDepthLevels ?? 20,
    };
  }

  /**
   * Analyze order book depth for a specific side (buy or sell).
   * For buy: walks through asks (we pay ask prices).
   * For sell: walks through bids (we receive bid prices).
   */
  analyzeDepth(
    orderBook: IOrderBook,
    exchange: string,
    side: 'buy' | 'sell',
    amount: number,
  ): DepthAnalysis {
    const entries = side === 'buy'
      ? orderBook.asks.slice(0, this.config.maxDepthLevels)
      : orderBook.bids.slice(0, this.config.maxDepthLevels);

    if (entries.length === 0) {
      return this.emptyAnalysis(exchange, orderBook.symbol, side, amount);
    }

    const bestPrice = entries[0].price;
    let remaining = amount;
    let totalQuote = 0;
    let levelsConsumed = 0;
    let maxFillableAmount = 0;

    for (const entry of entries) {
      if (remaining <= 0) break;
      levelsConsumed++;

      const fillAmount = Math.min(remaining, entry.amount);
      totalQuote += fillAmount * entry.price;
      maxFillableAmount += entry.amount;
      remaining -= fillAmount;
    }

    const filledAmount = amount - Math.max(remaining, 0);
    const avgFillPrice = filledAmount > 0 ? totalQuote / filledAmount : bestPrice;
    const fullyFillable = remaining <= 0;

    // Slippage: difference between avg fill and best price
    const slippagePct = bestPrice > 0
      ? Math.abs(avgFillPrice - bestPrice) / bestPrice
      : 0;

    // Liquidity score: based on how much depth is available vs requested
    const depthRatio = Math.min(maxFillableAmount / (amount || 1), 10);
    const spreadScore = entries.length >= 5 ? 1 : entries.length / 5;
    const liquidityScore = Math.min(100, Math.round(depthRatio * 10 * spreadScore));

    return {
      exchange,
      symbol: orderBook.symbol,
      side,
      requestedAmount: amount,
      avgFillPrice,
      bestPrice,
      slippagePct,
      totalQuote,
      levelsConsumed,
      fullyFillable,
      maxFillableAmount,
      liquidityScore,
      timestamp: orderBook.timestamp || Date.now(),
    };
  }

  /**
   * Analyze both sides of an arb trade: buy on exchange A, sell on exchange B.
   * Returns combined spread analysis with real slippage from both order books.
   */
  analyzeArbSpread(
    buyOrderBook: IOrderBook,
    sellOrderBook: IOrderBook,
    buyExchange: string,
    sellExchange: string,
    amount: number,
    buyFeePct = 0.001,
    sellFeePct = 0.001,
  ): SpreadDepthAnalysis {
    const buyAnalysis = this.analyzeDepth(buyOrderBook, buyExchange, 'buy', amount);
    const sellAnalysis = this.analyzeDepth(sellOrderBook, sellExchange, 'sell', amount);

    // Net spread: (sell avg price - buy avg price) / buy avg price - fees
    const grossSpreadPct = buyAnalysis.avgFillPrice > 0
      ? (sellAnalysis.avgFillPrice - buyAnalysis.avgFillPrice) / buyAnalysis.avgFillPrice
      : 0;
    const netSpreadPct = grossSpreadPct - buyFeePct - sellFeePct;

    const executable = buyAnalysis.fullyFillable
      && sellAnalysis.fullyFillable
      && buyAnalysis.liquidityScore >= this.config.minLiquidityScore
      && sellAnalysis.liquidityScore >= this.config.minLiquidityScore
      && buyAnalysis.slippagePct <= this.config.maxSlippagePct
      && sellAnalysis.slippagePct <= this.config.maxSlippagePct;

    const estimatedProfitUsd = netSpreadPct > 0
      ? netSpreadPct * buyAnalysis.totalQuote
      : 0;

    return {
      buyAnalysis,
      sellAnalysis,
      netSpreadPct,
      executable,
      estimatedProfitUsd,
      totalSlippagePct: buyAnalysis.slippagePct + sellAnalysis.slippagePct,
    };
  }

  /**
   * Check if trade passes depth requirements (pre-trade validation gate).
   */
  isTradeViable(analysis: SpreadDepthAnalysis, minNetSpreadPct = 0): boolean {
    return analysis.executable && analysis.netSpreadPct > minNetSpreadPct;
  }

  /**
   * Calculate optimal position size based on order book depth.
   * Returns max amount that keeps slippage below threshold.
   */
  calculateOptimalSize(
    orderBook: IOrderBook,
    side: 'buy' | 'sell',
    maxSlippagePct?: number,
  ): number {
    const threshold = maxSlippagePct ?? this.config.maxSlippagePct;
    const entries = side === 'buy'
      ? orderBook.asks.slice(0, this.config.maxDepthLevels)
      : orderBook.bids.slice(0, this.config.maxDepthLevels);

    if (entries.length === 0) return 0;

    const bestPrice = entries[0].price;
    let totalAmount = 0;
    let totalQuote = 0;

    for (const entry of entries) {
      const newTotal = totalAmount + entry.amount;
      const newQuote = totalQuote + entry.amount * entry.price;
      const avgPrice = newQuote / newTotal;
      const slippage = Math.abs(avgPrice - bestPrice) / bestPrice;

      if (slippage > threshold) break;

      totalAmount = newTotal;
      totalQuote = newQuote;
    }

    return totalAmount;
  }

  private emptyAnalysis(exchange: string, symbol: string, side: 'buy' | 'sell', amount: number): DepthAnalysis {
    return {
      exchange, symbol, side, requestedAmount: amount,
      avgFillPrice: 0, bestPrice: 0, slippagePct: 0,
      totalQuote: 0, levelsConsumed: 0, fullyFillable: false,
      maxFillableAmount: 0, liquidityScore: 0, timestamp: Date.now(),
    };
  }
}
