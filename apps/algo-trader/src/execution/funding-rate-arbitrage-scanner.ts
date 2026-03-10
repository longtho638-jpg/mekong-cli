/**
 * Funding Rate Arbitrage Scanner — Tracks perpetual futures funding rates
 * across exchanges and detects profitable cross-exchange differentials.
 *
 * Strategy:
 *  - If exchange A has positive funding (longs pay shorts) and
 *    exchange B has negative funding (shorts pay longs):
 *    → Short on A + Long on B = collect both funding payments.
 *  - Also flags extreme single-exchange rates for mean reversion.
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

export interface FundingRateConfig {
  /** Min absolute rate differential to flag. Default 0.0005 (0.05%) */
  minRateDifferential?: number;
  /** Max age of rate data (ms). Default 60_000 */
  staleThresholdMs?: number;
  /** Scan interval. Default 5000 */
  scanIntervalMs?: number;
}

export interface FundingRateEntry {
  exchange: string;
  symbol: string;
  rate: number;            // e.g. 0.0001 = 0.01% per interval
  nextFundingTime: number;
  updatedAt: number;
}

export interface FundingRateOpportunity {
  symbol: string;
  longExchange: string;    // go long here (lower/negative rate)
  shortExchange: string;   // go short here (higher/positive rate)
  longRate: number;
  shortRate: number;
  rateDifferential: number;
  annualizedReturnPct: number;
  nextFundingTime: number;
  timestamp: number;
}

export interface FundingRateStats {
  totalScans: number;
  opportunitiesFound: number;
  bestDifferential: number;
  activeSymbols: number;
  activeExchanges: number;
}

export class FundingRateArbitrageScanner extends EventEmitter {
  /** rates[symbol] = array of FundingRateEntry (one per exchange) */
  private rates = new Map<string, FundingRateEntry[]>();
  private scanTimer: ReturnType<typeof setInterval> | null = null;
  private readonly config: Required<FundingRateConfig>;

  private stats: FundingRateStats = {
    totalScans: 0,
    opportunitiesFound: 0,
    bestDifferential: 0,
    activeSymbols: 0,
    activeExchanges: 0,
  };

  constructor(config: FundingRateConfig = {}) {
    super();
    this.config = {
      minRateDifferential: config.minRateDifferential ?? 0.0005,
      staleThresholdMs: config.staleThresholdMs ?? 60_000,
      scanIntervalMs: config.scanIntervalMs ?? 5_000,
    };
  }

  /**
   * Feed a funding rate data point from an exchange.
   * Updates existing entry for the exchange:symbol pair, or adds a new one.
   */
  updateRate(
    exchange: string,
    symbol: string,
    rate: number,
    nextFundingTime: number,
  ): void {
    const entries = this.rates.get(symbol) ?? [];
    const idx = entries.findIndex((e) => e.exchange === exchange);
    const entry: FundingRateEntry = {
      exchange,
      symbol,
      rate,
      nextFundingTime,
      updatedAt: Date.now(),
    };

    if (idx >= 0) {
      entries[idx] = entry;
    } else {
      entries.push(entry);
    }

    this.rates.set(symbol, entries);
  }

  /**
   * Run a single scan across all tracked symbols.
   * Returns profitable cross-exchange opportunities.
   */
  scan(): FundingRateOpportunity[] {
    const now = Date.now();
    this.stats.totalScans++;

    const opportunities: FundingRateOpportunity[] = [];
    const activeExchanges = new Set<string>();
    let activeSymbolCount = 0;

    for (const [symbol, entries] of this.rates) {
      // Filter stale entries
      const fresh = entries.filter(
        (e) => now - e.updatedAt < this.config.staleThresholdMs,
      );

      if (fresh.length === 0) continue;
      activeSymbolCount++;
      fresh.forEach((e) => activeExchanges.add(e.exchange));

      // Need at least 2 exchanges for cross-exchange arbitrage
      if (fresh.length < 2) continue;

      // Compare every pair of exchanges for this symbol
      for (let i = 0; i < fresh.length; i++) {
        for (let j = i + 1; j < fresh.length; j++) {
          const a = fresh[i];
          const b = fresh[j];

          const diff = Math.abs(a.rate - b.rate);
          if (diff < this.config.minRateDifferential) continue;

          // The exchange with higher rate = short there (you receive funding)
          // The exchange with lower rate = long there (you pay less / receive more)
          const [shortEntry, longEntry] =
            a.rate > b.rate ? [a, b] : [b, a];

          const annualizedReturnPct =
            this.calculateAnnualizedReturn(diff) * 100;

          const opp: FundingRateOpportunity = {
            symbol,
            longExchange: longEntry.exchange,
            shortExchange: shortEntry.exchange,
            longRate: longEntry.rate,
            shortRate: shortEntry.rate,
            rateDifferential: diff,
            annualizedReturnPct,
            nextFundingTime: Math.min(
              a.nextFundingTime,
              b.nextFundingTime,
            ),
            timestamp: now,
          };

          opportunities.push(opp);
          this.stats.opportunitiesFound++;

          if (diff > this.stats.bestDifferential) {
            this.stats.bestDifferential = diff;
          }

          this.emit('opportunity', opp);
          logger.info(
            `[FundingScanner] Opp: ${symbol} short@${shortEntry.exchange}(${shortEntry.rate}) ` +
            `long@${longEntry.exchange}(${longEntry.rate}) diff=${diff.toFixed(6)} ` +
            `annualized=${annualizedReturnPct.toFixed(2)}%`,
          );
        }
      }
    }

    this.stats.activeSymbols = activeSymbolCount;
    this.stats.activeExchanges = activeExchanges.size;

    return opportunities;
  }

  /**
   * Returns a copy of current funding rate entries grouped by symbol.
   */
  getActiveRates(): Map<string, FundingRateEntry[]> {
    const result = new Map<string, FundingRateEntry[]>();
    for (const [symbol, entries] of this.rates) {
      result.set(symbol, [...entries]);
    }
    return result;
  }

  getStats(): FundingRateStats {
    return { ...this.stats };
  }

  /**
   * Start periodic scanning.
   * @param intervalMs — override config scanIntervalMs if provided
   */
  start(intervalMs?: number): void {
    if (this.scanTimer) return;
    const interval = intervalMs ?? this.config.scanIntervalMs;
    this.scanTimer = setInterval(() => { this.scan(); }, interval);
    this.scanTimer.unref();
    logger.info(`[FundingScanner] Started — interval ${interval}ms`);
  }

  stop(): void {
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = null;
    }
    logger.info('[FundingScanner] Stopped');
  }

  /**
   * Annualize a per-interval funding rate differential.
   * Default: 8h intervals = 3 per day = 1095 per year.
   *
   * @param rateDifferential  e.g. 0.0001 = 0.01% per interval
   * @param fundingIntervalHours  default 8
   * @returns annualized return as a decimal (e.g. 0.1095 = 10.95%)
   */
  calculateAnnualizedReturn(
    rateDifferential: number,
    fundingIntervalHours = 8,
  ): number {
    const intervalsPerYear = (24 / fundingIntervalHours) * 365;
    return rateDifferential * intervalsPerYear;
  }
}
