/**
 * live-pnl-display — Real-time terminal UI for P&L monitoring
 *
 * Features:
 * - Auto-refreshing display (1-2 second interval)
 * - Per-position P&L breakdown
 * - Portfolio summary with daily/total P&L
 * - Strategy-level aggregation
 *
 * @module ui
 */

import * as chalk from 'chalk';
import { PortfolioManager, Position, PortfolioSummary } from '../core/PortfolioManager';
import type { PnLDisplayConfig, PnLDisplaySummary, PnLRow, StrategyPnL } from '../interfaces/IPnLDisplay';
import {
  formatCurrency,
  formatPnL,
  formatPercent,
  colorizePnL,
  colorize,
  formatDate,
  formatTime,
  getCurrentUTCDate,
  calculateWinRate,
} from './pnl-formatter';
import { logger } from '../utils/logger';

const DEFAULT_CONFIG: PnLDisplayConfig = {
  refreshIntervalMs: 1000,
  showPositionDetails: true,
  showStrategyBreakdown: true,
  showDailyPnl: true,
  currency: 'USD',
};

export class LivePnLDisplay {
  private portfolioManager: PortfolioManager;
  private config: PnLDisplayConfig;
  private refreshTimer?: NodeJS.Timeout;
  private lastDailyPnl: number = 0;
  private lastUtcDate: string = '';
  private dailyTrades: number = 0;
  private dailyWins: number = 0;

  constructor(portfolioManager: PortfolioManager, config?: Partial<PnLDisplayConfig>) {
    this.portfolioManager = portfolioManager;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.lastUtcDate = getCurrentUTCDate();
  }

  /**
   * Start auto-refreshing display
   */
  start(): void {
    this.render();
    this.refreshTimer = setInterval(() => {
      this.checkDailyReset();
      this.render();
    }, this.config.refreshIntervalMs);
    logger.info('LivePnLDisplay: Started auto-refresh');
  }

  /**
   * Stop auto-refresh
   */
  stop(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
    logger.info('LivePnLDisplay: Stopped');
  }

  /**
   * Check if UTC date changed (reset daily P&L)
   */
  private checkDailyReset(): void {
    const currentUtc = getCurrentUTCDate();
    if (currentUtc !== this.lastUtcDate) {
      this.lastDailyPnl = this.portfolioManager.getTotalPnL();
      this.lastUtcDate = currentUtc;
      this.dailyTrades = 0;
      this.dailyWins = 0;
      logger.info(`LivePnLDisplay: Daily P&L reset for ${currentUtc}`);
    }
  }

  /**
   * Render the full P&L display
   */
  render(): void {
    const summary = this.getDisplaySummary();
    this.printSummary(summary);

    if (this.config.showPositionDetails) {
      this.printPositions();
    }

    if (this.config.showStrategyBreakdown) {
      this.printStrategyBreakdown(summary);
    }
  }

  /**
   * Get computed display summary
   */
  getDisplaySummary(): PnLDisplaySummary {
    const pmSummary = this.portfolioManager.getPortfolioSummary();
    const dailyPnl = pmSummary.totalPnl - this.lastDailyPnl;

    return {
      totalPnl: pmSummary.totalPnl,
      realizedPnl: pmSummary.realizedPnl,
      unrealizedPnl: pmSummary.unrealizedPnl,
      dailyPnl,
      totalExposure: pmSummary.totalExposure,
      positionCount: pmSummary.totalPositions,
      strategies: [], // Placeholder for strategy integration
    };
  }

  /**
   * Print portfolio summary section
   */
  private printSummary(summary: PnLDisplaySummary): void {
    logger.info('');
    logger.info(chalk.bold.cyan('╔════════════════════════════════════════════╗'));
    logger.info(chalk.bold.cyan('║       PORTFOLIO P&L SUMMARY               ║'));
    logger.info(chalk.bold.cyan('╚════════════════════════════════════════════╝'));
    logger.info('');

    const now = new Date();
    logger.info(`${chalk.gray('Time:')} ${formatTime(now.getTime())} UTC | ${formatDate(now.getTime())}`);
    logger.info('');

    // Total P&L (large, prominent)
    const totalLabel = 'Total P&L:';
    const totalValue = formatPnL(summary.totalPnl, '  ');
    logger.info(`${chalk.white(totalLabel)}  ${totalValue}`);

    // Daily P&L
    const dailyLabel = 'Daily P&L:';
    const dailyValue = formatPnL(summary.dailyPnl, '  ');
    logger.info(`${chalk.gray(dailyLabel)}  ${dailyValue}`);

    // Breakdown
    const realizedLabel = 'Realized:';
    const realizedValue = formatPnL(summary.realizedPnl);
    logger.info(`${chalk.gray(`  ${realizedLabel}`)}  ${realizedValue}`);

    const unrealizedLabel = 'Unrealized:';
    const unrealizedValue = formatPnL(summary.unrealizedPnl);
    logger.info(`${chalk.gray(`  ${unrealizedLabel}`)}  ${unrealizedValue}`);

    logger.info(chalk.gray('─────────────────────────────────────'));

    // Exposure & positions
    logger.info(`${chalk.white('Exposure:')}     ${formatCurrency(summary.totalExposure)}`);
    logger.info(`${chalk.white('Positions:')}    ${summary.positionCount}`);
    logger.info('');
  }

  /**
   * Print per-position P&L table
   */
  private printPositions(): void {
    const positions = this.portfolioManager.getOpenPositions();

    if (positions.length === 0) {
      logger.info(chalk.gray('  No open positions'));
      logger.info('');
      return;
    }

    logger.info(chalk.bold.yellow('┌─── POSITIONS ───────────────────────────────────┐'));

    // Header
    logger.info(
      chalk.gray(
        '│ ' +
          'Token'.padEnd(12) +
          ' Side'.padEnd(6) +
          'Size'.padEnd(10) +
          'Entry'.padEnd(10) +
          'Current'.padEnd(10) +
          'P&L'.padEnd(12) +
          ' │'
      )
    );
    logger.info(chalk.gray('├' + '─'.repeat(60) + '┤'));

    // Rows
    for (const pos of positions) {
      const pnl = pos.unrealizedPnl;
      const row =
        '│ ' +
        pos.tokenId.slice(0, 12).padEnd(12) +
        pos.side.padEnd(6) +
        pos.size.toFixed(0).padEnd(10) +
        pos.avgPrice.toFixed(4).padEnd(10) +
        pos.currentPrice.toFixed(4).padEnd(10) +
        colorizePnL(pnl, pnl.toFixed(2).padEnd(12)) +
        ' │';
      logger.info(row);
    }

    logger.info(chalk.gray('└' + '─'.repeat(60) + '┘'));
    logger.info('');
  }

  /**
   * Print per-strategy breakdown (placeholder for future integration)
   */
  private printStrategyBreakdown(summary: PnLDisplaySummary): void {
    if (summary.strategies.length === 0) {
      logger.info(chalk.gray('  No strategy data available'));
      logger.info('');
      return;
    }

    logger.info(chalk.bold.blue('┌─── STRATEGY BREAKDOWN ──────────────────────────┐'));

    // Header
    logger.info(
      chalk.gray(
        '│ ' +
          'Strategy'.padEnd(20) +
          'P&L'.padEnd(14) +
          'Positions'.padEnd(12) +
          'Win Rate'.padEnd(10) +
          ' │'
      )
    );
    logger.info(chalk.gray('├' + '─'.repeat(56) + '┤'));

    // Rows
    for (const strategy of summary.strategies) {
      const row =
        '│ ' +
        strategy.strategyName.slice(0, 20).padEnd(20) +
        formatPnL(strategy.totalPnl).padEnd(14) +
        strategy.positionCount.toString().padEnd(12) +
        formatPercent(strategy.winRate).padEnd(10) +
        ' │';
      logger.info(row);
    }

    logger.info(chalk.gray('└' + '─'.repeat(56) + '┘'));
    logger.info('');
  }

  /**
   * Convert Position to PnLRow for external consumption
   */
  static toPnLRow(position: Position, currency: string = 'USD'): PnLRow {
    return {
      positionId: position.id,
      tokenId: position.tokenId,
      marketId: position.marketId,
      side: position.side,
      size: position.size,
      avgPrice: position.avgPrice,
      currentPrice: position.currentPrice,
      unrealizedPnl: position.unrealizedPnl,
      realizedPnl: position.realizedPnl,
      totalPnl: position.unrealizedPnl + position.realizedPnl,
      openedAt: position.openedAt,
    };
  }

  /**
   * Export for PnLMonitorService integration
   */
  exportSummary(): PnLDisplaySummary {
    return this.getDisplaySummary();
  }
}
