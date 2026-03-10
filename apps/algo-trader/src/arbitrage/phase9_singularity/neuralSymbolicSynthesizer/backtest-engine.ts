/**
 * Backtest Engine — executes a strategy AST against historical OHLCV data.
 * Computes Sharpe ratio, max drawdown, and total profit.
 * Uses a simple signal → equity-curve simulation (no fractional shares).
 */

import { AstNode } from './grammar';

export interface HistoricalDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap: number;
}

export interface BacktestResult {
  sharpeRatio: number;
  maxDrawdown: number; // 0..1 (fraction of peak equity lost)
  totalProfit: number; // absolute P&L in quote currency
  totalTrades: number;
  winRate: number; // 0..1
  durationMs: number;
}

export interface BacktestEngineConfig {
  initialCapital: number;
  positionSizeFraction: number; // fraction of capital per trade
  commissionBps: number; // basis points per side
  riskFreeRateAnnual: number; // for Sharpe denominator
}

const DEFAULT_CONFIG: BacktestEngineConfig = {
  initialCapital: 100_000,
  positionSizeFraction: 0.1,
  commissionBps: 5,
  riskFreeRateAnnual: 0.04,
};

// ── AST Evaluator ─────────────────────────────────────────────────────────────

/** Evaluate an AST node against a bar and a simple indicator cache. */
function evalNode(node: AstNode, bar: HistoricalDataPoint, bars: HistoricalDataPoint[], idx: number): number {
  switch (node.type) {
    case 'price': {
      const lag = Math.min(node.lag, idx);
      const b = bars[idx - lag];
      return b ? b[node.field] : bar.close;
    }
    case 'indicator': {
      const period = Math.max(1, node.period);
      const slice = bars.slice(Math.max(0, idx - period + 1), idx + 1).map((b) => b.close);
      if (node.name === 'sma') return slice.reduce((s, v) => s + v, 0) / slice.length;
      if (node.name === 'ema') {
        const k = 2 / (slice.length + 1);
        return slice.reduce((ema, v) => v * k + ema * (1 - k), slice[0]);
      }
      if (node.name === 'rsi') {
        if (slice.length < 2) return 50;
        let gains = 0, losses = 0;
        for (let i = 1; i < slice.length; i++) {
          const d = slice[i] - slice[i - 1];
          if (d > 0) gains += d; else losses -= d;
        }
        return losses === 0 ? 100 : 100 - 100 / (1 + gains / losses);
      }
      if (node.name === 'macd') {
        const fast = slice.slice(-Math.min(12, slice.length)).reduce((s, v) => s + v, 0) / Math.min(12, slice.length);
        const slow = slice.reduce((s, v) => s + v, 0) / slice.length;
        return fast - slow;
      }
      // atr: average of high-low range
      const atrBars = bars.slice(Math.max(0, idx - period + 1), idx + 1);
      return atrBars.reduce((s, b) => s + (b.high - b.low), 0) / atrBars.length;
    }
    case 'binary': {
      const l = evalNode(node.left, bar, bars, idx);
      const r = evalNode(node.right, bar, bars, idx);
      switch (node.op) {
        case '+': return l + r;
        case '-': return l - r;
        case '*': return l * r;
        case '/': return r === 0 ? 0 : l / r;
        case '>': return l > r ? 1 : 0;
        case '<': return l < r ? 1 : 0;
        case '>=': return l >= r ? 1 : 0;
        case '<=': return l <= r ? 1 : 0;
        case '==': return l === r ? 1 : 0;
        default: return 0;
      }
    }
    case 'unary': {
      const v = evalNode(node.operand, bar, bars, idx);
      if (node.op === 'neg') return -v;
      if (node.op === 'abs') return Math.abs(v);
      if (node.op === 'log') return v > 0 ? Math.log(v) : 0;
      return v;
    }
    case 'condition': {
      const t = evalNode(node.test, bar, bars, idx);
      return t !== 0
        ? evalNode(node.consequent, bar, bars, idx)
        : evalNode(node.alternate, bar, bars, idx);
    }
  }
}

// ── BacktestEngine class ──────────────────────────────────────────────────────

export class BacktestEngine {
  private readonly cfg: BacktestEngineConfig;
  private data: HistoricalDataPoint[] = [];

  constructor(config: Partial<BacktestEngineConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  loadData(data: HistoricalDataPoint[]): void {
    this.data = [...data];
  }

  run(strategy: AstNode): BacktestResult {
    if (this.data.length < 2) {
      return { sharpeRatio: 0, maxDrawdown: 0, totalProfit: 0, totalTrades: 0, winRate: 0, durationMs: 0 };
    }

    const start = Date.now();
    const commFraction = this.cfg.commissionBps / 10_000;
    let equity = this.cfg.initialCapital;
    let peakEquity = equity;
    let maxDrawdown = 0;
    let position = 0; // +1 long, -1 short, 0 flat
    let entryPrice = 0;
    const returns: number[] = [];
    let wins = 0;
    let trades = 0;

    for (let i = 1; i < this.data.length; i++) {
      const bar = this.data[i];
      const signal = evalNode(strategy, bar, this.data, i);

      const desiredPos = signal > 0 ? 1 : signal < 0 ? -1 : 0;

      if (desiredPos !== position) {
        // Close existing position
        if (position !== 0) {
          const pnl = position * (bar.close - entryPrice) * this.cfg.positionSizeFraction * equity / entryPrice;
          const comm = Math.abs(bar.close) * commFraction * this.cfg.positionSizeFraction * equity / entryPrice;
          const net = pnl - comm;
          equity += net;
          if (net > 0) wins++;
          trades++;
          returns.push(net / (equity - net || 1));
        }
        // Open new position
        if (desiredPos !== 0) {
          entryPrice = bar.close;
          const comm = entryPrice * commFraction * this.cfg.positionSizeFraction * equity / entryPrice;
          equity -= comm;
        }
        position = desiredPos;
      }

      peakEquity = Math.max(peakEquity, equity);
      const dd = peakEquity > 0 ? (peakEquity - equity) / peakEquity : 0;
      maxDrawdown = Math.max(maxDrawdown, dd);
    }

    // Close final position
    if (position !== 0 && this.data.length > 0) {
      const lastBar = this.data[this.data.length - 1];
      const pnl = position * (lastBar.close - entryPrice) * this.cfg.positionSizeFraction * equity / entryPrice;
      equity += pnl;
      trades++;
      returns.push(pnl / (equity - pnl || 1));
    }

    const sharpeRatio = this.computeSharpe(returns);
    return {
      sharpeRatio,
      maxDrawdown,
      totalProfit: equity - this.cfg.initialCapital,
      totalTrades: trades,
      winRate: trades > 0 ? wins / trades : 0,
      durationMs: Date.now() - start,
    };
  }

  private computeSharpe(returns: number[]): number {
    if (returns.length < 2) return 0;
    const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
    const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (returns.length - 1);
    const std = Math.sqrt(variance);
    if (std === 0) return 0;
    const dailyRf = this.cfg.riskFreeRateAnnual / 252;
    return ((mean - dailyRf) / std) * Math.sqrt(252);
  }
}
