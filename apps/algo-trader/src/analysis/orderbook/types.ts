/**
 * Order Book Analysis Types
 *
 * Type definitions for order book metrics, slippage estimation, and liquidity analysis.
 */

/**
 * Raw order book level from exchange API
 */
export interface RawOrderBookLevel {
  price: string;
  size: string;
}

/**
 * Normalized order book level with cumulative volume
 */
export interface OrderBookLevel {
  /** Price level */
  price: number;
  /** Volume at this level */
  size: number;
  /** Cumulative volume from top to this level */
  cumulativeSize: number;
}

/**
 * Snapshot of order book at a point in time
 */
export interface OrderBookSnapshot {
  /** Token ID (outcome token) */
  tokenId: string;
  /** Market/condition ID */
  marketId: string;
  /** Snapshot timestamp */
  timestamp: number;
  /** Bid levels (sorted by price desc) */
  bids: OrderBookLevel[];
  /** Ask levels (sorted by price asc) */
  asks: OrderBookLevel[];
  /** Mid price = (best bid + best ask) / 2 */
  midPrice: number;
  /** Spread = best ask - best bid */
  spread: number;
  /** Spread in basis points */
  spreadBps: number;
}

/**
 * Liquidity concentration zone
 */
export interface LiquidityZone {
  /** Price level */
  price: number;
  /** Total size in zone */
  totalSize: number;
  /** BUY (bid) or SELL (ask) side */
  side: 'BUY' | 'SELL';
  /** Significance score 0-1 (1 = very significant) */
  significance: number;
  /** Number of orders in zone */
  orderCount: number;
}

/**
 * Order book metrics computed from snapshot
 */
export interface OrderBookMetrics {
  /** Raw snapshot */
  snapshot: OrderBookSnapshot;
  /** Order book imbalance -1 to 1 */
  imbalance: number;
  /** Imbalance using top 3 levels */
  imbalance3: number;
  /** Imbalance using top 5 levels */
  imbalance5: number;
  /** Imbalance using top 10 levels */
  imbalance10: number;
  /** Bid volume-weighted average price */
  bidVWAP: number;
  /** Ask volume-weighted average price */
  askVWAP: number;
  /** Liquidity score 0-100 */
  liquidityScore: number;
  /** Detected liquidity concentration zones */
  concentrationZones: LiquidityZone[];
  /** Total bid volume (top 10 levels) */
  totalBidVolume: number;
  /** Total ask volume (top 10 levels) */
  totalAskVolume: number;
}

/**
 * Slippage estimation for market order
 */
export interface SlippageEstimate {
  /** BUY or SELL */
  side: 'BUY' | 'SELL';
  /** Requested order size */
  requestedSize: number;
  /** Average execution price */
  avgExecutionPrice: number;
  /** Mid price at time of estimation */
  midPrice: number;
  /** Slippage in basis points */
  slippageBps: number;
  /** Total cost/revenue */
  totalValue: number;
  /** Whether order can be fully filled */
  fillable: boolean;
  /** Maximum fillable size */
  maxFillableSize: number;
}

/**
 * Configuration for OrderBookAnalyzer
 */
export interface OrderBookAnalyzerConfig {
  /** Number of depth levels to analyze (default: 10) */
  depthLevels?: number;
  /** Threshold for detecting large walls (default: 100) */
  wallThreshold?: number;
  /** Minimum size for liquidity zone (default: 50) */
  minZoneSize?: number;
}

/**
 * Raw order book from Polymarket API (string format)
 */
export interface RawOrderBook {
  bids: RawOrderBookLevel[];
  asks: RawOrderBookLevel[];
}

/**
 * Processed order book (number format) - from PolymarketAdapter
 */
export interface ProcessedOrderBook {
  bids: Array<{ price: number; size: number }>;
  asks: Array<{ price: number; size: number }>;
}
