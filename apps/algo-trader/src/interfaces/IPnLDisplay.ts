/**
 * IPnLDisplay — Interface definitions for P&L display components
 *
 * @module interfaces
 */

/**
 * Terminal color codes for P&L display
 */
export enum TerminalColor {
  Green = 'green',
  Red = 'red',
  Yellow = 'yellow',
  White = 'white',
  Cyan = 'cyan',
  Blue = 'blue',
}

/**
 * P&L display row for a single position
 */
export interface PnLRow {
  positionId: string;
  tokenId: string;
  marketId: string;
  side: 'YES' | 'NO';
  size: number;
  avgPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  totalPnl: number;
  openedAt: number;
}

/**
 * Per-strategy P&L breakdown
 */
export interface StrategyPnL {
  strategyName: string;
  totalPnl: number;
  realizedPnl: number;
  unrealizedPnl: number;
  positionCount: number;
  winRate: number;
}

/**
 * Daily P&L snapshot
 */
export interface DailyPnL {
  date: string;           // YYYY-MM-DD
  openingBalance: number;
  closingBalance: number;
  dailyPnl: number;
  tradesExecuted: number;
  winCount: number;
  lossCount: number;
}

/**
 * Portfolio summary for display
 */
export interface PnLDisplaySummary {
  totalPnl: number;
  realizedPnl: number;
  unrealizedPnl: number;
  dailyPnl: number;
  totalExposure: number;
  positionCount: number;
  strategies: StrategyPnL[];
}

/**
 * Configuration for live display
 */
export interface PnLDisplayConfig {
  refreshIntervalMs: number;    // 1000-2000 recommended
  showPositionDetails: boolean;
  showStrategyBreakdown: boolean;
  showDailyPnl: boolean;
  currency: string;             // 'USD' default
}
