/**
 * Position Manager — Real-time P&L tracking per tenant
 * License-gated: PRO for advanced analytics
 */

import { LicenseService, LicenseTier } from '../lib/raas-gate';

export interface Position {
  id: string;
  symbol: string;
  exchangeId: string;
  side: 'long' | 'short';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  openedAt: number;
  closedAt?: number;
}

export interface PositionSummary {
  totalPositions: number;
  totalUnrealizedPnl: number;
  totalRealizedPnl: number;
  winRate: number;
}

export class PositionManager {
  private static instance: PositionManager;
  private positions: Map<string, Position> = new Map();
  private closedPositions: Position[] = [];
  private licenseService: LicenseService;

  private constructor() {
    this.licenseService = LicenseService.getInstance();
  }

  static getInstance(): PositionManager {
    if (!PositionManager.instance) {
      PositionManager.instance = new PositionManager();
    }
    return PositionManager.instance;
  }

  openPosition(position: Position): void {
    this.positions.set(position.id, position);
  }

  updatePrice(positionId: string, price: number): void {
    const position = this.positions.get(positionId);
    if (position) {
      position.currentPrice = price;
      position.unrealizedPnl = this.calculatePnl(position);
    }
  }

  closePosition(positionId: string, exitPrice: number): Position | null {
    const position = this.positions.get(positionId);
    if (!position) return null;
    position.currentPrice = exitPrice;
    position.realizedPnl = this.calculatePnl(position);
    position.unrealizedPnl = 0;
    position.closedAt = Date.now();
    this.positions.delete(positionId);
    this.closedPositions.push(position);
    return position;
  }

  private calculatePnl(position: Position): number {
    const priceDiff = position.currentPrice - position.entryPrice;
    const pnl = position.side === 'long' ? priceDiff : -priceDiff;
    return pnl * position.quantity;
  }

  getPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  getSummary(): PositionSummary {
    const positions = this.getPositions();
    const totalUnrealizedPnl = positions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
    const totalRealizedPnl = this.closedPositions.reduce((sum, p) => sum + p.realizedPnl, 0);
    const winningTrades = this.closedPositions.filter(p => p.realizedPnl > 0).length;
    const winRate = this.closedPositions.length > 0
      ? (winningTrades / this.closedPositions.length) * 100
      : 0;
    return {
      totalPositions: positions.length,
      totalUnrealizedPnl,
      totalRealizedPnl,
      winRate,
    };
  }

  getAdvancedAnalytics(): PositionSummary & { sharpeRatio?: number; maxDrawdown?: number } {
    this.licenseService.requireTier(LicenseTier.PRO, 'advanced_position_analytics');
    const summary = this.getSummary();
    if (this.closedPositions.length < 2) {
      return { ...summary, sharpeRatio: 0, maxDrawdown: 0 };
    }
    const returns = this.closedPositions.map(p => p.realizedPnl);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(returns.map(r => Math.pow(r - avgReturn, 2)).reduce((a, b) => a + b, 0) / returns.length);
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;
    let peak = 0;
    let maxDrawdown = 0;
    let cumulative = 0;
    for (const pnl of returns) {
      cumulative += pnl;
      if (cumulative > peak) peak = cumulative;
      const drawdown = (peak - cumulative) / peak * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    return { ...summary, sharpeRatio, maxDrawdown };
  }

  reset(): void {
    this.positions.clear();
    this.closedPositions = [];
  }
}
