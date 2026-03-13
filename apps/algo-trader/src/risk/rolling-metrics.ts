/**
 * Rolling Metrics — Time-windowed risk-adjusted return calculations.
 *
 * Maintains rolling windows (1h, 24h, 7d) for real-time Sharpe, Sortino, Calmar.
 * Auto-cleanup of old data to prevent memory bloat.
 *
 * @module risk
 */

import { SharpeCalculator, SharpeConfig, SharpeResult } from './sharpe-calculator';

export type RollingWindowType = '1h' | '24h' | '7d';

export interface RollingWindowConfig {
  /** Window duration in milliseconds */
  windowMs: number;
  /** Minimum samples required for valid calculation */
  minSamples: number;
  /** Maximum samples to retain (for memory management) */
  maxSamples: number;
}

export interface RollingMetricsResult {
  /** Window type */
  window: RollingWindowType;
  /** Number of samples in window */
  sampleCount: number;
  /** Sharpe metrics for this window */
  metrics: SharpeResult;
  /** Window start timestamp */
  windowStart: number;
  /** Last update timestamp */
  lastUpdate: number;
}

export interface ReturnEntry {
  /** Return value (as decimal) */
  return: number;
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Optional portfolio value */
  value?: number;
}

const DEFAULT_WINDOWS: Record<RollingWindowType, RollingWindowConfig> = {
  '1h': {
    windowMs: 60 * 60 * 1000, // 1 hour
    minSamples: 5,
    maxSamples: 1000,
  },
  '24h': {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    minSamples: 20,
    maxSamples: 5000,
  },
  '7d': {
    windowMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    minSamples: 50,
    maxSamples: 20000,
  },
};

/**
 * Rolling window metrics calculator for real-time trading.
 * Maintains separate windows for 1h, 24h, and 7d periods.
 */
export class RollingMetrics {
  private windows: Map<RollingWindowType, ReturnEntry[]>;
  private configs: Record<RollingWindowType, RollingWindowConfig>;
  private calculators: Map<RollingWindowType, SharpeCalculator>;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(
    sharpeConfig?: SharpeConfig,
    customWindows?: Partial<Record<RollingWindowType, Partial<RollingWindowConfig>>>
  ) {
    this.windows = new Map([
      ['1h', []],
      ['24h', []],
      ['7d', []],
    ]);

    this.configs = {
      '1h': { ...DEFAULT_WINDOWS['1h'], ...customWindows?.['1h'] },
      '24h': { ...DEFAULT_WINDOWS['24h'], ...customWindows?.['24h'] },
      '7d': { ...DEFAULT_WINDOWS['7d'], ...customWindows?.['7d'] },
    };

    // Create separate calculator for each window (can have different configs if needed)
    this.calculators = new Map([
      ['1h', new SharpeCalculator(sharpeConfig)],
      ['24h', new SharpeCalculator(sharpeConfig)],
      ['7d', new SharpeCalculator(sharpeConfig)],
    ]);
  }

  /**
   * Add a new return entry to all rolling windows.
   * Automatically cleans up old data.
   *
   * @param entry - Return entry with timestamp
   */
  addEntry(entry: ReturnEntry): void {
    const now = Date.now();

    // Add to each window
    for (const [windowType, entries] of this.windows.entries()) {
      entries.push(entry);

      // Cleanup old entries beyond window
      this.cleanupWindow(windowType, now);
    }
  }

  /**
   * Get rolling metrics for a specific window.
   *
   * @param windowType - Window type ('1h', '24h', '7d')
   * @returns Rolling metrics result (or null if insufficient samples)
   */
  getMetrics(windowType: RollingWindowType): RollingMetricsResult | null {
    const entries = this.windows.get(windowType);
    const config = this.configs[windowType];
    const calculator = this.calculators.get(windowType)!;

    if (!entries || entries.length < config.minSamples) {
      return null;
    }

    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Filter entries within window
    const windowEntries = entries.filter(e => e.timestamp >= windowStart);
    const returns = windowEntries.map(e => e.return);
    const values = windowEntries.some(e => e.value !== undefined)
      ? windowEntries.map(e => e.value!)
      : undefined;

    return {
      window: windowType,
      sampleCount: windowEntries.length,
      metrics: calculator.calculate(returns, values),
      windowStart,
      lastUpdate: now,
    };
  }

  /**
   * Get metrics for all windows.
   *
   * @returns Array of rolling metrics results
   */
  getAllMetrics(): RollingMetricsResult[] {
    const results: RollingMetricsResult[] = [];

    for (const windowType of ['1h', '24h', '7d'] as RollingWindowType[]) {
      const metrics = this.getMetrics(windowType);
      if (metrics) {
        results.push(metrics);
      }
    }

    return results;
  }

  /**
   * Get current Sharpe ratio for a specific window.
   *
   * @param windowType - Window type
   * @returns Sharpe ratio (or null if insufficient data)
   */
  getSharpe(windowType: RollingWindowType): number | null {
    const metrics = this.getMetrics(windowType);
    return metrics?.metrics.sharpeRatio ?? null;
  }

  /**
   * Get current Sortino ratio for a specific window.
   *
   * @param windowType - Window type
   * @returns Sortino ratio (or null if insufficient data)
   */
  getSortino(windowType: RollingWindowType): number | null {
    const metrics = this.getMetrics(windowType);
    return metrics?.metrics.sortinoRatio ?? null;
  }

  /**
   * Get current Calmar ratio for a specific window.
   *
   * @param windowType - Window type
   * @returns Calmar ratio (or null if insufficient data)
   */
  getCalmar(windowType: RollingWindowType): number | null {
    const metrics = this.getMetrics(windowType);
    return metrics?.metrics.calmarRatio ?? null;
  }

  /**
   * Get sample count for a specific window.
   *
   * @param windowType - Window type
   * @returns Number of samples in window
   */
  getSampleCount(windowType: RollingWindowType): number {
    const entries = this.windows.get(windowType);
    if (!entries) return 0;

    const now = Date.now();
    const config = this.configs[windowType];
    const windowStart = now - config.windowMs;

    return entries.filter(e => e.timestamp >= windowStart).length;
  }

  /**
   * Get raw returns array for a specific period (in hours).
   * Used for custom calculations outside standard windows.
   *
   * @param hours - Number of hours to look back
   * @returns Array of returns (as decimals)
   */
  getReturns(hours: number): number[] {
    const now = Date.now();
    const windowStart = now - (hours * 60 * 60 * 1000);

    // Use the most appropriate window or combine all
    let allEntries: ReturnEntry[] = [];
    for (const entries of this.windows.values()) {
      allEntries = allEntries.concat(entries);
    }

    // Deduplicate by timestamp
    const unique = new Map<number, ReturnEntry>();
    for (const entry of allEntries) {
      unique.set(entry.timestamp, entry);
    }

    // Filter within window and return
    return Array.from(unique.values())
      .filter(e => e.timestamp >= windowStart)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(e => e.return);
  }

  /**
   * Clear all data from all windows.
   */
  clear(): void {
    for (const entries of this.windows.values()) {
      entries.length = 0;
    }
  }

  /**
   * Start automatic cleanup interval.
   * Runs cleanup every 5 minutes to prevent memory bloat.
   *
   * @param intervalMs - Cleanup interval in milliseconds (default: 5 minutes)
   */
  startAutoCleanup(intervalMs: number = 5 * 60 * 1000): void {
    this.stopAutoCleanup();
    this.cleanupInterval = setInterval(() => {
      this.cleanupAll();
    }, intervalMs);
  }

  /**
   * Stop automatic cleanup interval.
   */
  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * Manual cleanup of all windows.
   */
  cleanupAll(): void {
    const now = Date.now();
    for (const windowType of this.windows.keys()) {
      this.cleanupWindow(windowType, now);
    }
  }

  /**
   * Cleanup old entries from a specific window.
   */
  private cleanupWindow(windowType: RollingWindowType, now: number): void {
    const entries = this.windows.get(windowType)!;
    const config = this.configs[windowType];
    const windowStart = now - config.windowMs;

    // Remove entries outside window
    const validIndex = entries.findIndex(e => e.timestamp >= windowStart);

    if (validIndex > 0) {
      entries.splice(0, validIndex);
    }

    // Enforce max samples (keep newest)
    if (entries.length > config.maxSamples) {
      entries.splice(0, entries.length - config.maxSamples);
    }
  }

  /**
   * Get window configuration.
   */
  getWindowConfig(windowType: RollingWindowType): RollingWindowConfig {
    return { ...this.configs[windowType] };
  }

  /**
   * Get current memory usage (total entries across all windows).
   */
  getMemoryUsage(): { totalEntries: number; byWindow: Record<RollingWindowType, number> } {
    const byWindow = {
      '1h': this.windows.get('1h')?.length ?? 0,
      '24h': this.windows.get('24h')?.length ?? 0,
      '7d': this.windows.get('7d')?.length ?? 0,
    };

    return {
      totalEntries: byWindow['1h'] + byWindow['24h'] + byWindow['7d'],
      byWindow,
    };
  }

  /**
   * Cleanup and release resources.
   */
  dispose(): void {
    this.stopAutoCleanup();
    this.clear();
  }
}
