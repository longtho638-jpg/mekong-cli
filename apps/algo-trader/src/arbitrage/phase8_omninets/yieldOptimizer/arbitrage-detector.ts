/**
 * Arbitrage Detector — detects price discrepancies between AMM pools and CEX.
 * Emits opportunities when spread exceeds minProfitUsd after fees.
 */

import { EventEmitter } from 'events';
import type { PoolState } from './amm-monitor';

export interface CexQuote {
  symbol: string;
  bid: number;
  ask: number;
  exchange: string;
  timestamp: number;
}

export interface ArbOpportunityDetected {
  id: string;
  poolId: string;
  cexExchange: string;
  ammPrice: number;
  cexMidPrice: number;
  priceDiffPct: number;
  estimatedProfitUsd: number;
  direction: 'buy-amm-sell-cex' | 'buy-cex-sell-amm';
  detectedAt: number;
}

export interface ArbitrageDetectorConfig {
  /** Minimum estimated profit in USD to emit opportunity. */
  minProfitUsd: number;
  /** Gas/slippage cost estimate in USD per trade. */
  tradeCostUsd: number;
}

const DEFAULT_CONFIG: ArbitrageDetectorConfig = {
  minProfitUsd: 20,
  tradeCostUsd: 5,
};

let oppCounter = 0;

export class ArbitrageDetector extends EventEmitter {
  private readonly cfg: ArbitrageDetectorConfig;
  private detectedCount = 0;

  constructor(config: Partial<ArbitrageDetectorConfig> = {}) {
    super();
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Compare a pool's AMM price against a CEX quote.
   * Returns opportunity if spread is profitable after costs.
   */
  detect(pool: PoolState, cex: CexQuote): ArbOpportunityDetected | null {
    const ammPrice = pool.price;
    const cexMid = (cex.bid + cex.ask) / 2;
    const priceDiff = ammPrice - cexMid;
    const priceDiffPct = (Math.abs(priceDiff) / cexMid) * 100;

    // Estimate trade size from pool liquidity (use 0.1% of liquidity)
    const tradeNotional = pool.liquidity * 0.001;
    const grossProfit = tradeNotional * (Math.abs(priceDiff) / cexMid);
    const netProfit = grossProfit - this.cfg.tradeCostUsd - tradeNotional * pool.fee;

    if (netProfit < this.cfg.minProfitUsd) return null;

    const direction: ArbOpportunityDetected['direction'] =
      priceDiff > 0 ? 'buy-cex-sell-amm' : 'buy-amm-sell-cex';

    const opp: ArbOpportunityDetected = {
      id: `arb-${++oppCounter}`,
      poolId: pool.poolId,
      cexExchange: cex.exchange,
      ammPrice,
      cexMidPrice: cexMid,
      priceDiffPct,
      estimatedProfitUsd: netProfit,
      direction,
      detectedAt: Date.now(),
    };

    this.detectedCount++;
    this.emit('opportunity:detected', opp);
    return opp;
  }

  /** Scan all pools against a CEX quote and return all opportunities. */
  scanAll(pools: PoolState[], cex: CexQuote): ArbOpportunityDetected[] {
    const results: ArbOpportunityDetected[] = [];
    for (const pool of pools) {
      const opp = this.detect(pool, cex);
      if (opp) results.push(opp);
    }
    return results;
  }

  getDetectedCount(): number {
    return this.detectedCount;
  }
}
