/**
 * Order Flow Analyzer
 *
 * Analyzes order book dynamics and trade flow to generate momentum signals.
 * Tracks order additions, cancellations, and modifications to detect market pressure.
 */

import type { OrderBookSnapshot, OrderBookLevel } from './types';

/**
 * Trade event from Polymarket
 */
export interface TradeEvent {
  asset_id: string;
  price: string;
  size: string;
  side: 'BUY' | 'SELL';
  timestamp: number;
  trade_id: string;
}

/**
 * Trade flow metrics over a time window
 */
export interface TradeFlow {
  /** Token ID */
  tokenId: string;
  /** Window duration in ms */
  windowMs: number;
  /** Total buy volume */
  buyVolume: number;
  /** Total sell volume */
  sellVolume: number;
  /** Number of buy trades */
  buyCount: number;
  /** Number of sell trades */
  sellCount: number;
  /** Buy volume ratio (0-1) */
  ratio: number;
  /** Net flow (buy - sell) */
  netFlow: number;
  /** Start timestamp of window */
  windowStart: number;
  /** End timestamp of window */
  windowEnd: number;
}

/**
 * Order book dynamics metrics
 */
export interface OrderBookDynamics {
  /** Token ID */
  tokenId: string;
  /** Window duration in ms */
  windowMs: number;
  /** Order additions per second */
  addsPerSecond: number;
  /** Order cancellations per second */
  cancelsPerSecond: number;
  /** Order modifications per second */
  modifiesPerSecond: number;
  /** Net liquidity change */
  netLiquidityChange: number;
  /** Turnover rate (cancelled / added) */
  turnoverRate: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * Momentum signal from order flow analysis
 */
export interface MomentumSignal {
  /** Token ID */
  tokenId: string;
  /** Signal timestamp */
  timestamp: number;
  /** Momentum score -1 to +1 */
  momentum: number;
  /** Signal confidence 0-1 */
  confidence: number;
  /** Book pressure index -1 to +1 */
  bookPressure: number;
  /** Flow imbalance 5s window */
  flowImbalance5s: number;
  /** Flow imbalance 30s window */
  flowImbalance30s: number;
  /** Flow imbalance 1m window */
  flowImbalance1m: number;
}

/**
 * Configuration for OrderFlowAnalyzer
 */
export interface OrderFlowConfig {
  /** Window size for dynamics calculation (default: 5000ms) */
  windowMs?: number;
  /** Number of windows to keep in memory (default: 60) */
  maxWindows?: number;
}

interface BookUpdateEvent {
  timestamp: number;
  type: 'add' | 'cancel' | 'modify';
  side: 'BUY' | 'SELL';
  price: number;
  size: number;
}

interface StoredTrade {
  timestamp: number;
  side: 'BUY' | 'SELL';
  size: number;
}

/**
 * Order Flow Analyzer
 *
 * Tracks order book changes and trade flow to generate momentum signals.
 */
export class OrderFlowAnalyzer {
  private config: Required<OrderFlowConfig>;

  // Recent book update events per token
  private bookUpdates = new Map<string, BookUpdateEvent[]>();

  // Recent trades per token
  private trades = new Map<string, StoredTrade[]>();

  // Last snapshot per token (for comparison)
  private lastSnapshots = new Map<string, OrderBookSnapshot>();

  constructor(config: OrderFlowConfig = {}) {
    this.config = {
      windowMs: config.windowMs ?? 5000,
      maxWindows: config.maxWindows ?? 60,
    };
  }

  /**
   * Process a trade event
   */
  processTrade(trade: TradeEvent): void {
    const tokenTrades = this.trades.get(trade.asset_id) || [];

    tokenTrades.push({
      timestamp: trade.timestamp,
      side: trade.side,
      size: parseFloat(trade.size),
    });

    // Trim old trades (keep last 60 seconds)
    const cutoff = Date.now() - 60000;
    const trimmed = tokenTrades.filter(t => t.timestamp > cutoff);

    this.trades.set(trade.asset_id, trimmed);
  }

  /**
   * Process order book update (compares before/after snapshots)
   */
  processOrderBookUpdate(before: OrderBookSnapshot, after: OrderBookSnapshot): void {
    const updates: BookUpdateEvent[] = [];
    const now = Date.now();

    // Detect bid changes
    this.detectChanges(before.bids, after.bids, 'BUY', now).forEach(u => updates.push(u));

    // Detect ask changes
    this.detectChanges(before.asks, after.asks, 'SELL', now).forEach(u => updates.push(u));

    // Store updates
    const tokenUpdates = this.bookUpdates.get(after.tokenId) || [];
    tokenUpdates.push(...updates);

    // Trim old updates (keep last 60 seconds)
    const cutoff = now - 60000;
    const trimmed = tokenUpdates.filter(u => u.timestamp > cutoff);

    this.bookUpdates.set(after.tokenId, trimmed);
    this.lastSnapshots.set(after.tokenId, after);
  }

  /**
   * Get trade flow for a time window
   */
  getTradeFlow(tokenId: string, windowMs: number): TradeFlow {
    const tokenTrades = this.trades.get(tokenId) || [];
    const now = Date.now();
    const windowStart = now - windowMs;

    const windowTrades = tokenTrades.filter(t => t.timestamp >= windowStart);

    let buyVolume = 0;
    let sellVolume = 0;
    let buyCount = 0;
    let sellCount = 0;

    for (const trade of windowTrades) {
      if (trade.side === 'BUY') {
        buyVolume += trade.size;
        buyCount++;
      } else {
        sellVolume += trade.size;
        sellCount++;
      }
    }

    const totalVolume = buyVolume + sellVolume;

    return {
      tokenId,
      windowMs,
      buyVolume,
      sellVolume,
      buyCount,
      sellCount,
      ratio: totalVolume > 0 ? buyVolume / totalVolume : 0.5,
      netFlow: buyVolume - sellVolume,
      windowStart,
      windowEnd: now,
    };
  }

  /**
   * Get order book dynamics
   */
  getOrderBookDynamics(tokenId: string, windowMs?: number): OrderBookDynamics {
    const w = windowMs ?? this.config.windowMs;
    const tokenUpdates = this.bookUpdates.get(tokenId) || [];
    const now = Date.now();
    const windowStart = now - w;

    const windowUpdates = tokenUpdates.filter(u => u.timestamp >= windowStart);

    let adds = 0;
    let cancels = 0;
    let modifies = 0;
    let bidLiquidityChange = 0;
    let askLiquidityChange = 0;

    for (const update of windowUpdates) {
      switch (update.type) {
        case 'add':
          adds++;
          if (update.side === 'BUY') bidLiquidityChange += update.size;
          else askLiquidityChange += update.size;
          break;
        case 'cancel':
          cancels++;
          if (update.side === 'BUY') bidLiquidityChange -= update.size;
          else askLiquidityChange -= update.size;
          break;
        case 'modify':
          modifies++;
          break;
      }
    }

    const windowSeconds = w / 1000;
    const addsPerSecond = adds / windowSeconds;
    const cancelsPerSecond = cancels / windowSeconds;
    const modifiesPerSecond = modifies / windowSeconds;
    const netLiquidityChange = bidLiquidityChange + askLiquidityChange;
    const turnoverRate = adds > 0 ? cancels / adds : 0;

    return {
      tokenId,
      windowMs: w,
      addsPerSecond,
      cancelsPerSecond,
      modifiesPerSecond,
      netLiquidityChange,
      turnoverRate,
      timestamp: now,
    };
  }

  /**
   * Get momentum signal
   *
   * Combines trade flow and order book dynamics into a single momentum score.
   */
  getMomentumSignal(tokenId: string): MomentumSignal {
    // Get flow imbalances at different time scales
    const flow5s = this.getTradeFlow(tokenId, 5000);
    const flow30s = this.getTradeFlow(tokenId, 30000);
    const flow1m = this.getTradeFlow(tokenId, 60000);

    // Get order book dynamics
    const dynamics = this.getOrderBookDynamics(tokenId);

    // Calculate flow imbalance components
    const imbalance5s = (flow5s.ratio - 0.5) * 2; // -1 to 1
    const imbalance30s = (flow30s.ratio - 0.5) * 2;
    const imbalance1m = (flow1m.ratio - 0.5) * 2;

    // Calculate book pressure from order book dynamics
    const bookPressure = this.calculateBookPressure(tokenId);

    // Calculate momentum (weighted average of components)
    const momentum =
      imbalance5s * 0.3 +
      imbalance30s * 0.2 +
      imbalance1m * 0.1 +
      bookPressure * 0.4;

    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(flow5s, dynamics);

    return {
      tokenId,
      timestamp: Date.now(),
      momentum: Math.max(-1, Math.min(1, momentum)),
      confidence,
      bookPressure,
      flowImbalance5s: imbalance5s,
      flowImbalance30s: imbalance30s,
      flowImbalance1m: imbalance1m,
    };
  }

  /**
   * Simulate order book update (for when only current snapshot is available)
   *
   * Creates synthetic update events by comparing with last stored snapshot.
   */
  simulateUpdate(snapshot: OrderBookSnapshot): void {
    const lastSnapshot = this.lastSnapshots.get(snapshot.tokenId);

    if (!lastSnapshot) {
      // First snapshot, just store it
      this.lastSnapshots.set(snapshot.tokenId, snapshot);
      return;
    }

    // Process as normal update
    this.processOrderBookUpdate(lastSnapshot, snapshot);
  }

  /**
   * Clear all stored data for a token
   */
  clear(tokenId: string): void {
    this.bookUpdates.delete(tokenId);
    this.trades.delete(tokenId);
    this.lastSnapshots.delete(tokenId);
  }

  /**
   * Clear all stored data
   */
  clearAll(): void {
    this.bookUpdates.clear();
    this.trades.clear();
    this.lastSnapshots.clear();
  }

  /**
   * Detect changes between two order book sides
   */
  private detectChanges(
    before: OrderBookLevel[],
    after: OrderBookLevel[],
    side: 'BUY' | 'SELL',
    timestamp: number
  ): BookUpdateEvent[] {
    const changes: BookUpdateEvent[] = [];

    const beforeMap = new Map<number, number>();
    const afterMap = new Map<number, number>();

    before.forEach(l => beforeMap.set(l.price, l.size));
    after.forEach(l => afterMap.set(l.price, l.size));

    // Find additions and modifications
    afterMap.forEach((size, price) => {
      const beforeSize = beforeMap.get(price);
      if (beforeSize === undefined) {
        // New order = addition
        changes.push({ timestamp, type: 'add', side, price, size });
      } else if (beforeSize !== size) {
        // Changed size = modification
        changes.push({ timestamp, type: 'modify', side, price, size });
      }
    });

    // Find cancellations
    beforeMap.forEach((size, price) => {
      if (!afterMap.has(price)) {
        // Removed order = cancellation
        changes.push({ timestamp, type: 'cancel', side, price, size });
      }
    });

    return changes;
  }

  /**
   * Calculate book pressure from order book dynamics
   */
  private calculateBookPressure(tokenId: string): number {
    const dynamics = this.getOrderBookDynamics(tokenId);

    // Positive pressure = more bid additions, negative = more ask additions
    const updates = this.bookUpdates.get(tokenId) || [];
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const windowUpdates = updates.filter(u => u.timestamp >= windowStart);

    let bidPressure = 0;
    let askPressure = 0;

    for (const update of windowUpdates) {
      if (update.type === 'add') {
        if (update.side === 'BUY') {
          bidPressure += update.size;
        } else {
          askPressure += update.size;
        }
      } else if (update.type === 'cancel') {
        if (update.side === 'BUY') {
          bidPressure -= update.size;
        } else {
          askPressure -= update.size;
        }
      }
    }

    const total = bidPressure + askPressure;
    if (total === 0) return 0;

    return (bidPressure - askPressure) / total;
  }

  /**
   * Calculate confidence score based on data quality
   */
  private calculateConfidence(flow: TradeFlow, dynamics: OrderBookDynamics): number {
    let confidence = 1.0;

    // Reduce confidence if low trade count
    const tradeCount = flow.buyCount + flow.sellCount;
    if (tradeCount < 5) {
      confidence *= 0.5;
    } else if (tradeCount < 10) {
      confidence *= 0.75;
    }

    // Reduce confidence if low order book activity
    const activityRate = dynamics.addsPerSecond + dynamics.cancelsPerSecond;
    if (activityRate < 0.1) {
      confidence *= 0.5;
    } else if (activityRate < 0.5) {
      confidence *= 0.75;
    }

    return Math.round(confidence * 100) / 100;
  }
}
