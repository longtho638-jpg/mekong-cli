/**
 * Backtest Configuration Types
 * Interfaces for configuring the historical backtesting framework
 */

export interface BacktestConfig {
  /** Map of source name -> data file path */
  dataPaths: Record<string, string>;
  /** Date range for the backtest */
  dateRange: { start: string; end: string };
  /** Strategy phases to run */
  phases: Record<string, PhaseConfig>;
  /** Fee schedules per exchange */
  fees: Record<string, FeeConfig>;
  /** Starting capital in USD */
  initialCapital: number;
  /** Annual risk-free rate (e.g. 0.04 = 4%) */
  riskFreeRate: number;
  /** Output format for the report */
  outputFormat: 'html' | 'json' | 'csv';
  /** Simulated network latency in milliseconds */
  latencyMs?: number;
  /** Number of events to process per batch */
  batchSize?: number;
}

export interface PhaseConfig {
  enabled: boolean;
  modelPath?: string;
  llmModel?: string;
  sandwichThreshold?: number;
  jitterMeanMs?: number;
  [key: string]: unknown;
}

export interface FeeConfig {
  maker?: number;
  taker?: number;
  /** Flat fee rate (used when maker/taker not split) */
  fee?: number;
}

/** Default backtest configuration */
export const DEFAULT_BACKTEST_CONFIG: BacktestConfig = {
  dataPaths: {},
  dateRange: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  },
  phases: {},
  fees: {
    binance: { maker: 0.001, taker: 0.001 },
    bybit: { maker: 0.001, taker: 0.001 },
    default: { fee: 0.001 },
  },
  initialCapital: 100000,
  riskFreeRate: 0.04,
  outputFormat: 'html',
  latencyMs: 50,
  batchSize: 1000,
};
