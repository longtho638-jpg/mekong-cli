/**
 * Phase 12 Module 3: Market Morphogenesis — barrel exports + engine.
 *
 * Components:
 * 1. DexDeployer           — Uniswap V2-style DEX deployment simulation
 * 2. LiquidityProvider     — LP position management with IL optimisation
 * 3. ValidatorNode         — PoS validator client simulation
 * 4. OrderFlowCapture      — Multi-source revenue aggregation
 * 5. InfrastructureGovernor — Rule-based parameter adjustment
 *
 * All components default to simulation / dryRun mode.
 */

export { DexDeployer } from './dex-deployer';
export type { DexDeployerConfig, DexDeployment, TokenPair } from './dex-deployer';

export { LiquidityProvider } from './liquidity-provider';
export type { LPConfig, LPPosition, LPReport } from './liquidity-provider';

export { ValidatorNode } from './validator-node';
export type { ValidatorConfig, ValidatorReport } from './validator-node';

export { OrderFlowCapture } from './order-flow-capture';
export type { OrderFlowConfig, RevenueSource, RevenueReport } from './order-flow-capture';

export { InfrastructureGovernor } from './infrastructure-governor';
export type { GovernorConfig, MarketSnapshot, GovernanceDecision } from './infrastructure-governor';

// ── Imports for engine ────────────────────────────────────────────────────────

import { DexDeployer } from './dex-deployer';
import type { DexDeployerConfig, DexDeployment } from './dex-deployer';
import { LiquidityProvider } from './liquidity-provider';
import type { LPConfig, LPReport } from './liquidity-provider';
import { ValidatorNode } from './validator-node';
import type { ValidatorConfig, ValidatorReport } from './validator-node';
import { OrderFlowCapture } from './order-flow-capture';
import type { OrderFlowConfig, RevenueReport } from './order-flow-capture';
import { InfrastructureGovernor } from './infrastructure-governor';
import type { GovernorConfig, MarketSnapshot, GovernanceDecision } from './infrastructure-governor';

// ── Engine config ─────────────────────────────────────────────────────────────

export interface MarketMorphConfig {
  dex: Partial<DexDeployerConfig>;
  lp: Partial<LPConfig>;
  validator: Partial<ValidatorConfig>;
  orderFlow: Partial<OrderFlowConfig>;
  governor: Partial<GovernorConfig>;
  /** Initial DEX pairs to deploy. Default: ['ETH/USDC', 'WBTC/ETH']. */
  initialPairs: string[];
  /** Revenue loop interval in ms. Default: 5000. */
  revenueLoopIntervalMs: number;
}

export interface MarketMorphMetrics {
  deployment: DexDeployment | null;
  lastLpReport: LPReport | null;
  lastValidatorReport: ValidatorReport | null;
  lastRevenueReport: RevenueReport | null;
  lastGovernanceDecision: GovernanceDecision | null;
  loopIterations: number;
  startedAt: number | null;
}

const DEFAULT_CONFIG: MarketMorphConfig = {
  dex: {},
  lp: {},
  validator: {},
  orderFlow: {},
  governor: {},
  initialPairs: ['ETH/USDC', 'WBTC/ETH'],
  revenueLoopIntervalMs: 5_000,
};

// ── Engine ────────────────────────────────────────────────────────────────────

export class MarketMorphEngine {
  private readonly cfg: MarketMorphConfig;

  readonly deployer: DexDeployer;
  readonly lpProvider: LiquidityProvider;
  readonly validator: ValidatorNode;
  readonly orderFlow: OrderFlowCapture;
  readonly governor: InfrastructureGovernor;

  private metrics: MarketMorphMetrics = {
    deployment: null,
    lastLpReport: null,
    lastValidatorReport: null,
    lastRevenueReport: null,
    lastGovernanceDecision: null,
    loopIterations: 0,
    startedAt: null,
  };

  private loopTimer: ReturnType<typeof setInterval> | null = null;
  private currentFeeBps = 30;
  private currentCommissionRate = 0.05;
  private currentLpAllocationPct = 40;

  constructor(config: Partial<MarketMorphConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
    this.deployer = new DexDeployer(this.cfg.dex);
    this.lpProvider = new LiquidityProvider(this.cfg.lp);
    this.validator = new ValidatorNode(this.cfg.validator);
    this.orderFlow = new OrderFlowCapture(this.cfg.orderFlow);
    this.governor = new InfrastructureGovernor(this.cfg.governor);
  }

  /** Bootstrap all infrastructure and start the revenue loop. */
  start(): void {
    if (this.loopTimer !== null) return;
    this.metrics.startedAt = Date.now();

    // Deploy DEX
    this.metrics.deployment = this.deployer.deploy(this.cfg.initialPairs);

    // Seed LP positions for each pair
    for (const pair of this.cfg.initialPairs) {
      this.lpProvider.openPosition(pair, 5000, 5000, 1.0 + Math.random() * 0.1);
    }

    this.loopTimer = setInterval(() => this._runRevenueLoop(), this.cfg.revenueLoopIntervalMs);
    this._runRevenueLoop();
  }

  /** Stop the revenue loop. */
  stop(): void {
    if (this.loopTimer !== null) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
  }

  /** Single iteration: collect revenue, govern parameters. */
  private _runRevenueLoop(): void {
    this.metrics.loopIterations += 1;

    // Validator epoch
    const vReport = this.validator.runEpoch(1);
    this.metrics.lastValidatorReport = vReport;

    // LP update
    const lpReport = this.lpProvider.updatePositions({});
    this.metrics.lastLpReport = lpReport;

    // Aggregate revenue
    this.orderFlow.clearSources();
    this.orderFlow.recordDexFees(Math.random() * 200 + 50);
    this.orderFlow.recordValidatorReward(vReport.rewardsEth);
    this.orderFlow.recordMevCapture(Math.random() * 100 + 10);
    this.orderFlow.recordLpFees(lpReport.totalFeesEarned);
    this.metrics.lastRevenueReport = this.orderFlow.generateReport();

    // Governance
    const snapshot: MarketSnapshot = {
      volumeUsd24h: Math.random() * 800_000 + 20_000,
      avgIlPct: lpReport.totalIlPct,
      validatorRewardsEth24h: vReport.rewardsEth * 225,
      currentFeeBps: this.currentFeeBps,
      currentCommissionRate: this.currentCommissionRate,
      currentLpAllocationPct: this.currentLpAllocationPct,
    };
    const decision = this.governor.evaluate(snapshot);
    this.currentFeeBps = decision.newFeeBps;
    this.currentCommissionRate = decision.newCommissionRate;
    this.currentLpAllocationPct = decision.newLpAllocationPct;
    this.metrics.lastGovernanceDecision = decision;
  }

  getMetrics(): MarketMorphMetrics {
    return { ...this.metrics };
  }

  getRevenue(): RevenueReport | null {
    return this.metrics.lastRevenueReport;
  }

  isRunning(): boolean {
    return this.loopTimer !== null;
  }
}

/** Phase 12 unified config shape (mirrors config.phase12.json). */
export interface Phase12Config {
  marketMorph: Partial<MarketMorphConfig> & { enabled: boolean };
}

export const DEFAULT_PHASE12_CONFIG: Phase12Config = {
  marketMorph: {
    enabled: false,
    initialPairs: ['ETH/USDC', 'WBTC/ETH'],
    revenueLoopIntervalMs: 5_000,
  },
};
