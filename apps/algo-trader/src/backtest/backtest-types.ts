/**
 * Backtest Types and Interfaces
 * Type definitions for backtesting module
 */

export interface AdvancedBacktestMetrics {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  sterlingRatio: number;
  treynorRatio: number;
  maxDrawdown: number;
  avgDrawdown: number;
  drawdownDuration: number;
  recoveryFactor: number;
  volatility: number;
  downsideDeviation: number;
  winRate: number;
  profitFactor: number;
  expectancy: number;
  ulcerIndex: number;
  tailRatio: number;
  profitPerDay: number;
  riskRewardRatio: number;
  bestTrade: number;
  worstTrade: number;
  avgWin: number;
  avgLoss: number;
}

export interface DrawdownPeriod {
  peak: number;
  trough: number;
  start: Date;
  end: Date;
  drawdown: number;
}

export interface Trade {
  entryPrice: number;
  exitPrice: number;
  entryTime: number;
  exitTime: number;
  profit: number;
  profitPercent: number;
  positionSize: number;
  fees: number;
}
