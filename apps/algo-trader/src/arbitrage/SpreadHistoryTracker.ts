/**
 * SpreadHistoryTracker — Historical spread analysis for cross-exchange arbitrage.
 * Records spread data over time, detects recurring patterns, calculates
 * mean/stddev/z-score for each exchange pair, identifies optimal trading windows.
 *
 * Used by ArbitrageOrchestrator to make informed decisions about when spreads
 * are unusually wide (good) vs normal (skip).
 */

export interface SpreadRecord {
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  spreadPercent: number;
  timestamp: number;
}

export interface SpreadStats {
  pairKey: string;           // "binance→okx:BTC/USDT"
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  mean: number;              // Mean spread %
  stddev: number;            // Standard deviation
  min: number;
  max: number;
  median: number;
  count: number;
  lastSpread: number;
  lastTimestamp: number;
}

export interface SpreadZScore {
  pairKey: string;
  currentSpread: number;
  mean: number;
  stddev: number;
  zScore: number;            // How many stddev above mean (>2 = unusual opportunity)
  isAnomaly: boolean;        // zScore > anomalyThreshold
}

export interface HourlyPattern {
  hour: number;              // 0-23 UTC
  avgSpread: number;
  tradeCount: number;
  bestSpread: number;
}

export interface SpreadHistoryConfig {
  maxRecordsPerPair: number;     // Max records to keep per pair (default: 1000)
  anomalyThreshold: number;      // Z-score threshold for anomaly (default: 2.0)
  patternWindowHours: number;    // Hours to analyze for hourly pattern (default: 168 = 7 days)
}

const DEFAULT_CONFIG: SpreadHistoryConfig = {
  maxRecordsPerPair: 1000,
  anomalyThreshold: 2.0,
  patternWindowHours: 168,
};

export class SpreadHistoryTracker {
  private config: SpreadHistoryConfig;
  private history: Map<string, SpreadRecord[]> = new Map(); // pairKey → records

  constructor(config?: Partial<SpreadHistoryConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Record a spread observation.
   */
  record(record: SpreadRecord): void {
    const key = this.pairKey(record.buyExchange, record.sellExchange, record.symbol);
    if (!this.history.has(key)) {
      this.history.set(key, []);
    }

    const records = this.history.get(key)!;
    records.push(record);

    // Trim to max size
    if (records.length > this.config.maxRecordsPerPair) {
      records.splice(0, records.length - this.config.maxRecordsPerPair);
    }
  }

  /**
   * Get statistical summary for a specific exchange pair.
   */
  getStats(buyExchange: string, sellExchange: string, symbol: string): SpreadStats {
    const key = this.pairKey(buyExchange, sellExchange, symbol);
    const records = this.history.get(key) || [];

    if (records.length === 0) {
      return this.emptyStats(key, symbol, buyExchange, sellExchange);
    }

    const spreads = records.map(r => r.spreadPercent);
    const sorted = [...spreads].sort((a, b) => a - b);
    const mean = this.mean(spreads);
    const stddev = this.stddev(spreads, mean);
    const last = records[records.length - 1];

    return {
      pairKey: key,
      symbol,
      buyExchange,
      sellExchange,
      mean,
      stddev,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)],
      count: records.length,
      lastSpread: last.spreadPercent,
      lastTimestamp: last.timestamp,
    };
  }

  /**
   * Calculate Z-score for current spread vs historical distribution.
   * Z > 2 means spread is significantly wider than normal → good opportunity.
   */
  getZScore(buyExchange: string, sellExchange: string, symbol: string, currentSpread: number): SpreadZScore {
    const stats = this.getStats(buyExchange, sellExchange, symbol);

    const zScore = stats.stddev > 0
      ? (currentSpread - stats.mean) / stats.stddev
      : 0;

    return {
      pairKey: stats.pairKey,
      currentSpread,
      mean: stats.mean,
      stddev: stats.stddev,
      zScore,
      isAnomaly: zScore >= this.config.anomalyThreshold,
    };
  }

  /**
   * Detect hourly spread patterns (when are spreads typically widest?).
   * Returns distribution of avg spread per UTC hour.
   */
  getHourlyPatterns(buyExchange: string, sellExchange: string, symbol: string): HourlyPattern[] {
    const key = this.pairKey(buyExchange, sellExchange, symbol);
    const records = this.history.get(key) || [];

    const cutoff = Date.now() - this.config.patternWindowHours * 3600000;
    const recent = records.filter(r => r.timestamp >= cutoff);

    // Group by hour
    const hourBuckets: Map<number, number[]> = new Map();
    for (let h = 0; h < 24; h++) {
      hourBuckets.set(h, []);
    }

    for (const r of recent) {
      const hour = new Date(r.timestamp).getUTCHours();
      hourBuckets.get(hour)!.push(r.spreadPercent);
    }

    return Array.from(hourBuckets.entries()).map(([hour, spreads]) => ({
      hour,
      avgSpread: spreads.length > 0 ? this.mean(spreads) : 0,
      tradeCount: spreads.length,
      bestSpread: spreads.length > 0 ? Math.max(...spreads) : 0,
    }));
  }

  /**
   * Get top N hours with widest average spreads (best trading windows).
   */
  getBestTradingHours(buyExchange: string, sellExchange: string, symbol: string, topN: number = 5): HourlyPattern[] {
    const patterns = this.getHourlyPatterns(buyExchange, sellExchange, symbol);
    return patterns
      .filter(p => p.tradeCount > 0)
      .sort((a, b) => b.avgSpread - a.avgSpread)
      .slice(0, topN);
  }

  /**
   * Get all tracked pair keys.
   */
  getTrackedPairs(): string[] {
    return Array.from(this.history.keys());
  }

  /**
   * Get all stats for all tracked pairs.
   */
  getAllStats(): SpreadStats[] {
    return this.getTrackedPairs().map(key => {
      const records = this.history.get(key)!;
      if (records.length === 0) return null;
      const first = records[0];
      return this.getStats(first.buyExchange, first.sellExchange, first.symbol);
    }).filter((s): s is SpreadStats => s !== null);
  }

  /**
   * Get record count across all pairs.
   */
  getTotalRecords(): number {
    let total = 0;
    for (const records of this.history.values()) {
      total += records.length;
    }
    return total;
  }

  /** Clear all history */
  clear(): void {
    this.history.clear();
  }

  private pairKey(buy: string, sell: string, symbol: string): string {
    return `${buy}→${sell}:${symbol}`;
  }

  private mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((s, v) => s + v, 0) / values.length;
  }

  private stddev(values: number[], mean: number): number {
    if (values.length < 2) return 0;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance);
  }

  private emptyStats(key: string, symbol: string, buy: string, sell: string): SpreadStats {
    return {
      pairKey: key, symbol, buyExchange: buy, sellExchange: sell,
      mean: 0, stddev: 0, min: 0, max: 0, median: 0,
      count: 0, lastSpread: 0, lastTimestamp: 0,
    };
  }
}
