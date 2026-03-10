/**
 * Validator Node — simulates a PoS validator client.
 * Mock: generates validator rewards, uptime, slashing risk metrics.
 * In production: would interface with beacon chain API / validator client.
 * All instances default to simulation: true.
 */

import { randomBytes } from 'crypto';

export interface ValidatorConfig {
  /** Simulation mode. Default: true. */
  simulation: boolean;
  /** Validator commission rate (0–1). Default: 0.05 (5%). */
  commissionRate: number;
  /** Total stake in ETH. Default: 32. */
  stakeEth: number;
  /** Target uptime percentage (0–100). Default: 99.5. */
  targetUptimePct: number;
}

export interface ValidatorReport {
  validatorId: string;
  stakeEth: number;
  commissionRate: number;
  rewardsEth: number;
  uptimePct: number;
  slashingRisk: 'low' | 'medium' | 'high';
  epochsActive: number;
  simulation: boolean;
  generatedAt: number;
}

const DEFAULT_CONFIG: ValidatorConfig = {
  simulation: true,
  commissionRate: 0.05,
  stakeEth: 32,
  targetUptimePct: 99.5,
};

/** Derive slashing risk from uptime. */
function deriveSlashingRisk(uptimePct: number): ValidatorReport['slashingRisk'] {
  if (uptimePct >= 99) return 'low';
  if (uptimePct >= 95) return 'medium';
  return 'high';
}

export class ValidatorNode {
  private readonly cfg: ValidatorConfig;
  private readonly validatorId: string;
  private reports: ValidatorReport[] = [];

  constructor(config: Partial<ValidatorConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
    this.validatorId = '0x' + randomBytes(24).toString('hex');
  }

  /**
   * Simulate one epoch of validation.
   * @param epochsActive Number of epochs to simulate. Default: 1.
   * Returns ValidatorReport with rewards and uptime.
   */
  runEpoch(epochsActive = 1): ValidatorReport {
    // Uptime: near target with small random jitter
    const uptimeJitter = (Math.random() - 0.3) * 1.5;
    const uptimePct = Math.min(100, Math.max(0, this.cfg.targetUptimePct + uptimeJitter));

    // Rewards: ~4% APY on staked ETH, prorated by epochs (225 epochs/day)
    const epochRewardBase = (this.cfg.stakeEth * 0.04) / (225 * 365);
    const rewardsEth = parseFloat(
      (epochRewardBase * epochsActive * uptimePct / 100 * (1 + (Math.random() - 0.5) * 0.1)).toFixed(8),
    );

    const report: ValidatorReport = {
      validatorId: this.validatorId,
      stakeEth: this.cfg.stakeEth,
      commissionRate: this.cfg.commissionRate,
      rewardsEth,
      uptimePct: parseFloat(uptimePct.toFixed(4)),
      slashingRisk: deriveSlashingRisk(uptimePct),
      epochsActive,
      simulation: this.cfg.simulation,
      generatedAt: Date.now(),
    };

    this.reports.push(report);
    return { ...report };
  }

  /** Aggregate stats across all stored reports. */
  getAggregateStats(): {
    totalRewardsEth: number;
    avgUptimePct: number;
    reportCount: number;
  } {
    if (this.reports.length === 0) {
      return { totalRewardsEth: 0, avgUptimePct: 0, reportCount: 0 };
    }
    const totalRewards = this.reports.reduce((s, r) => s + r.rewardsEth, 0);
    const avgUptime = this.reports.reduce((s, r) => s + r.uptimePct, 0) / this.reports.length;
    return {
      totalRewardsEth: parseFloat(totalRewards.toFixed(8)),
      avgUptimePct: parseFloat(avgUptime.toFixed(4)),
      reportCount: this.reports.length,
    };
  }

  getReports(): ValidatorReport[] {
    return this.reports.map((r) => ({ ...r }));
  }

  clearReports(): void {
    this.reports.length = 0;
  }

  getValidatorId(): string {
    return this.validatorId;
  }

  getConfig(): ValidatorConfig {
    return { ...this.cfg };
  }
}
