/**
 * Phase 11 Module 1: RWA Oracle & Arbitrage — barrel exports + factory.
 *
 * Components:
 * 1. RwaOracleConnector — mock on-chain oracle price feed
 * 2. CexPriceFetcher    — mock CEX price feed with exchange variation
 * 3. SpreadDetector     — net-spread opportunity detection
 * 4. ArbitrageExecutor  — mock trade execution + log
 *
 * All modules default to disabled / dryRun: true.
 */

export { RwaOracleConnector } from './rwa-oracle-connector';
export type { RwaOracleConfig, OraclePriceResult } from './rwa-oracle-connector';

export { CexPriceFetcher } from './cex-price-fetcher';
export type { CexPriceFetcherConfig, CexPriceResult } from './cex-price-fetcher';

export { SpreadDetector } from './spread-detector';
export type { SpreadDetectorConfig, SpreadOpportunity } from './spread-detector';

export { ArbitrageExecutor } from './arbitrage-executor';
export type { ArbitrageExecutorConfig, ExecutionResult } from './arbitrage-executor';

// ── Unified config ────────────────────────────────────────────────────────────

import { RwaOracleConnector } from './rwa-oracle-connector';
import type { RwaOracleConfig, OraclePriceResult } from './rwa-oracle-connector';
import { CexPriceFetcher } from './cex-price-fetcher';
import type { CexPriceFetcherConfig } from './cex-price-fetcher';
import { SpreadDetector } from './spread-detector';
import type { SpreadDetectorConfig, SpreadOpportunity } from './spread-detector';
import { ArbitrageExecutor } from './arbitrage-executor';
import type { ArbitrageExecutorConfig, ExecutionResult } from './arbitrage-executor';

export interface RwaArbitrageConfig {
  /** Master switch — all components run in dryRun when false. Default: false. */
  enabled: boolean;
  oracle: Partial<RwaOracleConfig>;
  fetcher: Partial<CexPriceFetcherConfig>;
  detector: Partial<SpreadDetectorConfig>;
  executor: Partial<ArbitrageExecutorConfig>;
}

export interface ScanResult {
  oracleResult: OraclePriceResult;
  opportunity: SpreadOpportunity | null;
  execution: ExecutionResult | null;
}

export interface RwaArbitrageInstances {
  /** Convenience: fetch prices → detect spread → execute if opportunity found. */
  scanAndExecute: (assetId: string) => ScanResult;
  /** Short aliases */
  oracle: RwaOracleConnector;
  fetcher: CexPriceFetcher;
  detector: SpreadDetector;
  executor: ArbitrageExecutor;
  /** Full names */
  rwaOracleConnector: RwaOracleConnector;
  cexPriceFetcher: CexPriceFetcher;
  spreadDetector: SpreadDetector;
  arbitrageExecutor: ArbitrageExecutor;
  config: RwaArbitrageConfig;
}

const DEFAULT_RWA_CONFIG: RwaArbitrageConfig = {
  enabled: false,
  oracle: {},
  fetcher: {},
  detector: {},
  executor: {},
};

/**
 * Factory: initialise all RWA Arbitrage components from a single config.
 * When enabled is false (default), all components operate in dryRun mode.
 */
export function initRwaArbitrage(
  config: Partial<RwaArbitrageConfig> = {},
): RwaArbitrageInstances {
  const cfg: RwaArbitrageConfig = {
    ...DEFAULT_RWA_CONFIG,
    ...config,
    oracle: { ...DEFAULT_RWA_CONFIG.oracle, ...(config.oracle ?? {}) },
    fetcher: { ...DEFAULT_RWA_CONFIG.fetcher, ...(config.fetcher ?? {}) },
    detector: { ...DEFAULT_RWA_CONFIG.detector, ...(config.detector ?? {}) },
    executor: { ...DEFAULT_RWA_CONFIG.executor, ...(config.executor ?? {}) },
  };

  const dryRun = !cfg.enabled;

  const rwaOracleConnector = new RwaOracleConnector({
    dryRun,
    ...cfg.oracle,
  });

  const cexPriceFetcher = new CexPriceFetcher({
    dryRun,
    ...cfg.fetcher,
  });

  const spreadDetector = new SpreadDetector(cfg.detector);

  const arbitrageExecutor = new ArbitrageExecutor({
    dryRun,
    ...cfg.executor,
  });

  function scanAndExecute(assetId: string): ScanResult {
    const oracleResult = rwaOracleConnector.fetchPrice(assetId);
    const cexResult = cexPriceFetcher.fetchPrice(assetId);

    const opportunity = spreadDetector.detectSpread(
      oracleResult.onChainPrice,
      cexResult.price,
      assetId,
    );

    const execution = opportunity ? arbitrageExecutor.execute(opportunity) : null;

    return { oracleResult, opportunity, execution };
  }

  return {
    scanAndExecute,
    // Short aliases
    oracle: rwaOracleConnector,
    fetcher: cexPriceFetcher,
    detector: spreadDetector,
    executor: arbitrageExecutor,
    // Full names
    rwaOracleConnector,
    cexPriceFetcher,
    spreadDetector,
    arbitrageExecutor,
    config: cfg,
  };
}
