/**
 * Strategy Position Manager — Tracks open/closed positions per strategy per symbol.
 * Provides realized + unrealized PnL, risk limits (max position size, max concurrent),
 * and position lifecycle events.
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

export interface Position {
  id: string;
  strategy: string;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice?: number;
  amount: number;
  status: 'open' | 'closed';
  openedAt: number;
  closedAt?: number;
  realizedPnl?: number;
  metadata?: Record<string, unknown>;
}

export interface PositionRiskLimits {
  maxPositionSizeUsd: number;     // max single position value
  maxConcurrentPositions: number; // max open positions simultaneously
  maxDailyLossUsd: number;        // stop trading if daily loss exceeds this
}

export interface PositionSummary {
  totalPositions: number;
  openPositions: number;
  closedPositions: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalPnl: number;
  winCount: number;
  lossCount: number;
  winRate: number;
}

const DEFAULT_LIMITS: PositionRiskLimits = {
  maxPositionSizeUsd: 10_000,
  maxConcurrentPositions: 5,
  maxDailyLossUsd: 1_000,
};

let positionCounter = 0;

export class StrategyPositionManager extends EventEmitter {
  private positions = new Map<string, Position>();
  private limits: PositionRiskLimits;
  private dailyLoss = 0;
  private dailyLossResetAt = 0;

  constructor(limits?: Partial<PositionRiskLimits>) {
    super();
    this.limits = { ...DEFAULT_LIMITS, ...limits };
  }

  /** Open a new position. Returns position ID or null if risk limit hit. */
  openPosition(params: {
    strategy: string;
    symbol: string;
    side: 'long' | 'short';
    entryPrice: number;
    amount: number;
    metadata?: Record<string, unknown>;
  }): string | null {
    this.resetDailyIfNeeded();

    // Risk check: max concurrent
    const openCount = this.getOpenPositions().length;
    if (openCount >= this.limits.maxConcurrentPositions) {
      logger.warn(`[PositionMgr] Max concurrent positions (${this.limits.maxConcurrentPositions}) reached`);
      this.emit('risk:limit', { type: 'max_concurrent', current: openCount });
      return null;
    }

    // Risk check: position size
    const positionValue = params.entryPrice * params.amount;
    if (positionValue > this.limits.maxPositionSizeUsd) {
      logger.warn(`[PositionMgr] Position size $${positionValue.toFixed(2)} exceeds limit $${this.limits.maxPositionSizeUsd}`);
      this.emit('risk:limit', { type: 'max_size', value: positionValue });
      return null;
    }

    // Risk check: daily loss
    if (this.dailyLoss >= this.limits.maxDailyLossUsd) {
      logger.warn(`[PositionMgr] Daily loss $${this.dailyLoss.toFixed(2)} exceeds limit $${this.limits.maxDailyLossUsd}`);
      this.emit('risk:limit', { type: 'daily_loss', value: this.dailyLoss });
      return null;
    }

    const id = `pos-${++positionCounter}-${Date.now()}`;
    const position: Position = {
      id,
      strategy: params.strategy,
      symbol: params.symbol,
      side: params.side,
      entryPrice: params.entryPrice,
      amount: params.amount,
      status: 'open',
      openedAt: Date.now(),
      metadata: params.metadata,
    };

    this.positions.set(id, position);
    logger.info(`[PositionMgr] Opened ${position.side} ${position.symbol} x${position.amount} @ $${position.entryPrice} [${id}]`);
    this.emit('position:opened', position);
    return id;
  }

  /** Close an open position at the given exit price. */
  closePosition(id: string, exitPrice: number): Position | null {
    const position = this.positions.get(id);
    if (!position || position.status !== 'open') {
      logger.warn(`[PositionMgr] Cannot close position ${id}: not found or already closed`);
      return null;
    }

    position.exitPrice = exitPrice;
    position.closedAt = Date.now();
    position.status = 'closed';

    // Calculate realized PnL
    const direction = position.side === 'long' ? 1 : -1;
    position.realizedPnl = direction * (exitPrice - position.entryPrice) * position.amount;

    // Track daily loss
    if (position.realizedPnl < 0) {
      this.dailyLoss += Math.abs(position.realizedPnl);
    }

    logger.info(`[PositionMgr] Closed ${id}: PnL ${position.realizedPnl >= 0 ? '+' : ''}$${position.realizedPnl.toFixed(2)}`);
    this.emit('position:closed', position);
    return position;
  }

  /** Get unrealized PnL for an open position at current market price. */
  getUnrealizedPnl(id: string, currentPrice: number): number {
    const position = this.positions.get(id);
    if (!position || position.status !== 'open') return 0;
    const direction = position.side === 'long' ? 1 : -1;
    return direction * (currentPrice - position.entryPrice) * position.amount;
  }

  getPosition(id: string): Position | undefined {
    return this.positions.get(id);
  }

  getOpenPositions(): Position[] {
    return Array.from(this.positions.values()).filter(p => p.status === 'open');
  }

  getClosedPositions(): Position[] {
    return Array.from(this.positions.values()).filter(p => p.status === 'closed');
  }

  getPositionsByStrategy(strategy: string): Position[] {
    return Array.from(this.positions.values()).filter(p => p.strategy === strategy);
  }

  /** Compute summary statistics across all positions. */
  getSummary(currentPrices?: Map<string, number>): PositionSummary {
    const all = Array.from(this.positions.values());
    const closed = all.filter(p => p.status === 'closed');
    const open = all.filter(p => p.status === 'open');

    const realizedPnl = closed.reduce((sum, p) => sum + (p.realizedPnl ?? 0), 0);
    let unrealizedPnl = 0;
    if (currentPrices) {
      for (const p of open) {
        const price = currentPrices.get(p.symbol);
        if (price) unrealizedPnl += this.getUnrealizedPnl(p.id, price);
      }
    }

    const wins = closed.filter(p => (p.realizedPnl ?? 0) > 0);
    const losses = closed.filter(p => (p.realizedPnl ?? 0) < 0);

    return {
      totalPositions: all.length,
      openPositions: open.length,
      closedPositions: closed.length,
      realizedPnl,
      unrealizedPnl,
      totalPnl: realizedPnl + unrealizedPnl,
      winCount: wins.length,
      lossCount: losses.length,
      winRate: closed.length > 0 ? wins.length / closed.length : 0,
    };
  }

  getDailyLoss(): number {
    this.resetDailyIfNeeded();
    return this.dailyLoss;
  }

  getLimits(): PositionRiskLimits {
    return { ...this.limits };
  }

  private resetDailyIfNeeded(): void {
    const now = Date.now();
    const dayMs = 86_400_000;
    if (now - this.dailyLossResetAt >= dayMs) {
      this.dailyLoss = 0;
      this.dailyLossResetAt = now;
    }
  }
}
