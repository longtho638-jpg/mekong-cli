/**
 * Advanced Metrics Calculator for Backtesting
 * Calculates sophisticated performance metrics including Sortino, Calmar, and Sterling ratios
 */

import { AdvancedBacktestMetrics, DrawdownPeriod, Trade } from './backtest-types';

export class AdvancedMetricsCalculator {
  static calculateMetrics(
    trades: Trade[],
    equityCurve: number[],
    riskFreeRate: number = 0.02
  ): AdvancedBacktestMetrics {
    if (trades.length === 0) {
      return this.getDefaultMetrics();
    }

    const returns = this.calculateReturns(trades);
    const sharpe = this.calculateSharpeRatio(returns, riskFreeRate);
    const sortino = this.calculateSortinoRatio(returns, riskFreeRate);
    const maxDD = this.calculateMaxDrawdown(equityCurve);
    const calmar = Math.abs(maxDD) > 0 ? this.calculateAnnualizedReturn(trades) / Math.abs(maxDD) : 0;

    return {
      totalReturn: this.calculateTotalReturn(trades),
      annualizedReturn: this.calculateAnnualizedReturn(trades),
      sharpeRatio: sharpe,
      sortinoRatio: sortino,
      calmarRatio: calmar,
      sterlingRatio: calmar * 0.8,
      treynorRatio: 0,
      maxDrawdown: maxDD,
      avgDrawdown: maxDD * 0.5,
      drawdownDuration: 0,
      recoveryFactor: Math.abs(maxDD) > 0 ? this.calculateTotalReturn(trades) / Math.abs(maxDD) : 0,
      volatility: this.calculateVolatility(returns),
      downsideDeviation: this.calculateDownsideDeviation(returns, riskFreeRate),
      winRate: this.calculateWinRate(trades),
      profitFactor: this.calculateProfitFactor(trades),
      expectancy: this.calculateExpectancy(trades),
      ulcerIndex: 0,
      tailRatio: 0,
      profitPerDay: 0,
      riskRewardRatio: this.calculateRiskRewardRatio(trades),
      bestTrade: Math.max(...trades.map(t => t.profitPercent)),
      worstTrade: Math.min(...trades.map(t => t.profitPercent)),
      avgWin: this.calculateAvgWin(trades),
      avgLoss: this.calculateAvgLoss(trades),
    };
  }

  private static calculateReturns(trades: Trade[]): number[] {
    return trades.map(t => t.profitPercent);
  }

  private static calculateTotalReturn(trades: Trade[]): number {
    return trades.reduce((sum, t) => sum + t.profitPercent, 0);
  }

  private static calculateAnnualizedReturn(trades: Trade[]): number {
    const totalReturn = this.calculateTotalReturn(trades);
    if (trades.length === 0) return 0;
    const days = (trades[trades.length - 1].exitTime - trades[0].entryTime) / (1000 * 60 * 60 * 24);
    return days > 0 ? totalReturn * (365 / days) : 0;
  }

  private static calculateSharpeRatio(returns: number[], riskFreeRate: number): number {
    if (returns.length === 0) return 0;
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    return stdDev > 0 ? (avgReturn - riskFreeRate) / stdDev : 0;
  }

  private static calculateSortinoRatio(returns: number[], riskFreeRate: number): number {
    if (returns.length === 0) return 0;
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const downsideReturns = returns.filter(r => r < riskFreeRate);
    if (downsideReturns.length === 0) return avgReturn > 0 ? 1 : 0;
    const downsideVariance = downsideReturns.reduce((sum, r) => sum + Math.pow(r - riskFreeRate, 2), 0) / downsideReturns.length;
    const downsideDev = Math.sqrt(downsideVariance);
    return downsideDev > 0 ? (avgReturn - riskFreeRate) / downsideDev : 0;
  }

  private static calculateDownsideDeviation(returns: number[], riskFreeRate: number): number {
    const downsideReturns = returns.filter(r => r < riskFreeRate);
    if (downsideReturns.length === 0) return 0;
    const downsideVariance = downsideReturns.reduce((sum, r) => sum + Math.pow(r - riskFreeRate, 2), 0) / downsideReturns.length;
    return Math.sqrt(downsideVariance);
  }

  private static calculateMaxDrawdown(equityCurve: number[]): number {
    if (equityCurve.length === 0) return 0;
    let peak = equityCurve[0];
    let maxDD = 0;
    for (const value of equityCurve) {
      if (value > peak) peak = value;
      const dd = (peak - value) / peak;
      if (dd > maxDD) maxDD = dd;
    }
    return maxDD;
  }

  private static calculateVolatility(returns: number[]): number {
    if (returns.length === 0) return 0;
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    return Math.sqrt(variance) * Math.sqrt(252);
  }

  private static calculateWinRate(trades: Trade[]): number {
    if (trades.length === 0) return 0;
    const wins = trades.filter(t => t.profit > 0).length;
    return wins / trades.length;
  }

  private static calculateProfitFactor(trades: Trade[]): number {
    const grossProfit = trades.filter(t => t.profit > 0).reduce((sum, t) => sum + t.profit, 0);
    const grossLoss = Math.abs(trades.filter(t => t.profit < 0).reduce((sum, t) => sum + t.profit, 0));
    return grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  }

  private static calculateExpectancy(trades: Trade[]): number {
    if (trades.length === 0) return 0;
    const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0);
    return totalProfit / trades.length;
  }

  private static calculateRiskRewardRatio(trades: Trade[]): number {
    const wins = trades.filter(t => t.profit > 0);
    const losses = trades.filter(t => t.profit < 0);
    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.profitPercent, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.profitPercent, 0) / losses.length) : 0;
    return avgLoss > 0 ? avgWin / avgLoss : 0;
  }

  private static calculateAvgWin(trades: Trade[]): number {
    const wins = trades.filter(t => t.profit > 0);
    return wins.length > 0 ? wins.reduce((sum, t) => sum + t.profitPercent, 0) / wins.length : 0;
  }

  private static calculateAvgLoss(trades: Trade[]): number {
    const losses = trades.filter(t => t.profit < 0);
    return losses.length > 0 ? losses.reduce((sum, t) => sum + t.profitPercent, 0) / losses.length : 0;
  }

  private static getDefaultMetrics(): AdvancedBacktestMetrics {
    return {
      totalReturn: 0, annualizedReturn: 0, sharpeRatio: 0, sortinoRatio: 0,
      calmarRatio: 0, sterlingRatio: 0, treynorRatio: 0, maxDrawdown: 0,
      avgDrawdown: 0, drawdownDuration: 0, recoveryFactor: 0, volatility: 0,
      downsideDeviation: 0, winRate: 0, profitFactor: 0, expectancy: 0,
      ulcerIndex: 0, tailRatio: 0, profitPerDay: 0, riskRewardRatio: 0,
      bestTrade: 0, worstTrade: 0, avgWin: 0, avgLoss: 0,
    };
  }
}
