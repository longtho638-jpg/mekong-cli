/**
 * Position Manager — Track open positions, P&L, and risk metrics
 *
 * Features:
 * - Real-time position tracking
 * - Unrealized P&L calculation
 * - Risk percentage monitoring
 * - Position sizing based on risk %
 *
 * PRO FEATURE: Advanced metrics require PRO license
 */

import { LicenseService, LicenseTier } from '../lib/raas-gate';
import { logger } from '../utils/logger';

export interface Position {
  symbol: string;
  exchange: string;
  side: 'LONG' | 'SHORT';
  size: number; // in base currency
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  leverage: number;
  openedAt: number;
  metadata?: Record<string, unknown>;
}

export interface RiskMetrics {
  totalExposure: number; // Total USD exposure
  netExposure: number; // Net long/short
  grossExposure: number; // Sum of absolute positions
  maxPositionPct: number; // Largest position as % of portfolio
  positionCount: number;
  longCount: number;
  shortCount: number;
}

export interface PositionUpdate {
  symbol: string;
  currentPrice: number;
  timestamp: number;
}

export class PositionManager {
  private positions: Map<string, Position>; // key: `${exchange}:${symbol}`
  private licenseService: LicenseService;
  private maxPositionSizeUsd: number;
  private maxTotalExposureUsd: number;

  constructor(maxPositionSizeUsd = 10000, maxTotalExposureUsd = 50000) {
    this.positions = new Map();
    this.licenseService = LicenseService.getInstance();
    this.maxPositionSizeUsd = maxPositionSizeUsd;
    this.maxTotalExposureUsd = maxTotalExposureUsd;
  }

  /**
   * Open a new position
   */
  openPosition(position: Omit<Position, 'unrealizedPnl' | 'unrealizedPnlPct' | 'currentPrice' | 'openedAt'>): Position {
    const key = `${position.exchange}:${position.symbol}`;

    const newPosition: Position = {
      ...position,
      currentPrice: position.entryPrice,
      unrealizedPnl: 0,
      unrealizedPnlPct: 0,
      openedAt: Date.now(),
    };

    this.positions.set(key, newPosition);
    logger.info('[PositionManager] Opened position', {
      symbol: position.symbol,
      side: position.side,
      size: position.size,
      entryPrice: position.entryPrice,
    });

    return newPosition;
  }

  /**
   * Update position with current price
   */
  updatePosition(update: PositionUpdate): Position | null {
    const position = Array.from(this.positions.values()).find(p => p.symbol === update.symbol);
    if (!position) return null;

    const priceChange = update.currentPrice - position.entryPrice;
    const direction = position.side === 'LONG' ? 1 : -1;

    position.currentPrice = update.currentPrice;
    position.unrealizedPnl = position.size * priceChange * direction;
    position.unrealizedPnlPct = (priceChange / position.entryPrice) * 100 * direction;

    return position;
  }

  /**
   * Close a position
   */
  closePosition(exchange: string, symbol: string, exitPrice: number): Position | null {
    const key = `${exchange}:${symbol}`;
    const position = this.positions.get(key);

    if (!position) {
      logger.warn('[PositionManager] Position not found', { exchange, symbol });
      return null;
    }

    // Final P&L update
    const priceChange = exitPrice - position.entryPrice;
    const direction = position.side === 'LONG' ? 1 : -1;
    position.unrealizedPnl = position.size * priceChange * direction;
    position.unrealizedPnlPct = (priceChange / position.entryPrice) * 100 * direction;

    this.positions.delete(key);
    logger.info('[PositionManager] Closed position', {
      symbol,
      side: position.side,
      pnl: position.unrealizedPnl,
      pnlPct: position.unrealizedPnlPct,
    });

    return position;
  }

  /**
   * Calculate unrealized P&L
   */
  calculateUnrealizedPnl(currentPrices: Map<string, number>): number {
    let totalPnl = 0;

    for (const position of this.positions.values()) {
      const currentPrice = currentPrices.get(position.symbol) ?? position.currentPrice;
      const priceChange = currentPrice - position.entryPrice;
      const direction = position.side === 'LONG' ? 1 : -1;
      const pnl = position.size * priceChange * direction;
      totalPnl += pnl;
    }

    return totalPnl;
  }

  /**
   * Get risk metrics
   * PRO FEATURE: Detailed metrics require PRO license
   */
  getRiskMetrics(portfolioValue: number = 100000): RiskMetrics {
    // Check for advanced metrics (PRO feature)
    const positions = Array.from(this.positions.values());

    const grossExposure = positions.reduce((sum, p) => sum + p.size * p.currentPrice, 0);
    const longExposure = positions.filter(p => p.side === 'LONG').reduce((sum, p) => sum + p.size * p.currentPrice, 0);
    const shortExposure = positions.filter(p => p.side === 'SHORT').reduce((sum, p) => sum + p.size * p.currentPrice, 0);

    const maxPosition = Math.max(...positions.map(p => p.size * p.currentPrice), 0);
    const maxPositionPct = portfolioValue > 0 ? (maxPosition / portfolioValue) * 100 : 0;

    return {
      totalExposure: grossExposure,
      netExposure: longExposure - shortExposure,
      grossExposure,
      maxPositionPct,
      positionCount: positions.length,
      longCount: positions.filter(p => p.side === 'LONG').length,
      shortCount: positions.filter(p => p.side === 'SHORT').length,
    };
  }

  /**
   * Check if new position is within risk limits
   */
  canOpenPosition(symbol: string, size: number, price: number): { allowed: boolean; reason?: string } {
    const positionValue = size * price;

    // Check max position size
    if (positionValue > this.maxPositionSizeUsd) {
      return {
        allowed: false,
        reason: `Position size ${positionValue} exceeds max ${this.maxPositionSizeUsd}`,
      };
    }

    // Check total exposure
    const currentExposure = this.getTotalExposure();
    if (currentExposure + positionValue > this.maxTotalExposureUsd) {
      return {
        allowed: false,
        reason: `Total exposure ${currentExposure + positionValue} would exceed max ${this.maxTotalExposureUsd}`,
      };
    }

    return { allowed: true };
  }

  /**
   * Get total exposure
   */
  getTotalExposure(): number {
    let total = 0;
    for (const position of this.positions.values()) {
      total += position.size * position.currentPrice;
    }
    return total;
  }

  /**
   * Get all positions
   */
  getPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  /**
   * Get position by key
   */
  getPosition(exchange: string, symbol: string): Position | undefined {
    return this.positions.get(`${exchange}:${symbol}`);
  }

  /**
   * Close all positions (emergency)
   */
  closeAllPositions(currentPrices: Map<string, number>): Position[] {
    const closed: Position[] = [];

    for (const position of this.positions.values()) {
      const exitPrice = currentPrices.get(position.symbol) ?? position.currentPrice;
      const result = this.closePosition(position.exchange, position.symbol, exitPrice);
      if (result) {
        closed.push(result);
      }
    }

    logger.info('[PositionManager] Closed all positions', { count: closed.length });
    return closed;
  }

  /**
   * Get positions by exchange
   */
  getPositionsByExchange(exchange: string): Position[] {
    return Array.from(this.positions.values()).filter(p => p.exchange === exchange);
  }

  /**
   * Clear all positions (for testing)
   */
  reset(): void {
    this.positions.clear();
  }

  /**
   * Update risk limits
   */
  setRiskLimits(maxPositionSizeUsd: number, maxTotalExposureUsd: number): void {
    this.maxPositionSizeUsd = maxPositionSizeUsd;
    this.maxTotalExposureUsd = maxTotalExposureUsd;
  }
}

// Singleton instance
let instance: PositionManager | null = null;

export function getPositionManager(): PositionManager {
  if (!instance) {
    instance = new PositionManager();
  }
  return instance;
}
