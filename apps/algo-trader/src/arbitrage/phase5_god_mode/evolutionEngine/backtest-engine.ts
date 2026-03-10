/**
 * BacktestEngine — simulates strategy performance on synthetic/historical data.
 * Returns Sharpe ratio, max drawdown, and win rate without external calls.
 * SIMULATION MODE ONLY.
 */

import type { Genotype } from './genotype';

export interface BacktestResult {
  strategyId: string;
  sharpeRatio: number;
  maxDrawdown: number; // fraction [0,1]
  winRate: number;     // fraction [0,1]
  totalTrades: number;
  fitness: number;     // composite score
}

/** Synthetic price series using geometric Brownian motion. */
function generatePriceSeries(steps: number, drift = 0.0001, volatility = 0.01): number[] {
  const prices: number[] = [100];
  for (let i = 1; i < steps; i++) {
    const shock = (Math.random() - 0.5) * 2 * volatility;
    prices.push(prices[i - 1] * (1 + drift + shock));
  }
  return prices;
}

/** Compute simple moving average for a window. */
function sma(prices: number[], period: number, idx: number): number {
  if (idx < period - 1) return prices[idx];
  const slice = prices.slice(idx - period + 1, idx + 1);
  return slice.reduce((s, v) => s + v, 0) / slice.length;
}

/**
 * Run a simplified backtest for the given genotype.
 * Uses GBM price series; entry/exit determined by indicator crossover signals.
 */
export class BacktestEngine {
  private readonly steps: number;

  constructor(steps = 500) {
    this.steps = steps;
  }

  /**
   * Backtest a genotype and return performance metrics.
   * @param g - Strategy genotype
   */
  run(g: Genotype): BacktestResult {
    const prices = generatePriceSeries(this.steps);
    const period = Math.min(g.period, this.steps - 1);

    let equity = 100;
    let peak = 100;
    let maxDD = 0;
    let wins = 0;
    let trades = 0;
    let inPosition = false;
    let entryPrice = 0;

    for (let i = period; i < this.steps - 1; i++) {
      const ma = sma(prices, period, i);
      const prevMa = sma(prices, period, i - 1);
      const price = prices[i];

      if (!inPosition) {
        const bullSignal = g.entryCondition === 'crossAbove' ? price > ma && prices[i - 1] <= prevMa : false;
        const bearSignal = g.entryCondition === 'crossBelow' ? price < ma && prices[i - 1] >= prevMa : false;
        const breakout = g.entryCondition === 'breakout' ? price > ma * 1.005 : false;
        const mean = g.entryCondition === 'meanRevert' ? price < ma * 0.995 : false;

        if (bullSignal || bearSignal || breakout || mean) {
          inPosition = true;
          entryPrice = price;
          trades++;
        }
      } else {
        const pnlPct = (price - entryPrice) / entryPrice;
        const tpHit = pnlPct >= (g.riskPercent * g.takeProfitMult) / 100;
        const slHit = pnlPct <= -(g.stopLossPct / 100);

        if (tpHit || slHit) {
          equity *= 1 + pnlPct;
          if (pnlPct > 0) wins++;
          inPosition = false;
          if (equity > peak) peak = equity;
          const dd = (peak - equity) / peak;
          if (dd > maxDD) maxDD = dd;
        }
      }
    }

    const winRate = trades > 0 ? wins / trades : 0;
    // Approximate Sharpe: annualised return / volatility proxy
    const totalReturn = (equity - 100) / 100;
    const annualisedReturn = totalReturn * (252 / (this.steps / 24));
    const vol = g.stopLossPct / 100 * Math.sqrt(252);
    const sharpe = vol > 0 ? annualisedReturn / vol : 0;

    const fitness = Math.max(0, sharpe) * (1 - maxDD) * (winRate + 0.01);

    return {
      strategyId: g.id,
      sharpeRatio: sharpe,
      maxDrawdown: maxDD,
      winRate,
      totalTrades: trades,
      fitness,
    };
  }
}
