/**
 * Metrics Collector for Historical Backtesting
 * Records trades and computes comprehensive performance metrics
 */

import { Trade } from '../../backtest/backtest-types';
import { EquityPoint } from './state-manager';

export interface BacktestMetricsReport {
  dailyReturns: Map<string, number>;
  monthlyReturns: Map<string, number>;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  maxDrawdown: number;
  maxDrawdownDuration: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  totalTrades: number;
  totalPnl: number;
  exposureByAsset: Map<string, number>;
  exposureByExchange: Map<string, number>;
}

export class MetricsCollector {
  private trades: Trade[] = [];
  private equityPoints: EquityPoint[] = [];
  private riskFreeRate: number;

  constructor(riskFreeRate: number) {
    this.riskFreeRate = riskFreeRate;
  }

  recordTrade(trade: Trade): void {
    this.trades.push(trade);
  }

  getTrades(): Trade[] {
    return [...this.trades];
  }

  recordEquityPoint(point: EquityPoint): void {
    this.equityPoints.push(point);
  }

  getDailyReturns(): Map<string, number> {
    return this.aggregateReturns('day');
  }

  getMonthlyReturns(): Map<string, number> {
    return this.aggregateReturns('month');
  }

  computeMetrics(): BacktestMetricsReport {
    const equityCurve = this.equityPoints.map(p => p.equity);
    const dailyReturns = this.getDailyReturns();
    const monthlyReturns = this.getMonthlyReturns();
    const returns = Array.from(dailyReturns.values());

    const maxDrawdown = this.computeMaxDrawdown(equityCurve);
    const maxDrawdownDuration = this.computeMaxDrawdownDuration(equityCurve);
    const sharpeRatio = this.computeSharpe(returns);
    const sortinoRatio = this.computeSortino(returns);
    const annualReturn = this.computeAnnualizedReturn();
    const calmarRatio = maxDrawdown > 0 ? annualReturn / maxDrawdown : 0;

    const wins = this.trades.filter(t => t.profit > 0);
    const losses = this.trades.filter(t => t.profit < 0);
    const winRate = this.trades.length > 0 ? wins.length / this.trades.length : 0;
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.profitPercent, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + t.profitPercent, 0) / losses.length : 0;
    const grossProfit = wins.reduce((s, t) => s + t.profit, 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.profit, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
    const totalPnl = this.trades.reduce((s, t) => s + t.profit, 0);

    return {
      dailyReturns,
      monthlyReturns,
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      maxDrawdown,
      maxDrawdownDuration,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      totalTrades: this.trades.length,
      totalPnl,
      exposureByAsset: new Map(),
      exposureByExchange: new Map(),
    };
  }

  private aggregateReturns(period: 'day' | 'month'): Map<string, number> {
    const map = new Map<string, number>();
    if (this.equityPoints.length < 2) return map;

    for (let i = 1; i < this.equityPoints.length; i++) {
      const prev = this.equityPoints[i - 1];
      const curr = this.equityPoints[i];
      const ret = prev.equity > 0 ? (curr.equity - prev.equity) / prev.equity : 0;
      const d = new Date(curr.timestamp);
      const key = period === 'day'
        ? `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
        : `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      map.set(key, (map.get(key) ?? 0) + ret);
    }
    return map;
  }

  private computeMaxDrawdown(equityCurve: number[]): number {
    if (equityCurve.length === 0) return 0;
    let peak = equityCurve[0];
    let maxDD = 0;
    for (const v of equityCurve) {
      if (v > peak) peak = v;
      const dd = peak > 0 ? (peak - v) / peak : 0;
      if (dd > maxDD) maxDD = dd;
    }
    return maxDD;
  }

  private computeMaxDrawdownDuration(equityCurve: number[]): number {
    if (equityCurve.length === 0) return 0;
    let peak = equityCurve[0];
    let drawdownStart = 0;
    let maxDuration = 0;
    for (let i = 1; i < equityCurve.length; i++) {
      if (equityCurve[i] > peak) {
        peak = equityCurve[i];
        drawdownStart = i;
      } else {
        maxDuration = Math.max(maxDuration, i - drawdownStart);
      }
    }
    return maxDuration;
  }

  private computeSharpe(returns: number[]): number {
    if (returns.length === 0) return 0;
    const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((s, r) => s + Math.pow(r - avg, 2), 0) / returns.length;
    const std = Math.sqrt(variance);
    const dailyRfr = this.riskFreeRate / 252;
    return std > 0 ? ((avg - dailyRfr) / std) * Math.sqrt(252) : 0;
  }

  private computeSortino(returns: number[]): number {
    if (returns.length === 0) return 0;
    const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
    const dailyRfr = this.riskFreeRate / 252;
    const downside = returns.filter(r => r < dailyRfr);
    if (downside.length === 0) return avg > 0 ? 1 : 0;
    const downVar = downside.reduce((s, r) => s + Math.pow(r - dailyRfr, 2), 0) / downside.length;
    const downStd = Math.sqrt(downVar);
    return downStd > 0 ? ((avg - dailyRfr) / downStd) * Math.sqrt(252) : 0;
  }

  private computeAnnualizedReturn(): number {
    if (this.equityPoints.length < 2) return 0;
    const first = this.equityPoints[0];
    const last = this.equityPoints[this.equityPoints.length - 1];
    const totalReturn = first.equity > 0 ? (last.equity - first.equity) / first.equity : 0;
    const days = (last.timestamp - first.timestamp) / (1000 * 60 * 60 * 24);
    return days > 0 ? totalReturn * (365 / days) : 0;
  }
}
