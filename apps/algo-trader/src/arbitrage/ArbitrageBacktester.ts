/**
 * ArbitrageBacktester — Backtest cross-exchange arbitrage strategies.
 * Simulates arbitrage execution against historical price snapshots
 * from multiple exchanges, tracking P&L, fees, and slippage.
 *
 * Input: array of MultiExchangePriceSnapshot (simulated price data)
 * Output: BacktestResult with trades, metrics, equity curve
 */

import { FeeCalculator } from './FeeCalculator';
import { logger } from '../utils/logger';

export interface ExchangePricePoint {
  exchange: string;
  price: number;
}

export interface MultiExchangePriceSnapshot {
  symbol: string;
  timestamp: number;
  prices: ExchangePricePoint[];  // Price on each exchange at this moment
}

export interface BacktestTradeRecord {
  id: number;
  timestamp: number;
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  amount: number;
  grossProfitUsd: number;
  feesUsd: number;
  slippageCostUsd: number;
  netProfitUsd: number;
  equityAfter: number;
}

export interface EquityPoint {
  timestamp: number;
  equity: number;
  drawdownPercent: number;
}

export interface BacktestResult {
  config: BacktestConfig;
  trades: BacktestTradeRecord[];
  equityCurve: EquityPoint[];
  metrics: BacktestMetrics;
}

export interface BacktestMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfitUsd: number;
  totalFeesUsd: number;
  netProfitUsd: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  profitFactor: number;
  avgTradeUsd: number;
  avgWinUsd: number;
  avgLossUsd: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  returnOnCapital: number;     // Net profit / initial capital
}

export interface BacktestConfig {
  initialCapitalUsd: number;    // Starting capital (default: 10000)
  positionSizeUsd: number;      // USD per trade (default: 1000)
  minSpreadPercent: number;     // Min spread to trigger trade (default: 0.1%)
  slippageBps: number;          // Simulated slippage per side (default: 5)
  cooldownMs: number;           // Min ms between trades (default: 5000)
  maxDailyLossUsd: number;      // Stop trading if daily loss exceeds (default: 200)
  useFeeCalculator: boolean;    // Use FeeCalculator for accurate fees (default: true)
  flatFeeRate: number;          // Fallback flat fee rate per side (default: 0.001)
}

const DEFAULT_CONFIG: BacktestConfig = {
  initialCapitalUsd: 10000,
  positionSizeUsd: 1000,
  minSpreadPercent: 0.1,
  slippageBps: 5,
  cooldownMs: 5000,
  maxDailyLossUsd: 200,
  useFeeCalculator: true,
  flatFeeRate: 0.001,
};

export class ArbitrageBacktester {
  private config: BacktestConfig;
  private feeCalculator: FeeCalculator;

  constructor(config?: Partial<BacktestConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.feeCalculator = new FeeCalculator();
  }

  /**
   * Run backtest against historical price snapshots.
   */
  run(snapshots: MultiExchangePriceSnapshot[]): BacktestResult {
    if (snapshots.length === 0) {
      return this.emptyResult();
    }

    // Sort by timestamp
    const sorted = [...snapshots].sort((a, b) => a.timestamp - b.timestamp);

    let equity = this.config.initialCapitalUsd;
    let peakEquity = equity;
    let maxDrawdownPercent = 0;
    let dailyPnL = 0;
    let lastTradeDay = -1;
    let lastTradeTime = 0;
    let tradeId = 0;

    const trades: BacktestTradeRecord[] = [];
    const equityCurve: EquityPoint[] = [
      { timestamp: sorted[0].timestamp, equity, drawdownPercent: 0 },
    ];

    for (const snapshot of sorted) {
      if (snapshot.prices.length < 2) continue;

      // Reset daily P&L at day boundary
      const day = Math.floor(snapshot.timestamp / 86400000);
      if (day !== lastTradeDay) {
        dailyPnL = 0;
        lastTradeDay = day;
      }

      // Skip if daily loss limit hit
      if (dailyPnL <= -this.config.maxDailyLossUsd) continue;

      // Cooldown check
      if (snapshot.timestamp - lastTradeTime < this.config.cooldownMs) continue;

      // Find best arbitrage opportunity in this snapshot
      const opp = this.findBestOpportunity(snapshot);
      if (!opp) continue;

      // Check if spread meets minimum
      if (opp.spreadPercent < this.config.minSpreadPercent) continue;

      // Check if we have enough capital
      if (equity < this.config.positionSizeUsd) continue;

      // Simulate execution
      const positionSize = Math.min(this.config.positionSizeUsd, equity);
      const amount = positionSize / opp.buyPrice;

      // Calculate fees
      let feesUsd: number;
      if (this.config.useFeeCalculator) {
        const feeReport = this.feeCalculator.calculateArbitrageFees(
          opp.buyExchange, opp.sellExchange, snapshot.symbol,
          opp.buyPrice, opp.sellPrice, amount
        );
        feesUsd = feeReport.totalFeesUsd;
      } else {
        feesUsd = positionSize * this.config.flatFeeRate * 2;
      }

      // Calculate slippage cost
      const slippageCostUsd = positionSize * (this.config.slippageBps / 10000) * 2;

      // Calculate P&L
      const grossProfitUsd = (opp.sellPrice - opp.buyPrice) * amount;
      const netProfitUsd = grossProfitUsd - feesUsd - slippageCostUsd;

      // Only take profitable trades after costs
      if (netProfitUsd <= 0) continue;

      equity += netProfitUsd;
      dailyPnL += netProfitUsd;
      lastTradeTime = snapshot.timestamp;

      // Track drawdown
      if (equity > peakEquity) peakEquity = equity;
      const drawdownPercent = peakEquity > 0 ? ((peakEquity - equity) / peakEquity) * 100 : 0;
      if (drawdownPercent > maxDrawdownPercent) maxDrawdownPercent = drawdownPercent;

      trades.push({
        id: ++tradeId,
        timestamp: snapshot.timestamp,
        symbol: snapshot.symbol,
        buyExchange: opp.buyExchange,
        sellExchange: opp.sellExchange,
        buyPrice: opp.buyPrice,
        sellPrice: opp.sellPrice,
        amount,
        grossProfitUsd,
        feesUsd,
        slippageCostUsd,
        netProfitUsd,
        equityAfter: equity,
      });

      equityCurve.push({
        timestamp: snapshot.timestamp,
        equity,
        drawdownPercent,
      });
    }

    const metrics = this.calculateMetrics(trades, maxDrawdownPercent);

    logger.info(`[ArbBacktest] Complete: ${trades.length} trades, Net P&L: $${metrics.netProfitUsd.toFixed(2)}, Win Rate: ${metrics.winRate.toFixed(1)}%`);

    return {
      config: { ...this.config },
      trades,
      equityCurve,
      metrics,
    };
  }

  /**
   * Find best arbitrage opportunity in a price snapshot.
   */
  private findBestOpportunity(
    snapshot: MultiExchangePriceSnapshot
  ): { buyExchange: string; sellExchange: string; buyPrice: number; sellPrice: number; spreadPercent: number } | null {
    const { prices } = snapshot;
    let bestOpp = null;
    let bestSpread = 0;

    for (let i = 0; i < prices.length; i++) {
      for (let j = i + 1; j < prices.length; j++) {
        const a = prices[i];
        const b = prices[j];

        if (a.price <= 0 || b.price <= 0) continue;

        const spread = Math.abs(a.price - b.price) / Math.min(a.price, b.price) * 100;

        if (spread > bestSpread) {
          bestSpread = spread;
          const buyIdx = a.price < b.price ? i : j;
          const sellIdx = a.price < b.price ? j : i;

          bestOpp = {
            buyExchange: prices[buyIdx].exchange,
            sellExchange: prices[sellIdx].exchange,
            buyPrice: prices[buyIdx].price,
            sellPrice: prices[sellIdx].price,
            spreadPercent: spread,
          };
        }
      }
    }

    return bestOpp;
  }

  /**
   * Calculate performance metrics from trade history.
   */
  private calculateMetrics(trades: BacktestTradeRecord[], maxDrawdownPercent: number): BacktestMetrics {
    if (trades.length === 0) {
      return this.emptyMetrics();
    }

    const wins = trades.filter(t => t.netProfitUsd > 0);
    const losses = trades.filter(t => t.netProfitUsd <= 0);

    const totalProfit = wins.reduce((s, t) => s + t.netProfitUsd, 0);
    const totalLoss = Math.abs(losses.reduce((s, t) => s + t.netProfitUsd, 0));
    const netProfitUsd = totalProfit - totalLoss;
    const totalFeesUsd = trades.reduce((s, t) => s + t.feesUsd, 0);

    // Calculate Sharpe ratio (simplified: daily returns)
    const returns = trades.map(t => t.netProfitUsd / this.config.positionSizeUsd);
    const avgReturn = returns.reduce((s, r) => s + r, 0) / returns.length;
    const stdReturn = Math.sqrt(
      returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / returns.length
    );
    const sharpeRatio = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252) : 0;

    // Consecutive wins/losses
    let maxConsWins = 0, maxConsLosses = 0;
    let curWins = 0, curLosses = 0;
    for (const t of trades) {
      if (t.netProfitUsd > 0) {
        curWins++; curLosses = 0;
        maxConsWins = Math.max(maxConsWins, curWins);
      } else {
        curLosses++; curWins = 0;
        maxConsLosses = Math.max(maxConsLosses, curLosses);
      }
    }

    return {
      totalTrades: trades.length,
      winningTrades: wins.length,
      losingTrades: losses.length,
      winRate: (wins.length / trades.length) * 100,
      totalProfitUsd: totalProfit,
      totalFeesUsd,
      netProfitUsd,
      maxDrawdownPercent,
      sharpeRatio,
      profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0,
      avgTradeUsd: netProfitUsd / trades.length,
      avgWinUsd: wins.length > 0 ? totalProfit / wins.length : 0,
      avgLossUsd: losses.length > 0 ? totalLoss / losses.length : 0,
      maxConsecutiveWins: maxConsWins,
      maxConsecutiveLosses: maxConsLosses,
      returnOnCapital: (netProfitUsd / this.config.initialCapitalUsd) * 100,
    };
  }

  /**
   * Generate simulated cross-exchange price data for testing.
   * Creates realistic price movement with random spreads.
   */
  static generateTestData(params: {
    symbol: string;
    exchanges: string[];
    basePrice: number;
    snapshots: number;
    intervalMs: number;
    volatilityPercent: number;
    spreadRangePercent: [number, number]; // [min, max] spread between exchanges
  }): MultiExchangePriceSnapshot[] {
    const data: MultiExchangePriceSnapshot[] = [];
    let currentPrice = params.basePrice;

    for (let i = 0; i < params.snapshots; i++) {
      // Random walk for base price
      const drift = (Math.random() - 0.5) * 2 * (params.volatilityPercent / 100) * currentPrice;
      currentPrice += drift;

      // Generate per-exchange prices with random spread
      const prices: ExchangePricePoint[] = params.exchanges.map(exchange => {
        const spreadRange = params.spreadRangePercent[1] - params.spreadRangePercent[0];
        const randomSpread = (params.spreadRangePercent[0] + Math.random() * spreadRange) / 100;
        const direction = Math.random() > 0.5 ? 1 : -1;
        return {
          exchange,
          price: currentPrice * (1 + direction * randomSpread),
        };
      });

      data.push({
        symbol: params.symbol,
        timestamp: Date.now() + i * params.intervalMs,
        prices,
      });
    }

    return data;
  }

  /** Get the FeeCalculator instance for configuration */
  getFeeCalculator(): FeeCalculator {
    return this.feeCalculator;
  }

  private emptyResult(): BacktestResult {
    return {
      config: { ...this.config },
      trades: [],
      equityCurve: [],
      metrics: this.emptyMetrics(),
    };
  }

  private emptyMetrics(): BacktestMetrics {
    return {
      totalTrades: 0, winningTrades: 0, losingTrades: 0,
      winRate: 0, totalProfitUsd: 0, totalFeesUsd: 0, netProfitUsd: 0,
      maxDrawdownPercent: 0, sharpeRatio: 0, profitFactor: 0,
      avgTradeUsd: 0, avgWinUsd: 0, avgLossUsd: 0,
      maxConsecutiveWins: 0, maxConsecutiveLosses: 0, returnOnCapital: 0,
    };
  }
}
