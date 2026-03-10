/**
 * Phase 12 Omega — Energy Arbitrage Module.
 * Interfaces with mining pools (PoW) or staking contracts (PoS).
 * Simulation mode logs potential earnings based on hash rate / stake amount.
 * Returns MiningReport with current and projected earnings.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type MiningMode = 'POW' | 'POS';

export interface MiningReport {
  mode: MiningMode;
  periodMs: number;
  earnedUsd: number;
  earnedCrypto: number;
  cryptoSymbol: string;
  energyCostUsd: number;
  netProfitUsd: number;
  profitMargin: number;
  hashRateGhs: number;
  stakeAmountUsd: number;
  generatedAt: number;
}

export interface MiningValidatorConfig {
  mode: MiningMode;
  /** Hash rate in GH/s (PoW only) */
  hashRateGhs: number;
  /** Stake amount in USD (PoS only) */
  stakeAmountUsd: number;
  /** Pool name or staking contract address */
  poolOrContract: string;
  /** Current energy cost per MWh in USD */
  energyPricePerMwh: number;
  /** Power consumption in kW (PoW rigs) */
  powerConsumptionKw: number;
  /** Annual percentage yield for staking (PoS) */
  stakingApy: number;
  simulation: boolean;
}

// ── Reward constants (simulated mainnet averages) ─────────────────────────────

/** BTC block reward split across global hash rate: ~6.25 BTC / 10 min */
const BTC_PRICE_USD = 65_000;
const BTC_BLOCK_REWARD = 3.125; // post-halving
const GLOBAL_HASH_RATE_EHS = 600; // 600 EH/s global

/** ETH staking: ~4.5% APY annualised */
const DEFAULT_STAKING_APY = 0.045;

// ── MiningValidatorModule ─────────────────────────────────────────────────────

export class MiningValidatorModule {
  private readonly config: MiningValidatorConfig;
  private cumulativeEarningsUsd = 0;

  constructor(config: Partial<MiningValidatorConfig> = {}) {
    this.config = {
      mode: 'POW',
      hashRateGhs: 100,
      stakeAmountUsd: 10_000,
      poolOrContract: 'simulation-pool',
      energyPricePerMwh: 45,
      powerConsumptionKw: 3.0,
      stakingApy: DEFAULT_STAKING_APY,
      simulation: true,
      ...config,
    };
  }

  /** Calculate mining/staking report for a given period (default: 1 hour). */
  async generateReport(periodMs = 3_600_000): Promise<MiningReport> {
    if (this.config.mode === 'POW') {
      return this.simulatePoW(periodMs);
    }
    return this.simulatePoS(periodMs);
  }

  /** Update energy price (called by orchestrator when spot price changes). */
  updateEnergyPrice(pricePerMwh: number): void {
    this.config.energyPricePerMwh = pricePerMwh;
  }

  getCumulativeEarnings(): number {
    return this.cumulativeEarningsUsd;
  }

  getConfig(): MiningValidatorConfig {
    return { ...this.config };
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private simulatePoW(periodMs: number): MiningReport {
    const periodHours = periodMs / 3_600_000;
    const periodSeconds = periodMs / 1_000;

    // Share of global hash rate
    const hashRateEhs = this.config.hashRateGhs / 1e9; // GH/s → EH/s
    const networkShare = hashRateEhs / GLOBAL_HASH_RATE_EHS;

    // Blocks found in period
    const blocksPerSecond = 1 / 600; // 1 block per 10 min
    const expectedBlocks = blocksPerSecond * periodSeconds * networkShare;

    const earnedBtc = expectedBlocks * BTC_BLOCK_REWARD;
    const earnedUsd = earnedBtc * BTC_PRICE_USD;

    // Energy cost: power (kW) × time (h) × rate ($/MWh ÷ 1000)
    const energyCostUsd = this.config.powerConsumptionKw * periodHours * (this.config.energyPricePerMwh / 1000);

    const netProfitUsd = earnedUsd - energyCostUsd;
    const profitMargin = earnedUsd > 0 ? (netProfitUsd / earnedUsd) * 100 : 0;

    this.cumulativeEarningsUsd += Math.max(0, netProfitUsd);

    return {
      mode: 'POW',
      periodMs,
      earnedUsd: round(earnedUsd),
      earnedCrypto: roundCrypto(earnedBtc),
      cryptoSymbol: 'BTC',
      energyCostUsd: round(energyCostUsd),
      netProfitUsd: round(netProfitUsd),
      profitMargin: round(profitMargin),
      hashRateGhs: this.config.hashRateGhs,
      stakeAmountUsd: 0,
      generatedAt: Date.now(),
    };
  }

  private simulatePoS(periodMs: number): MiningReport {
    const periodYearFraction = periodMs / (365 * 24 * 3_600_000);
    const apy = this.config.stakingApy ?? DEFAULT_STAKING_APY;
    const earnedUsd = this.config.stakeAmountUsd * apy * periodYearFraction;

    // PoS has negligible energy consumption vs PoW
    const periodHours = periodMs / 3_600_000;
    const energyCostUsd = 0.01 * periodHours; // validator node ~10W

    const netProfitUsd = earnedUsd - energyCostUsd;
    const profitMargin = earnedUsd > 0 ? (netProfitUsd / earnedUsd) * 100 : 0;

    this.cumulativeEarningsUsd += Math.max(0, netProfitUsd);

    return {
      mode: 'POS',
      periodMs,
      earnedUsd: round(earnedUsd),
      earnedCrypto: round(earnedUsd / 3200), // approximate ETH price
      cryptoSymbol: 'ETH',
      energyCostUsd: round(energyCostUsd),
      netProfitUsd: round(netProfitUsd),
      profitMargin: round(profitMargin),
      hashRateGhs: 0,
      stakeAmountUsd: this.config.stakeAmountUsd,
      generatedAt: Date.now(),
    };
  }
}

function round(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}

function roundCrypto(n: number): number {
  return Math.round(n * 1e8) / 1e8; // satoshi precision
}

export default MiningValidatorModule;
