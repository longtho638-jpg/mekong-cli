/**
 * PnL Tracker — Real-time profit/loss tracking per strategy.
 *
 * Tracks realized/unrealized PnL with rolling windows: 1h, 24h, 7d.
 * Supports strategy breakdown: ListingArb, CrossPlatformArb, MarketMaker.
 */

import { IPolymarketSignal } from '../interfaces/IPolymarket';
import { RiskEventEmitter } from '../core/risk-events';
import { logger } from '../utils/logger';

/**
 * Trade record for PnL calculation
 */
export interface TradeRecord {
  /** Unique trade identifier */
  tradeId: string;
  /** Strategy that executed the trade */
  strategy: string;
  /** Token/asset ID */
  tokenId: string;
  /** Trade side */
  side: 'YES' | 'NO';
  /** Trade action */
  action: 'BUY' | 'SELL';
  /** Price per share */
  price: number;
  /** Number of shares */
  size: number;
  /** Unix timestamp */
  timestamp: number;
  /** Realized PnL (for sells) */
  realizedPnl?: number;
}

/**
 * Position tracking for a single token
 */
export interface Position {
  /** Token ID */
  tokenId: string;
  /** Strategy owning the position */
  strategy: string;
  /** Total shares held */
  shares: number;
  /** Average entry price */
  avgPrice: number;
  /** Current market price */
  currentPrice: number;
  /** Realized PnL */
  realizedPnl: number;
  /** Unrealized PnL */
  unrealizedPnl: number;
  /** Opened at timestamp */
  openedAt?: number;
}

/**
 * Rolling window PnL data
 */
export interface RollingPnL {
  /** 1-hour PnL */
  pnl1h: number;
  /** 24-hour PnL */
  pnl24h: number;
  /** 7-day PnL */
  pnl7d: number;
}

/**
 * Strategy-level PnL breakdown
 */
export interface StrategyPnL {
  /** Strategy name */
  strategy: string;
  /** Total PnL */
  totalPnl: number;
  /** Realized PnL */
  realizedPnl: number;
  /** Unrealized PnL */
  unrealizedPnl: number;
  /** Trade count */
  tradeCount: number;
  /** Win rate (0.0-1.0) */
  winRate: number;
}

/**
 * PnL Tracker — Track realized/unrealized PnL per strategy
 */
export class PnLTracker {
  private trades: Map<string, TradeRecord> = new Map();
  private positions: Map<string, Position> = new Map();
  private strategyPnL: Map<string, StrategyPnL> = new Map();
  private eventEmitter: RiskEventEmitter;

  /** Rolling window timestamps (ms) */
  private readonly window1h = 60 * 60 * 1000;
  private readonly window24h = 24 * 60 * 60 * 1000;
  private readonly window7d = 7 * 24 * 60 * 60 * 1000;

  constructor() {
    this.eventEmitter = RiskEventEmitter.getInstance();
    this.initStrategies();
  }

  /**
   * Initialize strategy PnL tracking
   */
  private initStrategies(): void {
    const strategies = ['ListingArb', 'CrossPlatformArb', 'MarketMaker'];
    for (const strategy of strategies) {
      this.strategyPnL.set(strategy, {
        strategy,
        totalPnl: 0,
        realizedPnl: 0,
        unrealizedPnl: 0,
        tradeCount: 0,
        winRate: 0,
      });
    }
  }

  /**
   * Record a trade fill
   */
  recordTrade(trade: TradeRecord): void {
    this.trades.set(trade.tradeId, trade);

    // Update position
    const positionKey = `${trade.strategy}:${trade.tokenId}`;
    const existingPosition = this.positions.get(positionKey);

    if (trade.action === 'BUY') {
      // Open or add to position
      if (!existingPosition) {
        this.positions.set(positionKey, {
          tokenId: trade.tokenId,
          strategy: trade.strategy,
          shares: trade.size,
          avgPrice: trade.price,
          currentPrice: trade.price,
          realizedPnl: 0,
          unrealizedPnl: 0,
          openedAt: trade.timestamp,
        });
      } else {
        // Average into existing position
        const totalCost = existingPosition.avgPrice * existingPosition.shares + trade.price * trade.size;
        existingPosition.shares += trade.size;
        existingPosition.avgPrice = totalCost / existingPosition.shares;
        existingPosition.currentPrice = trade.price;
      }
    } else if (trade.action === 'SELL') {
      // Close or reduce position
      if (existingPosition) {
        const sellShares = Math.min(trade.size, existingPosition.shares);
        const pnl = (trade.price - existingPosition.avgPrice) * sellShares;

        existingPosition.shares -= sellShares;
        existingPosition.realizedPnl += pnl;
        existingPosition.currentPrice = trade.price;

        // Record realized PnL on trade
        trade.realizedPnl = pnl;
        this.trades.set(trade.tradeId, trade);

        // Remove closed position
        if (existingPosition.shares <= 0) {
          this.positions.delete(positionKey);
        }
      }
    }

    // Update strategy PnL
    this.updateStrategyPnL(trade.strategy);

    // Emit event
    this.eventEmitter.emit({
      type: 'pnl:alert',
      severity: 'info',
      message: `Trade recorded: ${trade.strategy} ${trade.action} ${trade.size} @ ${trade.price}`,
      timestamp: Date.now(),
      metadata: {
        currentPnl: this.getTotalPnL(),
        threshold: 0,
        period: 'total' as const,
        tradeId: trade.tradeId,
        realizedPnl: trade.realizedPnl ?? 0,
        strategy: trade.strategy,
      },
    });

    logger.debug(`[PnLTracker] Recorded trade: ${trade.tradeId} (${trade.realizedPnl?.toFixed(2) ?? '0'} PnL)`);
  }

  /**
   * Update strategy PnL totals
   */
  private updateStrategyPnL(strategy: string): void {
    const strategyData = this.strategyPnL.get(strategy);
    if (!strategyData) return;

    // Calculate realized PnL from trades
    let realizedPnl = 0;
    let winningTrades = 0;
    let tradeCount = 0;

    Array.from(this.trades.values()).forEach(trade => {
      if (trade.strategy === strategy && trade.realizedPnl !== undefined) {
        realizedPnl += trade.realizedPnl;
        tradeCount++;
        if (trade.realizedPnl > 0) winningTrades++;
      }
    });

    // Calculate unrealized PnL from open positions
    let unrealizedPnl = 0;
    Array.from(this.positions.values()).forEach(position => {
      if (position.strategy === strategy) {
        unrealizedPnl += position.unrealizedPnl;
      }
    });

    strategyData.realizedPnl = realizedPnl;
    strategyData.unrealizedPnl = unrealizedPnl;
    strategyData.totalPnl = realizedPnl + unrealizedPnl;
    strategyData.tradeCount = tradeCount;
    strategyData.winRate = tradeCount > 0 ? winningTrades / tradeCount : 0;
  }

  /**
   * Get total PnL across all strategies
   */
  getTotalPnL(): number {
    return Array.from(this.strategyPnL.values()).reduce((sum, data) => sum + data.totalPnl, 0);
  }

  /**
   * Get daily PnL (last 24h)
   */
  getDailyPnL(): number {
    const now = Date.now();
    return Array.from(this.trades.values())
      .filter(trade => now - trade.timestamp <= this.window24h && trade.realizedPnl !== undefined)
      .reduce((sum, trade) => sum + trade.realizedPnl!, 0);
  }

  /**
   * Get PnL for a specific strategy
   */
  getStrategyPnL(strategy: string): StrategyPnL | undefined {
    return this.strategyPnL.get(strategy);
  }

  /**
   * Get all strategy PnL breakdowns
   */
  getAllStrategyPnL(): StrategyPnL[] {
    return Array.from(this.strategyPnL.values());
  }

  /**
   * Get rolling window PnL
   */
  getRollingPnL(): RollingPnL {
    const now = Date.now();
    const pnl: RollingPnL = { pnl1h: 0, pnl24h: 0, pnl7d: 0 };

    Array.from(this.trades.values()).forEach(trade => {
      const age = now - trade.timestamp;
      const realized = trade.realizedPnl ?? 0;

      if (age <= this.window1h) pnl.pnl1h += realized;
      if (age <= this.window24h) pnl.pnl24h += realized;
      if (age <= this.window7d) pnl.pnl7d += realized;
    });

    return pnl;
  }

  /**
   * Update current prices for unrealized PnL calculation
   */
  updatePrices(tokenId: string, currentPrice: number): void {
    Array.from(this.positions.values()).forEach(position => {
      if (position.tokenId === tokenId) {
        position.currentPrice = currentPrice;
        position.unrealizedPnl = (currentPrice - position.avgPrice) * position.shares;

        // Update strategy PnL
        this.updateStrategyPnL(position.strategy);
      }
    });
  }

  /**
   * Get open positions
   */
  getPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  /**
   * Get recent trades
   */
  getTrades(limit: number = 100): TradeRecord[] {
    return Array.from(this.trades.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Reset tracker (for testing)
   */
  reset(): void {
    this.trades.clear();
    this.positions.clear();
    this.initStrategies();
  }
}
