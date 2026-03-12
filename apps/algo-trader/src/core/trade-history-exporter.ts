/**
 * TradeHistoryExporter - CSV/JSON export for trade history
 *
 * Features:
 * - Export trades to CSV/JSON format
 * - Include: timestamp, strategy, market, side, size, entry/exit, P&L, fees
 * - Date range filtering
 *
 * @module core
 */

import { TradeRecord } from './strategy-performance-tracker';

export interface ExportOptions {
  format: 'csv' | 'json';
  startDate?: Date;
  endDate?: Date;
  strategyId?: string;
  includeClosedOnly?: boolean;
}

export interface ExportedTrade {
  timestamp: string;
  strategyId: string;
  market: string;
  side: string;
  size: number;
  entryPrice: number;
  exitPrice?: number;
  pnl?: number;
  fees: number;
  status: string;
  holdingPeriod?: string;
}

const CSV_HEADERS = [
  'timestamp',
  'strategyId',
  'market',
  'side',
  'size',
  'entryPrice',
  'exitPrice',
  'pnl',
  'fees',
  'status',
  'holdingPeriod',
].join(',');

export class TradeHistoryExporter {
  /**
   * Export trades to specified format
   */
  export(trades: TradeRecord[], options: ExportOptions): string {
    const filtered = this.filterTrades(trades, options);
    const formatted = this.formatTrades(filtered);

    return options.format === 'csv'
      ? this.toCsv(formatted)
      : this.toJson(formatted);
  }

  /**
   * Filter trades by date range and strategy
   */
  private filterTrades(trades: TradeRecord[], options: ExportOptions): TradeRecord[] {
    let filtered = [...trades];

    if (options.strategyId) {
      filtered = filtered.filter(t => t.strategyId === options.strategyId);
    }

    if (options.startDate) {
      filtered = filtered.filter(t => t.timestamp >= options.startDate!.getTime());
    }

    if (options.endDate) {
      filtered = filtered.filter(t => t.timestamp <= options.endDate!.getTime());
    }

    if (options.includeClosedOnly) {
      filtered = filtered.filter(t => t.status === 'CLOSED');
    }

    return filtered;
  }

  /**
   * Format trades for export
   */
  private formatTrades(trades: TradeRecord[]): ExportedTrade[] {
    return trades.map(t => ({
      timestamp: new Date(t.timestamp).toISOString(),
      strategyId: t.strategyId,
      market: t.market,
      side: t.side,
      size: t.size,
      entryPrice: t.entryPrice,
      exitPrice: t.exitPrice,
      pnl: t.pnl,
      fees: t.fees,
      status: t.status,
      holdingPeriod: t.status === 'CLOSED' && t.exitPrice !== undefined
        ? this.formatHoldingPeriod(t.timestamp, t.exitPrice)
        : undefined,
    }));
  }

  /**
   * Calculate holding period for closed trades
   */
  private formatHoldingPeriod(entryTime: number, exitPrice: number): string {
    // For simplicity, return duration in hours
    const now = Date.now();
    const hours = (now - entryTime) / (1000 * 60 * 60);
    return hours.toFixed(2) + 'h';
  }

  /**
   * Convert to CSV format
   */
  private toCsv(trades: ExportedTrade[]): string {
    const rows = trades.map(t =>
      [
        t.timestamp,
        t.strategyId,
        t.market,
        t.side,
        t.size.toFixed(8),
        t.entryPrice.toFixed(4),
        t.exitPrice?.toFixed(4) ?? '',
        t.pnl?.toFixed(2) ?? '',
        t.fees.toFixed(4),
        t.status,
        t.holdingPeriod ?? '',
      ].join(',')
    );

    return [CSV_HEADERS, ...rows].join('\n');
  }

  /**
   * Convert to JSON format
   */
  private toJson(trades: ExportedTrade[]): string {
    return JSON.stringify(trades, null, 2);
  }

  /**
   * Export directly to file (Node.js environment)
   */
  async exportToFile(
    trades: TradeRecord[],
    filePath: string,
    options: ExportOptions
  ): Promise<void> {
    const content = this.export(trades, options);

    try {
      const fs = await import('fs');
      await fs.promises.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`TradeHistoryExporter: Failed to write file - ${error}`);
    }
  }

  /**
   * Generate summary statistics for exported trades
   */
  generateSummary(trades: TradeRecord[]): ExportSummary {
    const closedTrades = trades.filter(t => t.status === 'CLOSED');
    const openTrades = trades.filter(t => t.status === 'OPEN');

    const wins = closedTrades.filter(t => (t.pnl ?? 0) > 0);
    const losses = closedTrades.filter(t => (t.pnl ?? 0) <= 0);

    const totalPnl = closedTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const totalFees = trades.reduce((s, t) => s + t.fees, 0);
    const totalVolume = trades.reduce((s, t) => s + t.size * t.entryPrice, 0);

    return {
      totalTrades: trades.length,
      closedTrades: closedTrades.length,
      openTrades: openTrades.length,
      wins: wins.length,
      losses: losses.length,
      winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
      totalPnl,
      totalFees,
      totalVolume,
      avgTradeSize: totalVolume / trades.length,
      largestWin: wins.length > 0 ? Math.max(...wins.map(t => t.pnl ?? 0)) : 0,
      largestLoss: losses.length > 0 ? Math.min(...losses.map(t => t.pnl ?? 0)) : 0,
    };
  }
}

export interface ExportSummary {
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  totalFees: number;
  totalVolume: number;
  avgTradeSize: number;
  largestWin: number;
  largestLoss: number;
}
