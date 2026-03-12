/**
 * StrategyPerformanceTracker - Real-time P&L tracking per strategy
 *
 * Features:
 * - Track realized/unrealized P&L per strategy
 * - Maintain trade history with entry/exit prices
 * - Calculate running win rate, avg win/loss ratio
 *
 * @module core
 */

import { getPrisma } from '../db/client';
import type { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export interface TradeRecord {
  id: string;
  strategyId: string;
  tenantId: string;
  timestamp: number;
  market: string;
  side: 'BUY' | 'SELL';
  size: number;
  entryPrice: number;
  exitPrice?: number;
  pnl?: number;
  fees: number;
  status: 'OPEN' | 'CLOSED';
}

export interface StrategyStats {
  strategyId: string;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalFees: number;
}

export class StrategyPerformanceTracker {
  private static instance: StrategyPerformanceTracker;
  private trades: Map<string, TradeRecord> = new Map();
  private strategyStats: Map<string, StrategyStats> = new Map();
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = getPrisma();
  }

  static getInstance(): StrategyPerformanceTracker {
    if (!StrategyPerformanceTracker.instance) {
      StrategyPerformanceTracker.instance = new StrategyPerformanceTracker();
    }
    return StrategyPerformanceTracker.instance;
  }

  /**
   * Record a new trade entry
   */
  async recordTrade(trade: Omit<TradeRecord, 'id' | 'status'>): Promise<TradeRecord> {
    const tradeId = `trd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const newTrade: TradeRecord = {
      ...trade,
      id: tradeId,
      status: 'OPEN',
    };

    this.trades.set(tradeId, newTrade);
    await this.persistTrade(newTrade);

    logger.info(`StrategyPerformanceTracker: Recorded trade ${tradeId} for ${trade.strategyId}`);
    return newTrade;
  }

  /**
   * Close a trade and calculate P&L
   */
  async closeTrade(
    tradeId: string,
    exitPrice: number,
    fees: number = 0
  ): Promise<TradeRecord | null> {
    const trade = this.trades.get(tradeId);
    if (!trade) return null;

    const pnl = this.calculatePnL(trade, exitPrice, fees);
    trade.exitPrice = exitPrice;
    trade.pnl = pnl;
    trade.fees += fees;
    trade.status = 'CLOSED';

    await this.updateTradeInDb(tradeId, exitPrice, pnl, fees);
    this.updateStrategyStats(trade.strategyId, pnl);

    logger.info(`StrategyPerformanceTracker: Closed trade ${tradeId} with PnL ${pnl.toFixed(2)}`);
    return trade;
  }

  /**
   * Calculate P&L for a trade
   */
  private calculatePnL(trade: TradeRecord, exitPrice: number, fees: number): number {
    const priceDiff = exitPrice - trade.entryPrice;
    const grossPnl = trade.side === 'BUY'
      ? priceDiff * trade.size
      : -priceDiff * trade.size;
    return grossPnl - trade.fees - fees;
  }

  /**
   * Get stats for a strategy
   */
  getStrategyStats(strategyId: string): StrategyStats {
    const defaultStats: StrategyStats = {
      strategyId,
      totalTrades: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      realizedPnl: 0,
      unrealizedPnl: 0,
      totalFees: 0,
    };

    const trades = Array.from(this.trades.values()).filter(t => t.strategyId === strategyId);
    if (trades.length === 0) return defaultStats;

    const closedTrades = trades.filter(t => t.status === 'CLOSED');
    const openTrades = trades.filter(t => t.status === 'OPEN');

    const wins = closedTrades.filter(t => (t.pnl ?? 0) > 0);
    const losses = closedTrades.filter(t => (t.pnl ?? 0) <= 0);

    const totalWin = wins.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const totalLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0));

    return {
      strategyId,
      totalTrades: trades.length,
      wins: wins.length,
      losses: losses.length,
      winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
      avgWin: wins.length > 0 ? totalWin / wins.length : 0,
      avgLoss: losses.length > 0 ? totalLoss / losses.length : 0,
      profitFactor: totalLoss > 0 ? totalWin / totalLoss : 0,
      realizedPnl: closedTrades.reduce((s, t) => s + (t.pnl ?? 0), 0),
      unrealizedPnl: openTrades.reduce((s, t) => s + (t.pnl ?? 0), 0),
      totalFees: trades.reduce((s, t) => s + t.fees, 0),
    };
  }

  /**
   * Get all trades for a strategy
   */
  getTrades(strategyId?: string, status?: 'OPEN' | 'CLOSED'): TradeRecord[] {
    let trades = Array.from(this.trades.values());
    if (strategyId) trades = trades.filter(t => t.strategyId === strategyId);
    if (status) trades = trades.filter(t => t.status === status);
    return trades;
  }

  /**
   * Update strategy stats after trade close
   */
  private updateStrategyStats(strategyId: string, pnl: number): void {
    const stats = this.getStrategyStats(strategyId);
    this.strategyStats.set(strategyId, stats);
  }

  /**
   * Persist trade to database
   */
  private async persistTrade(trade: TradeRecord): Promise<void> {
    try {
      await this.prisma.trade.create({
        data: {
          tenantId: trade.tenantId,
          strategyId: trade.strategyId,
          pair: trade.market,
          side: trade.side,
          price: trade.entryPrice,
          amount: trade.size,
          fee: trade.fees,
          exchange: 'POLYMARKET',
        },
      });
    } catch (error) {
      logger.error(`StrategyPerformanceTracker: Failed to persist trade ${trade.id}`, error);
    }
  }

  /**
   * Update trade in database on close
   */
  private async updateTradeInDb(
    tradeId: string,
    exitPrice: number,
    pnl: number,
    fees: number
  ): Promise<void> {
    try {
      // Update the trade record if needed
      await this.prisma.trade.updateMany({
        where: {
          strategyId: this.trades.get(tradeId)?.strategyId,
          executedAt: new Date(this.trades.get(tradeId)?.timestamp ?? Date.now()),
        },
        data: { pnl },
      });
    } catch (error) {
      logger.error(`StrategyPerformanceTracker: Failed to update trade ${tradeId}`, error);
    }
  }

  /**
   * Sync trades from database on startup
   */
  async syncFromDatabase(strategyId?: string): Promise<TradeRecord[]> {
    try {
      const where = strategyId ? { strategyId } : {};
      const dbTrades = await this.prisma.trade.findMany({
        where,
        orderBy: { executedAt: 'desc' },
        take: 100,
      });

      const synced: TradeRecord[] = [];
      for (const dbTrade of dbTrades) {
        const trade: TradeRecord = {
          id: `db_${dbTrade.id}`,
          strategyId: dbTrade.strategyId,
          tenantId: dbTrade.tenantId,
          timestamp: dbTrade.executedAt.getTime(),
          market: dbTrade.pair,
          side: dbTrade.side,
          size: Number(dbTrade.amount),
          entryPrice: Number(dbTrade.price),
          pnl: dbTrade.pnl ? Number(dbTrade.pnl) : undefined,
          fees: Number(dbTrade.fee),
          status: dbTrade.pnl !== null ? 'CLOSED' : 'OPEN',
        };
        this.trades.set(trade.id, trade);
        synced.push(trade);
      }

      logger.info(`StrategyPerformanceTracker: Synced ${synced.length} trades from database`);
      return synced;
    } catch (error) {
      logger.error('StrategyPerformanceTracker: Failed to sync from database', error);
      return [];
    }
  }

  /**
   * Clear in-memory cache (for testing)
   */
  reset(): void {
    this.trades.clear();
    this.strategyStats.clear();
  }
}
