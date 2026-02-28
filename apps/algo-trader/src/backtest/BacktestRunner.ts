import { IStrategy, SignalType } from '../interfaces/IStrategy';
import { IDataProvider } from '../interfaces/IDataProvider';
import { ICandle } from '../interfaces/ICandle';

import { logger } from '../utils/logger';

export interface BacktestResult {
  strategyName: string;
  initialBalance: number;
  finalBalance: number;
  totalReturn: number;
  maxDrawdown: number;
  totalFees: number;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  avgProfit: number;
  sharpeRatio: number;
}

interface Trade {
  entryPrice: number;
  exitPrice: number;
  entryTime: number;
  exitTime: number;
  profit: number;
  profitPercent: number;
  positionSize: number; // Units traded
  fees: number; // Total fees (entry + exit)
}

export interface BacktestConfig {
  feeRate?: number; // Fee per trade side (default: 0.001 = 0.1%)
  riskPercentage?: number; // % of balance per trade (default: 2)
  slippageBps?: number; // Simulated slippage in basis points (default: 5 = 0.05%)
}

export class BacktestRunner {
  private strategy: IStrategy;
  private dataProvider: IDataProvider;
  private initialBalance: number;
  private balance: number;
  private trades: Trade[] = [];
  private openPosition: { price: number; time: number; size: number } | null = null;
  private feeRate: number;
  private riskPercentage: number;
  private slippageBps: number;
  private peakBalance: number;
  private maxDrawdown = 0;

  constructor(strategy: IStrategy, dataProvider: IDataProvider, initialBalance: number = 10000, config?: BacktestConfig) {
    this.strategy = strategy;
    this.dataProvider = dataProvider;
    this.initialBalance = initialBalance;
    this.balance = initialBalance;
    this.peakBalance = initialBalance;
    this.feeRate = config?.feeRate ?? 0.001;
    this.riskPercentage = config?.riskPercentage ?? 2;
    this.slippageBps = config?.slippageBps ?? 5;
  }

  async run(days: number = 30, silent = false): Promise<BacktestResult> {
    if (!silent) logger.info(`Starting backtest for ${this.strategy.name} over ${days} days...`);

    try {
      const limit = days * 24 * 60;
      const history = await this.dataProvider.getHistory(limit);

      if (history.length === 0) {
        if (!silent) logger.info('No data available for backtest');
        return this.getResults();
      }

      if (!silent) logger.info(`Loaded ${history.length} candles.`);

      await this.strategy.init(history.slice(0, 200));

      for (let i = 200; i < history.length; i++) {
        const candle = history[i];
        const signal = await this.strategy.onCandle(candle);

        if (signal) {
          if (signal.type === SignalType.BUY && !this.openPosition) {
            this.executeBuy(candle);
          } else if (signal.type === SignalType.SELL && this.openPosition) {
            this.executeSell(candle);
          }
        }
      }

      if (!silent) this.printResults();
      return this.getResults();
    } catch (error: unknown) {
      logger.error(`Backtest run error: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /** Get structured results for programmatic use */
  getResults(): BacktestResult {
    const wins = this.trades.filter(t => t.profit > 0).length;
    const totalReturn = ((this.balance - this.initialBalance) / this.initialBalance) * 100;
    const totalFees = this.trades.reduce((s, t) => s + t.fees, 0);
    const avgProfit = this.trades.length > 0
      ? this.trades.reduce((s, t) => s + t.profit, 0) / this.trades.length : 0;

    // Sharpe ratio from trade returns
    const returns = this.trades.map(t => t.profitPercent / 100);
    let sharpe = 0;
    if (returns.length >= 2) {
      const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
      const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (returns.length - 1);
      const std = Math.sqrt(variance);
      if (std > 0) sharpe = (mean * 252 - 0.05) / (std * Math.sqrt(252));
    }

    return {
      strategyName: this.strategy.name,
      initialBalance: this.initialBalance,
      finalBalance: this.balance,
      totalReturn,
      maxDrawdown: this.maxDrawdown,
      totalFees,
      totalTrades: this.trades.length,
      wins,
      losses: this.trades.length - wins,
      winRate: this.trades.length > 0 ? (wins / this.trades.length) * 100 : 0,
      avgProfit,
      sharpeRatio: sharpe,
    };
  }

  private applySlippage(price: number, side: 'buy' | 'sell'): number {
    const slippageMul = this.slippageBps / 10000;
    return side === 'buy' ? price * (1 + slippageMul) : price * (1 - slippageMul);
  }

  private executeBuy(candle: ICandle) {
    const fillPrice = this.applySlippage(candle.close, 'buy');
    const riskAmount = this.balance * (this.riskPercentage / 100);
    const positionSize = riskAmount / fillPrice;
    const fee = positionSize * fillPrice * this.feeRate;

    if (riskAmount <= 0 || positionSize <= 0) return;

    this.balance -= fee; // Deduct entry fee
    this.openPosition = {
      price: fillPrice,
      time: candle.timestamp,
      size: positionSize
    };
  }

  private executeSell(candle: ICandle) {
    if (!this.openPosition) return;

    const entryPrice = this.openPosition.price;
    const exitPrice = this.applySlippage(candle.close, 'sell');
    const size = this.openPosition.size;
    const exitFee = size * exitPrice * this.feeRate;
    const entryFee = size * entryPrice * this.feeRate;
    const totalFees = entryFee + exitFee;
    const grossProfit = (exitPrice - entryPrice) * size;
    const netProfit = grossProfit - exitFee; // Entry fee already deducted
    const profitPercent = (netProfit / (entryPrice * size)) * 100;

    this.trades.push({
      entryPrice,
      exitPrice,
      entryTime: this.openPosition.time,
      exitTime: candle.timestamp,
      profit: netProfit,
      profitPercent,
      positionSize: size,
      fees: totalFees
    });

    this.balance += netProfit;

    // Track max drawdown
    if (this.balance > this.peakBalance) this.peakBalance = this.balance;
    const dd = ((this.peakBalance - this.balance) / this.peakBalance) * 100;
    if (dd > this.maxDrawdown) this.maxDrawdown = dd;

    this.openPosition = null;
  }

  private printResults() {
    const wins = this.trades.filter(t => t.profit > 0).length;
    const losses = this.trades.length - wins;
    const winRate = this.trades.length > 0 ? (wins / this.trades.length) * 100 : 0;
    const totalReturn = ((this.balance - this.initialBalance) / this.initialBalance) * 100;
    const totalFees = this.trades.reduce((sum, t) => sum + t.fees, 0);
    const avgProfit = this.trades.length > 0
      ? this.trades.reduce((sum, t) => sum + t.profit, 0) / this.trades.length
      : 0;

    logger.info('\n--- Backtest Results ---');
    logger.info(`Strategy:        ${this.strategy.name}`);
    logger.info(`Initial Balance: $${this.initialBalance.toFixed(2)}`);
    logger.info(`Final Balance:   $${this.balance.toFixed(2)}`);
    logger.info(`Net Return:      ${totalReturn.toFixed(2)}%`);
    logger.info(`Max Drawdown:    ${this.maxDrawdown.toFixed(2)}%`);
    logger.info(`Total Fees Paid: $${totalFees.toFixed(2)}`);
    logger.info(`Total Trades:    ${this.trades.length}`);
    logger.info(`Wins / Losses:   ${wins} / ${losses}`);
    logger.info(`Win Rate:        ${winRate.toFixed(2)}%`);
    logger.info(`Avg P&L/Trade:   $${avgProfit.toFixed(2)}`);
    logger.info(`Fee Rate:        ${(this.feeRate * 100).toFixed(2)}% | Slippage: ${this.slippageBps}bps | Risk: ${this.riskPercentage}%`);
    logger.info('------------------------\n');
  }
}
