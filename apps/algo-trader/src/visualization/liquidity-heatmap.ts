/**
 * Liquidity Heatmap Visualization
 *
 * Generates heatmap data showing liquidity distribution over time and price levels.
 */

import type { OrderBookSnapshot } from '../analysis/orderbook/types';

/**
 * Heatmap cell data
 */
export interface HeatmapCell {
  /** Timestamp */
  timestamp: number;
  /** Price level */
  price: number;
  /** Bid volume at this level */
  bidVolume: number;
  /** Ask volume at this level */
  askVolume: number;
}

/**
 * Liquidity heatmap data structure
 */
export interface LiquidityHeatmapData {
  /** Token ID */
  tokenId: string;
  /** Array of price levels */
  prices: number[];
  /** Array of timestamps */
  timestamps: number[];
  /** Bid volume matrix [priceIndex][timeIndex] */
  bidData: number[][];
  /** Ask volume matrix [priceIndex][timeIndex] */
  askData: number[][];
}

/**
 * Heatmap configuration
 */
export interface HeatmapConfig {
  /** Number of price levels to track (default: 20) */
  priceLevels?: number;
  /** Time window in ms (default: 60000 = 1 minute) */
  timeWindowMs?: number;
  /** Time resolution in ms (default: 1000 = 1 second) */
  timeResolutionMs?: number;
}

/**
 * Liquidity Heatmap
 *
 * Tracks order book liquidity over time and price levels,
 * generating heatmap data for visualization.
 */
export class LiquidityHeatmap {
  private config: Required<HeatmapConfig>;

  // Snapshot history per token
  private snapshots = new Map<string, Array<{ timestamp: number; snapshot: OrderBookSnapshot }>>();

  constructor(config: HeatmapConfig = {}) {
    this.config = {
      priceLevels: config.priceLevels ?? 20,
      timeWindowMs: config.timeWindowMs ?? 60000,
      timeResolutionMs: config.timeResolutionMs ?? 1000,
    };
  }

  /**
   * Update heatmap with new order book snapshot
   */
  update(snapshot: OrderBookSnapshot): void {
    const tokenSnapshots = this.snapshots.get(snapshot.tokenId) || [];

    tokenSnapshots.push({
      timestamp: snapshot.timestamp,
      snapshot,
    });

    // Trim old snapshots
    const cutoff = Date.now() - this.config.timeWindowMs;
    const trimmed = tokenSnapshots.filter(s => s.timestamp > cutoff);

    this.snapshots.set(snapshot.tokenId, trimmed);
  }

  /**
   * Get heatmap data for time range
   */
  getData(tokenId: string, timeRangeMs?: number): LiquidityHeatmapData {
    const tokenSnapshots = this.snapshots.get(tokenId) || [];
    const now = Date.now();
    const windowMs = timeRangeMs ?? this.config.timeWindowMs;
    const cutoff = now - windowMs;

    // Filter to time range
    const windowSnapshots = tokenSnapshots.filter(s => s.timestamp >= cutoff);

    if (windowSnapshots.length === 0) {
      return {
        tokenId,
        prices: [],
        timestamps: [],
        bidData: [],
        askData: [],
      };
    }

    // Determine price range
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    for (const { snapshot } of windowSnapshots) {
      for (const level of snapshot.bids) {
        minPrice = Math.min(minPrice, level.price);
        maxPrice = Math.max(maxPrice, level.price);
      }
      for (const level of snapshot.asks) {
        minPrice = Math.min(minPrice, level.price);
        maxPrice = Math.max(maxPrice, level.price);
      }
    }

    // Create price bins
    const priceStep = (maxPrice - minPrice) / this.config.priceLevels;
    const prices: number[] = [];
    for (let i = 0; i < this.config.priceLevels; i++) {
      prices.push(minPrice + i * priceStep + priceStep / 2);
    }

    // Create time bins
    const startTime = Math.min(...windowSnapshots.map(s => s.timestamp));
    const timeBins: number[] = [];
    const binCount = Math.ceil(windowMs / this.config.timeResolutionMs);

    for (let i = 0; i < binCount && i < 60; i++) {
      timeBins.push(startTime + i * this.config.timeResolutionMs);
    }

    // Initialize matrices
    const bidData: number[][] = prices.map(() => timeBins.map(() => 0));
    const askData: number[][] = prices.map(() => timeBins.map(() => 0));

    // Fill matrices
    for (const { timestamp, snapshot } of windowSnapshots) {
      const timeIndex = Math.floor((timestamp - startTime) / this.config.timeResolutionMs);
      if (timeIndex < 0 || timeIndex >= timeBins.length) continue;

      // Aggregate bid volumes
      for (const level of snapshot.bids) {
        const priceIndex = this.findPriceIndex(level.price, prices);
        if (priceIndex >= 0 && priceIndex < prices.length) {
          bidData[priceIndex][timeIndex] += level.size;
        }
      }

      // Aggregate ask volumes
      for (const level of snapshot.asks) {
        const priceIndex = this.findPriceIndex(level.price, prices);
        if (priceIndex >= 0 && priceIndex < prices.length) {
          askData[priceIndex][timeIndex] += level.size;
        }
      }
    }

    return {
      tokenId,
      prices,
      timestamps: timeBins,
      bidData,
      askData,
    };
  }

  /**
   * Render ASCII heatmap
   *
   * @param tokenId - Token ID
   * @param width - Width in characters (default: 60)
   * @param height - Height in lines (default: 20)
   */
  renderASCII(tokenId: string, width = 60, height = 20): string {
    const data = this.getData(tokenId);

    if (data.prices.length === 0 || data.timestamps.length === 0) {
      return `No heatmap data for ${tokenId}`;
    }

    const lines: string[] = [];

    // Header
    lines.push(`Liquidity Heatmap: ${tokenId}`);
    lines.push(`Price Range: ${data.prices[0]?.toFixed(3)} - ${data.prices[data.prices.length - 1]?.toFixed(3)}`);
    lines.push(`Time Range: ${data.timestamps.length}s`);
    lines.push('');

    // Find max volume for scaling
    let maxVol = 0;
    for (let i = 0; i < data.bidData.length; i++) {
      for (let j = 0; j < data.bidData[i].length; j++) {
        maxVol = Math.max(maxVol, data.bidData[i][j], data.askData[i][j]);
      }
    }

    // Render heatmap (bids only for simplicity)
    const charSet = ' ░▒▓█';

    for (let i = data.prices.length - 1; i >= 0; i--) {
      const priceStr = data.prices[i].toFixed(3).padStart(8);
      let line = priceStr + ' │';

      for (let j = 0; j < data.timestamps.length && j < width; j++) {
        const vol = data.bidData[i][j];
        const intensity = maxVol > 0 ? Math.floor((vol / maxVol) * (charSet.length - 1)) : 0;
        line += charSet[intensity];
      }

      lines.push(line);
    }

    // Time axis
    lines.push(' '.repeat(8) + ' └' + '─'.repeat(Math.min(width, data.timestamps.length)));
    lines.push(' '.repeat(8) + '  ' + 'Time →');

    return lines.join('\n');
  }

  /**
   * Clear heatmap data
   */
  clear(tokenId?: string): void {
    if (tokenId) {
      this.snapshots.delete(tokenId);
    } else {
      this.snapshots.clear();
    }
  }

  /**
   * Find price index for a given price
   */
  private findPriceIndex(price: number, prices: number[]): number {
    let closest = 0;
    let minDiff = Infinity;

    for (let i = 0; i < prices.length; i++) {
      const diff = Math.abs(price - prices[i]);
      if (diff < minDiff) {
        minDiff = diff;
        closest = i;
      }
    }

    return closest;
  }
}
