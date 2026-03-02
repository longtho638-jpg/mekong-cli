/**
 * Per-tenant in-memory arbitrage position and trade history store.
 * Tracks open/closed positions with tier-based limits (free=1, pro=5, enterprise=unlimited).
 * Supports ATR-based trailing stops via updatePriceTick().
 */

import { logger } from '../utils/logger';
import type { TenantConfig } from './tenant-strategy-manager';
import type {
  ArbPosition,
  ArbStats,
  PaginatedHistory,
  PaginationOptions,
  TrailingStopConfig,
} from './tenant-arbitrage-position-tracker-types';

export type {
  ArbPosition,
  ArbStats,
  PaginatedHistory,
  PaginationOptions,
  TrailingStopConfig,
} from './tenant-arbitrage-position-tracker-types';

const TIER_MAX_POSITIONS: Record<TenantConfig['tier'], number> = {
  free: 1,
  pro: 5,
  enterprise: Infinity,
};

export class TenantArbPositionTracker {
  private positions = new Map<string, ArbPosition[]>();
  private trailingConfigs = new Map<string, TrailingStopConfig>();

  private getOrCreate(tenantId: string): ArbPosition[] {
    if (!this.positions.has(tenantId)) {
      this.positions.set(tenantId, []);
    }
    return this.positions.get(tenantId)!;
  }

  setTrailingStopConfig(tenantId: string, config: TrailingStopConfig): void {
    this.trailingConfigs.set(tenantId, config);
  }

  openPosition(
    tenantId: string,
    tier: TenantConfig['tier'],
    data: Omit<ArbPosition, 'id' | 'tenantId' | 'pnl' | 'status' | 'openedAt'>
  ): ArbPosition | null {
    const all = this.getOrCreate(tenantId);
    const openCount = all.filter(p => p.status === 'open').length;
    const maxOpen = TIER_MAX_POSITIONS[tier];

    if (openCount >= maxOpen) {
      logger.warn(`openPosition: tenant ${tenantId} at open position limit (${maxOpen}) for tier ${tier}`);
      return null;
    }

    const position: ArbPosition = {
      id: `arb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      tenantId,
      pnl: (data.sellPrice - data.buyPrice) * data.amount,
      status: 'open',
      openedAt: Date.now(),
      ...data,
    };

    const cfg = this.trailingConfigs.get(tenantId);
    if (cfg?.enabled) {
      position.highWaterMark = Math.max(data.buyPrice, data.sellPrice);
      // Initial stop: placeholder — will be accurate on first updatePriceTick call
      position.trailingStopPrice = undefined;
      position.trailingStopTriggered = false;
    }

    all.push(position);
    logger.info(`Position opened: ${position.id} for tenant ${tenantId} on ${data.symbol}`);
    return position;
  }

  closePosition(tenantId: string, positionId: string, finalPnl?: number): ArbPosition | null {
    const all = this.getOrCreate(tenantId);
    const position = all.find(p => p.id === positionId && p.tenantId === tenantId);
    if (!position) return null;

    position.status = 'closed';
    position.closedAt = Date.now();
    if (finalPnl !== undefined) position.pnl = finalPnl;

    logger.info(`Position closed: ${positionId} for tenant ${tenantId}, pnl=${position.pnl.toFixed(4)}`);
    return position;
  }

  updatePriceTick(
    tenantId: string,
    positionId: string,
    currentPrice: number,
    currentATR: number
  ): { triggered: boolean; position: ArbPosition | null } {
    const all = this.getOrCreate(tenantId);
    const position = all.find(p => p.id === positionId && p.tenantId === tenantId && p.status === 'open');
    if (!position) return { triggered: false, position: null };

    const cfg = this.trailingConfigs.get(tenantId);
    if (!cfg?.enabled) return { triggered: false, position };

    // Update high-water mark
    const hwm = Math.max(position.highWaterMark ?? currentPrice, currentPrice);
    position.highWaterMark = hwm;

    // Recalculate stop: hwm * (1 - atrMultiplier * ATR / hwm)
    position.trailingStopPrice = hwm * (1 - (cfg.atrMultiplier * currentATR) / hwm);

    if (currentPrice <= position.trailingStopPrice) {
      position.trailingStopTriggered = true;
      this.closePosition(tenantId, positionId);
      logger.info(
        `Trailing stop triggered: ${positionId} tenant=${tenantId} price=${currentPrice} stop=${position.trailingStopPrice.toFixed(4)}`
      );
      return { triggered: true, position };
    }

    return { triggered: false, position };
  }

  getPositions(tenantId: string): ArbPosition[] {
    return this.getOrCreate(tenantId).filter(p => p.status === 'open');
  }

  getHistory(tenantId: string, opts: PaginationOptions): PaginatedHistory {
    let items = this.getOrCreate(tenantId);

    if (opts.symbol) {
      items = items.filter(p => p.symbol === opts.symbol);
    }
    if (opts.startDate) {
      const start = new Date(opts.startDate).getTime();
      items = items.filter(p => p.openedAt >= start);
    }
    if (opts.endDate) {
      const end = new Date(opts.endDate).getTime();
      items = items.filter(p => p.openedAt <= end);
    }

    const total = items.length;
    const offset = (opts.page - 1) * opts.limit;
    return { items: items.slice(offset, offset + opts.limit), total, page: opts.page, limit: opts.limit };
  }

  getStats(tenantId: string): ArbStats {
    const all = this.getOrCreate(tenantId);
    const closed = all.filter(p => p.status === 'closed');

    if (closed.length === 0) {
      return { totalPnl: 0, totalTrades: 0, winRate: 0, bestSpreadPct: 0, avgPnl: 0 };
    }

    const totalPnl = closed.reduce((sum, p) => sum + p.pnl, 0);
    const wins = closed.filter(p => p.pnl > 0).length;
    const bestSpreadPct = Math.max(...closed.map(p => p.netSpreadPct));

    return {
      totalPnl,
      totalTrades: closed.length,
      winRate: wins / closed.length,
      bestSpreadPct,
      avgPnl: totalPnl / closed.length,
    };
  }

  /** Exposed for testing */
  _reset(tenantId?: string): void {
    if (tenantId) {
      this.positions.delete(tenantId);
      this.trailingConfigs.delete(tenantId);
    } else {
      this.positions.clear();
      this.trailingConfigs.clear();
    }
  }
}
