/**
 * Order Flow Capture — aggregates all revenue streams into a unified report.
 * Sources:
 *   1. DEX trading fees        — from own deployed DEX
 *   2. Validator block rewards  — from PoS validator
 *   3. MEV capture             — simulated frontrun/backrun/sandwich profit
 *   4. LP fees                 — from liquidity positions on AMMs
 * Returns RevenueReport with per-source breakdown and totals.
 */

export interface RevenueSource {
  source: 'dex_fees' | 'validator_rewards' | 'mev_capture' | 'lp_fees';
  amountUsd: number;
  amountNative?: number;
  nativeToken?: string;
  periodMs: number;
}

export interface RevenueReport {
  sources: RevenueSource[];
  totalUsd: number;
  breakdown: Record<RevenueSource['source'], number>;
  dominantSource: RevenueSource['source'];
  annualisedApyPct: number;
  periodMs: number;
  generatedAt: number;
}

export interface OrderFlowConfig {
  /** Simulated ETH/USD price for converting native amounts. Default: 3200. */
  ethPriceUsd: number;
  /** Capital base in USD for APY calculation. Default: 100_000. */
  capitalBaseUsd: number;
  /** Observation window in ms. Default: 86_400_000 (24 h). */
  observationWindowMs: number;
}

const DEFAULT_CONFIG: OrderFlowConfig = {
  ethPriceUsd: 3200,
  capitalBaseUsd: 100_000,
  observationWindowMs: 86_400_000,
};

const MS_PER_YEAR = 365 * 24 * 60 * 60 * 1000;

export class OrderFlowCapture {
  private readonly cfg: OrderFlowConfig;
  private sources: RevenueSource[] = [];

  constructor(config: Partial<OrderFlowConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /** Record a DEX trading fee collection event. */
  recordDexFees(amountUsd: number, periodMs = this.cfg.observationWindowMs): void {
    this.sources.push({ source: 'dex_fees', amountUsd, periodMs });
  }

  /** Record validator reward (native ETH → converted to USD). */
  recordValidatorReward(rewardsEth: number, periodMs = this.cfg.observationWindowMs): void {
    const amountUsd = rewardsEth * this.cfg.ethPriceUsd;
    this.sources.push({
      source: 'validator_rewards',
      amountUsd,
      amountNative: rewardsEth,
      nativeToken: 'ETH',
      periodMs,
    });
  }

  /** Record MEV capture profit in USD. */
  recordMevCapture(amountUsd: number, periodMs = this.cfg.observationWindowMs): void {
    this.sources.push({ source: 'mev_capture', amountUsd, periodMs });
  }

  /** Record LP fees earned in USD. */
  recordLpFees(amountUsd: number, periodMs = this.cfg.observationWindowMs): void {
    this.sources.push({ source: 'lp_fees', amountUsd, periodMs });
  }

  /**
   * Aggregate all recorded revenue sources into a RevenueReport.
   * APY is annualised from the weighted average period across sources.
   */
  generateReport(): RevenueReport {
    const breakdown: Record<RevenueSource['source'], number> = {
      dex_fees: 0,
      validator_rewards: 0,
      mev_capture: 0,
      lp_fees: 0,
    };

    let totalPeriodWeightedMs = 0;
    for (const s of this.sources) {
      breakdown[s.source] += s.amountUsd;
      totalPeriodWeightedMs += s.periodMs;
    }

    const totalUsd = Object.values(breakdown).reduce((a, b) => a + b, 0);
    const avgPeriodMs = this.sources.length > 0
      ? totalPeriodWeightedMs / this.sources.length
      : this.cfg.observationWindowMs;

    const annualisedApyPct = this.cfg.capitalBaseUsd > 0
      ? parseFloat(((totalUsd / this.cfg.capitalBaseUsd) * (MS_PER_YEAR / avgPeriodMs) * 100).toFixed(4))
      : 0;

    const dominantSource = (Object.entries(breakdown) as [RevenueSource['source'], number][])
      .reduce((a, b) => (b[1] > a[1] ? b : a))[0];

    return {
      sources: [...this.sources],
      totalUsd: parseFloat(totalUsd.toFixed(4)),
      breakdown,
      dominantSource,
      annualisedApyPct,
      periodMs: avgPeriodMs,
      generatedAt: Date.now(),
    };
  }

  /** Clear all recorded sources. */
  clearSources(): void {
    this.sources.length = 0;
  }

  getConfig(): OrderFlowConfig {
    return { ...this.cfg };
  }
}
