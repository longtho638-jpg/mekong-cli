/**
 * PortfolioManager — Real-time position tracking for Polymarket
 *
 * Features:
 * - In-memory position tracking with Prisma persistence
 * - Real-time PnL calculation per position and portfolio-wide
 * - Exposure tracking per market and total
 * - Tax reporting export
 *
 * @module core
 */

import { getPrisma } from '../db/client';
import type { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

/**
 * Polymarket position interface
 */
export interface Position {
  id: string;
  tenantId: string;
  tokenId: string;
  marketId: string;
  side: 'YES' | 'NO';
  size: number;           // Number of shares
  avgPrice: number;       // Average entry price (0.00-1.00)
  currentPrice: number;   // Current market price
  realizedPnl: number;    // Realized PnL from closed positions
  unrealizedPnl: number;  // Unrealized PnL from open positions
  openedAt: number;
  closedAt?: number;
}

/**
 * Market exposure summary
 */
export interface MarketExposure {
  marketId: string;
  yesExposure: number;    // Total USD in YES positions
  noExposure: number;     // Total USD in NO positions
  netExposure: number;    // Net exposure (yes - no)
  totalPositions: number;
}

/**
 * Portfolio summary
 */
export interface PortfolioSummary {
  totalPositions: number;
  totalPnl: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalExposure: number;
  marketExposures: MarketExposure[];
}

/**
 * Tax lot for reporting
 */
export interface TaxLot {
  positionId: string;
  tokenId: string;
  marketId: string;
  side: 'YES' | 'NO';
  shares: number;
  costBasis: number;
  proceeds: number;
  pnl: number;
  isLongTerm: boolean;
  openedAt: Date;
  closedAt?: Date;
}

/**
 * PortfolioManager — Singleton for position tracking
 */
export class PortfolioManager {
  private static instance: PortfolioManager;
  private positions: Map<string, Position> = new Map();
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = getPrisma();
  }

  static getInstance(): PortfolioManager {
    if (!PortfolioManager.instance) {
      PortfolioManager.instance = new PortfolioManager();
    }
    return PortfolioManager.instance;
  }

  /**
   * Track a new position (in-memory + Prisma)
   */
  async trackPosition(position: Omit<Position, 'id' | 'unrealizedPnl' | 'realizedPnl'>): Promise<Position> {
    const positionId = `pm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const newPosition: Position = {
      ...position,
      id: positionId,
      unrealizedPnl: 0,
      realizedPnl: 0,
    };

    // Store in-memory
    this.positions.set(positionId, newPosition);

    // Persist to Prisma
    try {
      await this.prisma.polymarketPosition.create({
        data: {
          id: positionId,
          tenantId: position.tenantId,
          tokenId: position.tokenId,
          marketId: position.marketId,
          side: position.side,
          size: position.size,
          avgPrice: position.avgPrice,
          realizedPnl: 0,
          openedAt: new Date(position.openedAt),
        },
      });
      logger.info(`PortfolioManager: Tracked position ${positionId} for ${position.tokenId}`);
    } catch (error) {
      logger.error(`PortfolioManager: Failed to persist position ${positionId}`, error);
    }

    return newPosition;
  }

  /**
   * Update PnL for a position given new price
   */
  updatePnL(tokenId: string, price: number): Position | null {
    // Find all positions for this tokenId
    let updated: Position | null = null;

    for (const [, position] of this.positions) {
      if (position.tokenId === tokenId && !position.closedAt) {
        const oldUnrealized = position.unrealizedPnl;
        const priceDiff = price - position.avgPrice;

        // PnL calculation: (currentPrice - avgPrice) * shares
        position.unrealizedPnl = position.side === 'YES'
          ? priceDiff * position.size
          : -priceDiff * position.size;

        position.currentPrice = price;
        updated = position;

        if (oldUnrealized !== position.unrealizedPnl) {
          logger.debug(
            `PortfolioManager: Updated PnL for ${tokenId}: ${oldUnrealized.toFixed(4)} → ${position.unrealizedPnl.toFixed(4)}`
          );
        }
      }
    }

    return updated;
  }

  /**
   * Get all positions (optionally filtered by tenant)
   */
  getPositions(tenantId?: string): Position[] {
    const all = Array.from(this.positions.values());
    if (tenantId) {
      return all.filter(p => p.tenantId === tenantId);
    }
    return all;
  }

  /**
   * Get open positions only
   */
  getOpenPositions(tenantId?: string): Position[] {
    return this.getPositions(tenantId).filter(p => !p.closedAt);
  }

  /**
   * Close a position and finalize PnL
   */
  async closePosition(positionId: string, exitPrice: number): Promise<Position | null> {
    const position = this.positions.get(positionId);
    if (!position) return null;

    // Final PnL calculation
    const priceDiff = exitPrice - position.avgPrice;
    const finalPnl = position.side === 'YES'
      ? priceDiff * position.size
      : -priceDiff * position.size;

    position.realizedPnl = finalPnl;
    position.unrealizedPnl = 0;
    position.currentPrice = exitPrice;
    position.closedAt = Date.now();

    // Remove from active tracking
    this.positions.delete(positionId);

    // Update Prisma
    try {
      await this.prisma.polymarketPosition.update({
        where: { id: positionId },
        data: {
          realizedPnl: finalPnl,
          closedAt: new Date(),
        },
      });
      logger.info(`PortfolioManager: Closed position ${positionId} with PnL ${finalPnl.toFixed(4)}`);
    } catch (error) {
      logger.error(`PortfolioManager: Failed to close position ${positionId} in DB`, error);
    }

    return position;
  }

  /**
   * Get total PnL across all positions
   */
  getTotalPnL(tenantId?: string): number {
    const positions = this.getPositions(tenantId);
    return positions.reduce((sum, p) => sum + p.realizedPnl + p.unrealizedPnl, 0);
  }

  /**
   * Get total exposure (sum of all position sizes * prices)
   */
  getExposure(tenantId?: string): number {
    const positions = this.getOpenPositions(tenantId);
    return positions.reduce((sum, p) => sum + p.size * p.currentPrice, 0);
  }

  /**
   * Get exposure breakdown per market
   */
  getMarketExposure(tenantId?: string): MarketExposure[] {
    const positions = this.getOpenPositions(tenantId);
    const marketMap = new Map<string, MarketExposure>();

    for (const position of positions) {
      let exposure = marketMap.get(position.marketId);

      if (!exposure) {
        exposure = {
          marketId: position.marketId,
          yesExposure: 0,
          noExposure: 0,
          netExposure: 0,
          totalPositions: 0,
        };
        marketMap.set(position.marketId, exposure);
      }

      const positionValue = position.size * position.currentPrice;

      if (position.side === 'YES') {
        exposure.yesExposure += positionValue;
      } else {
        exposure.noExposure += positionValue;
      }

      exposure.netExposure = exposure.yesExposure - exposure.noExposure;
      exposure.totalPositions += 1;
    }

    return Array.from(marketMap.values());
  }

  /**
   * Get complete portfolio summary
   */
  getPortfolioSummary(tenantId?: string): PortfolioSummary {
    const positions = this.getPositions(tenantId);
    const realizedPnl = positions.reduce((sum, p) => sum + p.realizedPnl, 0);
    const unrealizedPnl = positions.reduce((sum, p) => sum + p.unrealizedPnl, 0);

    return {
      totalPositions: positions.length,
      totalPnl: realizedPnl + unrealizedPnl,
      realizedPnl,
      unrealizedPnl,
      totalExposure: this.getExposure(tenantId),
      marketExposures: this.getMarketExposure(tenantId),
    };
  }

  /**
   * Sync positions from Prisma (on startup or recovery)
   */
  async syncFromDatabase(tenantId?: string): Promise<Position[]> {
    try {
      const where = tenantId ? { tenantId } : {};
      const dbPositions = await this.prisma.polymarketPosition.findMany({
        where,
        orderBy: { openedAt: 'desc' },
      });

      const synced: Position[] = [];

      for (const dbPos of dbPositions) {
        const isClosed = !!dbPos.closedAt;
        const position: Position = {
          id: dbPos.id,
          tenantId: dbPos.tenantId,
          tokenId: dbPos.tokenId,
          marketId: dbPos.marketId,
          side: dbPos.side as 'YES' | 'NO',
          size: Number(dbPos.size),
          avgPrice: Number(dbPos.avgPrice),
          currentPrice: Number(dbPos.avgPrice), // Will be updated by price feed
          realizedPnl: Number(dbPos.realizedPnl),
          unrealizedPnl: isClosed ? 0 : Number(dbPos.realizedPnl), // Placeholder until price update
          openedAt: dbPos.openedAt.getTime(),
          closedAt: dbPos.closedAt?.getTime(),
        };

        if (!isClosed) {
          this.positions.set(dbPos.id, position);
          synced.push(position);
        }
      }

      logger.info(`PortfolioManager: Synced ${synced.length} open positions from database`);
      return synced;
    } catch (error) {
      logger.error('PortfolioManager: Failed to sync from database', error);
      return [];
    }
  }

  /**
   * Export tax lots for a given year
   */
  async exportTaxLots(tenantId: string, year: number): Promise<TaxLot[]> {
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 0, 23, 59, 59);

    try {
      const dbPositions = await this.prisma.polymarketPosition.findMany({
        where: {
          tenantId,
          closedAt: {
            gte: start,
            lte: end,
          },
        },
        orderBy: { closedAt: 'asc' },
      });

      return dbPositions.map((dbPos) => {
        const costBasis = Number(dbPos.size) * Number(dbPos.avgPrice);
        const proceeds = costBasis + Number(dbPos.realizedPnl);
        const openedAt = dbPos.openedAt;
        const closedAt = dbPos.closedAt!;
        const holdingDays = (closedAt.getTime() - openedAt.getTime()) / (1000 * 60 * 60 * 24);

        return {
          positionId: dbPos.id,
          tokenId: dbPos.tokenId,
          marketId: dbPos.marketId,
          side: dbPos.side as 'YES' | 'NO',
          shares: Number(dbPos.size),
          costBasis,
          proceeds,
          pnl: Number(dbPos.realizedPnl),
          isLongTerm: holdingDays > 365,
          openedAt,
          closedAt,
        };
      });
    } catch (error) {
      logger.error(`PortfolioManager: Failed to export tax lots for ${year}`, error);
      return [];
    }
  }

  /**
   * Get PnL history for a tenant
   */
  async getPnLHistory(tenantId: string, limit: number = 100): Promise<Position[]> {
    try {
      const dbPositions = await this.prisma.polymarketPosition.findMany({
        where: { tenantId, closedAt: { not: null } },
        orderBy: { closedAt: 'desc' },
        take: limit,
      });

      return dbPositions.map((dbPos) => ({
        id: dbPos.id,
        tenantId: dbPos.tenantId,
        tokenId: dbPos.tokenId,
        marketId: dbPos.marketId,
        side: dbPos.side as 'YES' | 'NO',
        size: Number(dbPos.size),
        avgPrice: Number(dbPos.avgPrice),
        currentPrice: Number(dbPos.avgPrice),
        realizedPnl: Number(dbPos.realizedPnl),
        unrealizedPnl: 0,
        openedAt: dbPos.openedAt.getTime(),
        closedAt: dbPos.closedAt?.getTime(),
      }));
    } catch (error) {
      logger.error('PortfolioManager: Failed to get PnL history', error);
      return [];
    }
  }

  /**
   * Clear in-memory cache (for testing)
   */
  reset(): void {
    this.positions.clear();
  }
}
