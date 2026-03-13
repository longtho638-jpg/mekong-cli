/**
 * Order Book Analyzer
 *
 * Core module for computing order book metrics including depth analysis,
 * slippage estimation, imbalance calculation, and liquidity zones.
 */

import {
  OrderBookAnalyzerConfig,
  OrderBookSnapshot,
  OrderBookMetrics,
  OrderBookLevel,
  LiquidityZone,
  SlippageEstimate,
  RawOrderBook,
  ProcessedOrderBook,
} from './types';
import {
  normalizeDepth,
  calculateVWAP,
  calculateImbalance,
  findLargeWalls,
  findLiquidityZones as findZones,
  rawToSnapshot,
  processedToSnapshot,
  validateSnapshot,
} from './orderbook-utils';

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<OrderBookAnalyzerConfig> = {
  depthLevels: 10,
  wallThreshold: 100,
  minZoneSize: 50,
};

/**
 * Order Book Analyzer
 *
 * Provides comprehensive order book analysis for Polymarket:
 * - Depth visualization data
 * - Slippage estimation for market orders
 * - Order book imbalance metrics
 * - Liquidity concentration zones
 */
export class OrderBookAnalyzer {
  private config: Required<OrderBookAnalyzerConfig>;

  constructor(config: OrderBookAnalyzerConfig = {}) {
    this.config = {
      depthLevels: config.depthLevels ?? DEFAULT_CONFIG.depthLevels,
      wallThreshold: config.wallThreshold ?? DEFAULT_CONFIG.wallThreshold,
      minZoneSize: config.minZoneSize ?? DEFAULT_CONFIG.minZoneSize,
    };
  }

  /**
   * Process raw order book from API into normalized snapshot
   */
  processSnapshot(
    rawBook: RawOrderBook | ProcessedOrderBook,
    tokenId: string,
    marketId: string,
    timestamp?: number
  ): OrderBookSnapshot {
    // Check if it's processed (number) or raw (string) format
    const isProcessed = rawBook.bids.length > 0 && typeof rawBook.bids[0] === 'object' && 'price' in rawBook.bids[0] && typeof rawBook.bids[0].price === 'number';

    const snapshot = isProcessed
      ? processedToSnapshot(rawBook as ProcessedOrderBook, tokenId, marketId, timestamp)
      : rawToSnapshot(rawBook as RawOrderBook, tokenId, marketId, timestamp);

    if (!validateSnapshot(snapshot)) {
      throw new Error('Invalid order book snapshot');
    }

    return snapshot;
  }

  /**
   * Compute comprehensive metrics from order book snapshot
   */
  computeMetrics(snapshot: OrderBookSnapshot): OrderBookMetrics {
    const depth = this.config.depthLevels;

    // Calculate imbalances at different depths
    const imbalance = calculateImbalance(snapshot.bids, snapshot.asks);
    const imbalance3 = calculateImbalance(snapshot.bids, snapshot.asks, 3);
    const imbalance5 = calculateImbalance(snapshot.bids, snapshot.asks, 5);
    const imbalance10 = calculateImbalance(snapshot.bids, snapshot.asks, 10);

    // Calculate VWAP for bids and asks
    const bidVWAP = calculateVWAP(snapshot.bids.slice(0, depth));
    const askVWAP = calculateVWAP(snapshot.asks.slice(0, depth));

    // Calculate total volumes
    const totalBidVolume = snapshot.bids.slice(0, depth).reduce((sum, l) => sum + l.size, 0);
    const totalAskVolume = snapshot.asks.slice(0, depth).reduce((sum, l) => sum + l.size, 0);

    // Find liquidity zones
    const bidZones = findZones(snapshot.bids, this.config.minZoneSize);
    const askZones = findZones(snapshot.asks, this.config.minZoneSize);

    // Convert to LiquidityZone format
    const concentrationZones: LiquidityZone[] = [
      ...bidZones.map(z => ({
        price: z.price,
        totalSize: z.totalSize,
        side: 'BUY' as const,
        significance: Math.min(1, z.totalSize / this.config.wallThreshold),
        orderCount: z.orderCount,
      })),
      ...askZones.map(z => ({
        price: z.price,
        totalSize: z.totalSize,
        side: 'SELL' as const,
        significance: Math.min(1, z.totalSize / this.config.wallThreshold),
        orderCount: z.orderCount,
      })),
    ];

    // Sort zones by significance
    concentrationZones.sort((a, b) => b.significance - a.significance);

    // Calculate liquidity score (0-100)
    const liquidityScore = this.calculateLiquidityScore(snapshot);

    return {
      snapshot,
      imbalance,
      imbalance3,
      imbalance5,
      imbalance10,
      bidVWAP,
      askVWAP,
      liquidityScore,
      concentrationZones,
      totalBidVolume,
      totalAskVolume,
    };
  }

  /**
   * Estimate slippage for a market order
   *
   * Simulates executing a market order through the order book
   * and calculates the average execution price vs mid price.
   */
  estimateSlippage(
    snapshot: OrderBookSnapshot,
    size: number,
    side: 'BUY' | 'SELL'
  ): SlippageEstimate {
    const levels = side === 'BUY' ? snapshot.asks : snapshot.bids;
    let remainingSize = size;
    let totalCost = 0;
    let filledSize = 0;

    // Walk through order book levels
    for (const level of levels) {
      if (remainingSize <= 0) break;

      const fillSize = Math.min(remainingSize, level.size);
      totalCost += fillSize * level.price;
      filledSize += fillSize;
      remainingSize -= fillSize;
    }

    // Calculate metrics
    const fillable = remainingSize <= 0;
    const maxFillableSize = filledSize;
    const avgExecutionPrice = filledSize > 0 ? totalCost / filledSize : 0;
    const totalValue = totalCost;

    // Calculate slippage vs mid price
    const slippageBps = snapshot.midPrice > 0 && avgExecutionPrice > 0
      ? ((avgExecutionPrice - snapshot.midPrice) / snapshot.midPrice) * 10000 * (side === 'BUY' ? 1 : -1)
      : 0;

    return {
      side,
      requestedSize: size,
      avgExecutionPrice,
      midPrice: snapshot.midPrice,
      slippageBps: Math.abs(slippageBps),
      totalValue,
      fillable,
      maxFillableSize,
    };
  }

  /**
   * Calculate order book imbalance
   *
   * @param snapshot - Order book snapshot
   * @param depth - Number of levels to include (default: config depth)
   */
  calculateImbalance(snapshot: OrderBookSnapshot, depth?: number): number {
    const d = depth ?? this.config.depthLevels;
    return calculateImbalance(snapshot.bids.slice(0, d), snapshot.asks.slice(0, d));
  }

  /**
   * Calculate volume-weighted average price
   *
   * @param snapshot - Order book snapshot
   * @param side - Which side to calculate VWAP for
   */
  calculateVWAP(snapshot: OrderBookSnapshot, side: 'BUY' | 'SELL'): number {
    const levels = side === 'BUY' ? snapshot.bids : snapshot.asks;
    return calculateVWAP(levels.slice(0, this.config.depthLevels));
  }

  /**
   * Find large liquidity walls
   *
   * @param snapshot - Order book snapshot
   * @param threshold - Minimum size to consider a wall
   */
  findLiquidityWalls(snapshot: OrderBookSnapshot, threshold?: number): LiquidityZone[] {
    const t = threshold ?? this.config.wallThreshold;

    const bidWalls = findLargeWalls(snapshot.bids, t, 'BUY');
    const askWalls = findLargeWalls(snapshot.asks, t, 'SELL');

    return [
      ...bidWalls.map(w => ({
        price: w.price,
        totalSize: w.size,
        side: 'BUY' as const,
        significance: w.significance,
        orderCount: 1,
      })),
      ...askWalls.map(w => ({
        price: w.price,
        totalSize: w.size,
        side: 'SELL' as const,
        significance: w.significance,
        orderCount: 1,
      })),
    ];
  }

  /**
   * Find liquidity concentration zones
   *
   * Identifies price zones where multiple orders cluster together.
   *
   * @param snapshot - Order book snapshot
   * @param priceBand - Price band for clustering (default: 2%)
   */
  findLiquidityZones(snapshot: OrderBookSnapshot, priceBand?: number): LiquidityZone[] {
    const pb = priceBand ?? 0.02;

    const bidZones = findZones(snapshot.bids, this.config.minZoneSize, pb);
    const askZones = findZones(snapshot.asks, this.config.minZoneSize, pb);

    return [
      ...bidZones.map(z => ({
        price: z.price,
        totalSize: z.totalSize,
        side: 'BUY' as const,
        significance: Math.min(1, z.totalSize / this.config.wallThreshold),
        orderCount: z.orderCount,
      })),
      ...askZones.map(z => ({
        price: z.price,
        totalSize: z.totalSize,
        side: 'SELL' as const,
        significance: Math.min(1, z.totalSize / this.config.wallThreshold),
        orderCount: z.orderCount,
      })),
    ].sort((a, b) => b.significance - a.significance);
  }

  /**
   * Get depth data for visualization
   *
   * Returns cumulative volume at each price level for charting.
   */
  getDepthData(snapshot: OrderBookSnapshot): {
    bids: Array<{ price: number; cumulative: number }>;
    asks: Array<{ price: number; cumulative: number }>;
  } {
    return {
      bids: snapshot.bids.map(l => ({
        price: l.price,
        cumulative: l.cumulativeSize,
      })),
      asks: snapshot.asks.map(l => ({
        price: l.price,
        cumulative: l.cumulativeSize,
      })),
    };
  }

  /**
   * Calculate liquidity score (0-100)
   *
   * Score based on:
   * - Total volume in top N levels
   * - Tightness of spread
   * - Balance between bid/ask sides
   */
  private calculateLiquidityScore(snapshot: OrderBookSnapshot): number {
    const depth = this.config.depthLevels;

    // Volume score (0-40): Based on total volume
    const totalVolume =
      snapshot.bids.slice(0, depth).reduce((s, l) => s + l.size, 0) +
      snapshot.asks.slice(0, depth).reduce((s, l) => s + l.size, 0);
    const volumeScore = Math.min(40, totalVolume / 10); // Max 40 at 400 volume

    // Spread score (0-30): Tighter spread = higher score
    // Perfect spread = 0.01 (1 cent), score decreases as spread widens
    const spreadScore = Math.max(0, 30 - (snapshot.spreadBps / 10));

    // Balance score (0-30): Balanced book = higher score
    const bidVol = snapshot.bids.slice(0, depth).reduce((s, l) => s + l.size, 0);
    const askVol = snapshot.asks.slice(0, depth).reduce((s, l) => s + l.size, 0);
    const total = bidVol + askVol;
    const balanceRatio = total > 0 ? Math.min(bidVol, askVol) / total : 0;
    const balanceScore = balanceRatio * 30; // Max 30 when perfectly balanced

    return Math.min(100, Math.round(volumeScore + spreadScore + balanceScore));
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<OrderBookAnalyzerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<OrderBookAnalyzerConfig> {
    return { ...this.config };
  }
}
