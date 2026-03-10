/**
 * RWA Oracle Connector — mock on-chain price feed for Real-World Assets.
 * In production: reads from Chainlink / UMA / custom oracle contracts.
 * Mock: returns seeded prices with deterministic jitter per asset.
 * All instances default to dryRun: true.
 */

import { createHash } from 'crypto';

export interface RwaOracleConfig {
  /** Dry-run mode — no real on-chain reads. Default: true. */
  dryRun: boolean;
  /** Map of assetId → oracle contract address (informational). */
  oracleAddresses: Record<string, string>;
  /** Polling interval in ms (informational — no timer started here). */
  pollIntervalMs: number;
}

export interface OraclePriceResult {
  assetId: string;
  onChainPrice: number;
  source: string;
  timestamp: number;
}

/** Seeded base prices for mock oracle data (USD). */
const BASE_PRICES: Record<string, number> = {
  'AAPL': 185.00,
  'GOLD': 2050.00,
  'TSLA': 245.00,
  'MSFT': 415.00,
  'OIL':    80.00,
  'REAL_ESTATE_IDX': 300.00,
};

const DEFAULT_CONFIG: RwaOracleConfig = {
  dryRun: true,
  oracleAddresses: {},
  pollIntervalMs: 5000,
};

export class RwaOracleConnector {
  private readonly cfg: RwaOracleConfig;

  constructor(config: Partial<RwaOracleConfig> = {}) {
    this.cfg = {
      ...DEFAULT_CONFIG,
      ...config,
      oracleAddresses: { ...DEFAULT_CONFIG.oracleAddresses, ...(config.oracleAddresses ?? {}) },
    };
  }

  /**
   * Fetch mock on-chain oracle price for an asset.
   * Uses a deterministic hash-based jitter so the same assetId
   * produces consistent results within the same second.
   */
  fetchPrice(assetId: string): OraclePriceResult {
    const base = BASE_PRICES[assetId] ?? 100.00;
    const jitter = this._deterministicJitter(assetId, Math.floor(Date.now() / 1000));
    const onChainPrice = parseFloat((base * (1 + jitter)).toFixed(4));

    const address = this.cfg.oracleAddresses[assetId] ?? '0x0000000000000000000000000000000000000000';

    return {
      assetId,
      onChainPrice,
      source: `oracle:${address}`,
      timestamp: Date.now(),
    };
  }

  /** List all supported asset IDs (union of built-in + configured). */
  supportedAssets(): string[] {
    const extras = Object.keys(this.cfg.oracleAddresses);
    return Array.from(new Set([...Object.keys(BASE_PRICES), ...extras]));
  }

  getConfig(): RwaOracleConfig {
    return { ...this.cfg, oracleAddresses: { ...this.cfg.oracleAddresses } };
  }

  /** Deterministic jitter in [-0.005, +0.005] derived from assetId + epoch-second. */
  private _deterministicJitter(assetId: string, epochSec: number): number {
    const hash = createHash('sha256')
      .update(`${assetId}:${epochSec}`)
      .digest();
    const uint32 = hash.readUInt32BE(0);
    return (uint32 / 0xffffffff - 0.5) * 0.01;
  }
}
