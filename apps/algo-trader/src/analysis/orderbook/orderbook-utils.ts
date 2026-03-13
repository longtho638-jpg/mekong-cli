/**
 * Order Book Utilities
 *
 * Helper functions for order book calculations and normalization.
 */

import type {
  RawOrderBookLevel,
  OrderBookLevel,
  RawOrderBook,
  OrderBookSnapshot,
  ProcessedOrderBook,
} from './types';

/**
 * Parse price string to number with proper decimal handling
 */
export function parsePrice(priceStr: string): number {
  const price = parseFloat(priceStr);
  if (isNaN(price)) {
    throw new Error(`Invalid price format: ${priceStr}`);
  }
  return price;
}

/**
 * Parse size string to number with proper decimal handling
 */
export function parseSize(sizeStr: string): number {
  const size = parseFloat(sizeStr);
  if (isNaN(size)) {
    throw new Error(`Invalid size format: ${sizeStr}`);
  }
  return size;
}

/**
 * Calculate mid price from best bid and ask
 */
export function calculateMidPrice(bestBid: number, bestAsk: number): number {
  return (bestBid + bestAsk) / 2;
}

/**
 * Calculate spread between best bid and ask
 */
export function calculateSpread(bestBid: number, bestAsk: number): number {
  return bestAsk - bestBid;
}

/**
 * Convert spread to basis points
 */
export function calculateSpreadBps(midPrice: number, spread: number): number {
  if (midPrice <= 0) return 0;
  return (spread / midPrice) * 10000;
}

/**
 * Normalize raw order book levels to processed format with cumulative sizes
 */
export function normalizeDepth(
  levels: RawOrderBookLevel[],
  side: 'BUY' | 'SELL',
  maxDepth?: number
): OrderBookLevel[] {
  const depth = maxDepth || levels.length;
  const normalized: OrderBookLevel[] = [];
  let cumulative = 0;

  // Sort levels based on side
  const sorted = [...levels].sort((a, b) => {
    const priceA = parsePrice(a.price);
    const priceB = parsePrice(b.price);

    if (side === 'BUY') {
      // Bids: highest price first
      return priceB - priceA;
    } else {
      // Asks: lowest price first
      return priceA - priceB;
    }
  });

  for (let i = 0; i < Math.min(depth, sorted.length); i++) {
    const level = sorted[i];
    const size = parseSize(level.size);
    cumulative += size;

    normalized.push({
      price: parsePrice(level.price),
      size,
      cumulativeSize: cumulative,
    });
  }

  return normalized;
}

/**
 * Calculate volume-weighted average price (VWAP) for order book levels
 */
export function calculateVWAP(levels: OrderBookLevel[]): number {
  if (levels.length === 0) return 0;

  let totalValue = 0;
  let totalVolume = 0;

  for (const level of levels) {
    totalValue += level.price * level.size;
    totalVolume += level.size;
  }

  if (totalVolume === 0) return 0;
  return totalValue / totalVolume;
}

/**
 * Calculate order book imbalance
 *
 * Formula: (bidVolume - askVolume) / (bidVolume + askVolume)
 * Returns: -1 (all ask) to +1 (all bid)
 */
export function calculateImbalance(
  bidLevels: OrderBookLevel[],
  askLevels: OrderBookLevel[],
  depth?: number
): number {
  const d = depth || Math.max(bidLevels.length, askLevels.length);

  let bidVolume = 0;
  let askVolume = 0;

  for (let i = 0; i < d; i++) {
    if (i < bidLevels.length) {
      bidVolume += bidLevels[i].size;
    }
    if (i < askLevels.length) {
      askVolume += askLevels[i].size;
    }
  }

  const total = bidVolume + askVolume;
  if (total === 0) return 0;

  return (bidVolume - askVolume) / total;
}

/**
 * Find large liquidity walls in order book
 */
export function findLargeWalls(
  levels: OrderBookLevel[],
  threshold: number,
  side: 'BUY' | 'SELL'
): Array<{ price: number; size: number; significance: number }> {
  const walls: Array<{ price: number; size: number; significance: number }> = [];

  // Find max size for significance calculation
  const maxSize = Math.max(...levels.map(l => l.size), threshold);

  for (const level of levels) {
    if (level.size >= threshold) {
      walls.push({
        price: level.price,
        size: level.size,
        significance: level.size / maxSize,
      });
    }
  }

  return walls;
}

/**
 * Find liquidity concentration zones (clusters of orders)
 */
export function findLiquidityZones(
  levels: OrderBookLevel[],
  minSize: number,
  priceBand: number = 0.02 // 2% price band
): Array<{ price: number; totalSize: number; orderCount: number }> {
  if (levels.length === 0) return [];

  const zones: Array<{ price: number; totalSize: number; orderCount: number }> = [];
  let currentZone: { price: number; totalSize: number; orderCount: number } | null = null;

  for (const level of levels) {
    if (level.size < minSize) continue;

    if (!currentZone) {
      currentZone = {
        price: level.price,
        totalSize: level.size,
        orderCount: 1,
      };
    } else {
      const priceDiff = Math.abs(level.price - currentZone.price) / currentZone.price;

      if (priceDiff <= priceBand) {
        // Add to current zone
        currentZone.totalSize += level.size;
        currentZone.orderCount += 1;
      } else {
        // Save current zone if significant
        if (currentZone.totalSize >= minSize) {
          zones.push(currentZone);
        }
        // Start new zone
        currentZone = {
          price: level.price,
          totalSize: level.size,
          orderCount: 1,
        };
      }
    }
  }

  // Don't forget last zone
  if (currentZone && currentZone.totalSize >= minSize) {
    zones.push(currentZone);
  }

  return zones;
}

/**
 * Validate order book snapshot
 */
export function validateSnapshot(snapshot: OrderBookSnapshot): boolean {
  // Check bids are sorted desc
  for (let i = 1; i < snapshot.bids.length; i++) {
    if (snapshot.bids[i].price > snapshot.bids[i - 1].price) {
      return false;
    }
  }

  // Check asks are sorted asc
  for (let i = 1; i < snapshot.asks.length; i++) {
    if (snapshot.asks[i].price < snapshot.asks[i - 1].price) {
      return false;
    }
  }

  // Check spread is positive
  if (snapshot.spread < 0) {
    return false;
  }

  // Check mid price is within bounds
  if (snapshot.midPrice <= 0 || snapshot.midPrice > 1) {
    return false;
  }

  return true;
}

/**
 * Convert raw order book to snapshot
 */
export function rawToSnapshot(
  rawBook: RawOrderBook,
  tokenId: string,
  marketId: string,
  timestamp?: number
): OrderBookSnapshot {
  const bids = normalizeDepth(rawBook.bids, 'BUY');
  const asks = normalizeDepth(rawBook.asks, 'SELL');

  const bestBid = bids.length > 0 ? bids[0].price : 0;
  const bestAsk = asks.length > 0 ? asks[0].price : 0;

  const midPrice = calculateMidPrice(bestBid, bestAsk);
  const spread = calculateSpread(bestBid, bestAsk);
  const spreadBps = calculateSpreadBps(midPrice, spread);

  return {
    tokenId,
    marketId,
    timestamp: timestamp || Date.now(),
    bids,
    asks,
    midPrice,
    spread,
    spreadBps,
  };
}

/**
 * Convert processed order book (number format) to snapshot
 */
export function processedToSnapshot(
  processedBook: ProcessedOrderBook,
  tokenId: string,
  marketId: string,
  timestamp?: number
): OrderBookSnapshot {
  // Convert to raw format first, then normalize
  const bids: OrderBookLevel[] = [];
  const asks: OrderBookLevel[] = [];

  // Sort and process bids (highest price first)
  const sortedBids = [...processedBook.bids].sort((a, b) => b.price - a.price);
  let cumul = 0;
  for (const bid of sortedBids) {
    cumul += bid.size;
    bids.push({
      price: bid.price,
      size: bid.size,
      cumulativeSize: cumul,
    });
  }

  // Sort and process asks (lowest price first)
  const sortedAsks = [...processedBook.asks].sort((a, b) => a.price - b.price);
  cumul = 0;
  for (const ask of sortedAsks) {
    cumul += ask.size;
    asks.push({
      price: ask.price,
      size: ask.size,
      cumulativeSize: cumul,
    });
  }

  const bestBid = bids.length > 0 ? bids[0].price : 0;
  const bestAsk = asks.length > 0 ? asks[0].price : 0;

  const midPrice = calculateMidPrice(bestBid, bestAsk);
  const spread = calculateSpread(bestBid, bestAsk);
  const spreadBps = calculateSpreadBps(midPrice, spread);

  return {
    tokenId,
    marketId,
    timestamp: timestamp || Date.now(),
    bids,
    asks,
    midPrice,
    spread,
    spreadBps,
  };
}
