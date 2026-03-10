/**
 * Feature Extractor — converts orderbook deltas to feature vectors.
 * Computes: volume imbalance, book slope, micro-price, trade flow.
 */

export interface OrderbookLevel {
  price: number;
  size: number;
}

export interface OrderbookSnapshot {
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  timestamp: number;
}

export interface TradeEvent {
  price: number;
  size: number;
  side: 'buy' | 'sell';
  timestamp: number;
}

export interface FeatureVector {
  volumeImbalance: number;   // [-1, 1]: positive = more bid volume
  bookSlope: number;         // steepness of bid/ask depth curve
  microPrice: number;        // size-weighted mid price
  tradeFlow: number;         // [-1, 1]: net buy-side flow over window
  spread: number;            // absolute spread
  midPrice: number;          // simple mid price
  timestamp: number;
}

const TOP_LEVELS = 10;

/**
 * Compute volume imbalance from top-N bid/ask levels.
 * Returns value in [-1, 1].
 */
export function computeVolumeImbalance(
  bids: OrderbookLevel[],
  asks: OrderbookLevel[],
): number {
  const bidVol = bids.slice(0, TOP_LEVELS).reduce((s, l) => s + l.size, 0);
  const askVol = asks.slice(0, TOP_LEVELS).reduce((s, l) => s + l.size, 0);
  const total = bidVol + askVol;
  if (total === 0) return 0;
  return (bidVol - askVol) / total;
}

/**
 * Compute book slope: gradient of cumulative volume vs price distance from mid.
 * Higher slope = thick book (liquid). Returns positive value.
 */
export function computeBookSlope(
  bids: OrderbookLevel[],
  asks: OrderbookLevel[],
  midPrice: number,
): number {
  if (midPrice === 0) return 0;
  let sumBid = 0;
  let sumAsk = 0;
  const levels = Math.min(TOP_LEVELS, bids.length, asks.length);
  for (let i = 0; i < levels; i++) {
    const bidDist = Math.abs(midPrice - bids[i].price) + 1e-9;
    const askDist = Math.abs(asks[i].price - midPrice) + 1e-9;
    sumBid += bids[i].size / bidDist;
    sumAsk += asks[i].size / askDist;
  }
  return (sumBid + sumAsk) / (2 * levels);
}

/**
 * Compute micro-price: bid/ask weighted by opposite side's top-level size.
 */
export function computeMicroPrice(bids: OrderbookLevel[], asks: OrderbookLevel[]): number {
  if (bids.length === 0 || asks.length === 0) return 0;
  const bestBid = bids[0];
  const bestAsk = asks[0];
  const totalSize = bestBid.size + bestAsk.size;
  if (totalSize === 0) return (bestBid.price + bestAsk.price) / 2;
  // Weight bid price by ask size and vice-versa
  return (bestBid.price * bestAsk.size + bestAsk.price * bestBid.size) / totalSize;
}

/**
 * Compute trade flow imbalance from recent trades. Returns [-1, 1].
 */
export function computeTradeFlow(trades: TradeEvent[]): number {
  if (trades.length === 0) return 0;
  const buyVol = trades
    .filter((t) => t.side === 'buy')
    .reduce((s, t) => s + t.size, 0);
  const sellVol = trades
    .filter((t) => t.side === 'sell')
    .reduce((s, t) => s + t.size, 0);
  const total = buyVol + sellVol;
  if (total === 0) return 0;
  return (buyVol - sellVol) / total;
}

/**
 * Extract full feature vector from an orderbook snapshot and recent trades.
 */
export function extractFeatures(
  snapshot: OrderbookSnapshot,
  recentTrades: TradeEvent[],
): FeatureVector {
  const { bids, asks, timestamp } = snapshot;
  if (bids.length === 0 || asks.length === 0) {
    return {
      volumeImbalance: 0,
      bookSlope: 0,
      microPrice: 0,
      tradeFlow: 0,
      spread: 0,
      midPrice: 0,
      timestamp,
    };
  }

  const midPrice = (bids[0].price + asks[0].price) / 2;
  const spread = asks[0].price - bids[0].price;

  return {
    volumeImbalance: computeVolumeImbalance(bids, asks),
    bookSlope: computeBookSlope(bids, asks, midPrice),
    microPrice: computeMicroPrice(bids, asks),
    tradeFlow: computeTradeFlow(recentTrades),
    spread,
    midPrice,
    timestamp,
  };
}
