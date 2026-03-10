/**
 * Phase 12 Omega — Energy Arbitrage Module.
 * Main orchestrator: fetch prices → calculate costs → optimize → manage treasury.
 * Exports EnergyArbitrageEngine with start/stop/getMetrics.
 */

import { EnergyMarketConnector } from './energy-market-connector';
import { ComputeCostModel } from './compute-cost-model';
import { ArbitrageOptimizer } from './arbitrage-optimizer';
import { MiningValidatorModule } from './mining-validator-module';
import { TreasuryManager } from './treasury-manager';

export type { EnergyPrice, EnergyMarket, MarketConnectorConfig } from './energy-market-connector';
export type { ComputeUsage, ComputeCostReport, ComputeCostModelConfig } from './compute-cost-model';
export type { TimeSlot, OptimizedSchedule, ComputeAction, ArbitrageOptimizerConfig } from './arbitrage-optimizer';
export type { MiningReport, MiningMode, MiningValidatorConfig } from './mining-validator-module';
export type { TreasuryReport, TreasuryAllocation, TreasuryManagerConfig } from './treasury-manager';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EnergyArbitrageConfig {
  markets: string[];
  cloudProvider: 'AWS' | 'GCP' | 'AZURE';
  miningMode: 'POW' | 'POS';
  stakeAmountUsd: number;
  hashRateGhs: number;
  initialTreasuryUsd: number;
  /** Cycle interval ms. Default 60_000 (1 min in sim) */
  cycleIntervalMs: number;
  simulation: boolean;
}

export interface EnergyArbitrageMetrics {
  cyclesCompleted: number;
  currentEnergyPriceUsd: number;
  currentComputeCostHourly: number;
  currentProfitMargin: number;
  totalMiningEarningsUsd: number;
  treasuryBalanceUsd: number;
  lastOptimizedAction: string;
  uptimeMs: number;
}

// ── EnergyArbitrageEngine ─────────────────────────────────────────────────────

export class EnergyArbitrageEngine {
  private readonly config: EnergyArbitrageConfig;
  private readonly connector: EnergyMarketConnector;
  private readonly costModel: ComputeCostModel;
  private readonly optimizer: ArbitrageOptimizer;
  private readonly miner: MiningValidatorModule;
  private readonly treasury: TreasuryManager;

  private running = false;
  private cyclesCompleted = 0;
  private startedAt = 0;
  private lastAction = 'NONE';
  private totalMiningEarnings = 0;
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(config: Partial<EnergyArbitrageConfig> = {}) {
    this.config = {
      markets: ['NORDPOOL', 'ERCOT'],
      cloudProvider: 'AWS',
      miningMode: 'POW',
      stakeAmountUsd: 10_000,
      hashRateGhs: 100,
      initialTreasuryUsd: 100_000,
      cycleIntervalMs: 60_000,
      simulation: true,
      ...config,
    };

    this.connector = new EnergyMarketConnector({
      markets: this.config.markets as ('NORDPOOL' | 'ERCOT' | 'PJM' | 'CAISO')[],
      simulation: this.config.simulation,
    });

    this.costModel = new ComputeCostModel({ provider: this.config.cloudProvider });

    this.optimizer = new ArbitrageOptimizer({
      cheapThresholdUsd: 40,
      expensiveThresholdUsd: 80,
    });

    this.miner = new MiningValidatorModule({
      mode: this.config.miningMode,
      stakeAmountUsd: this.config.stakeAmountUsd,
      hashRateGhs: this.config.hashRateGhs,
      simulation: this.config.simulation,
    });

    this.treasury = new TreasuryManager({
      initialBalanceUsd: this.config.initialTreasuryUsd,
    });
  }

  /** Start the continuous arbitrage loop. */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.startedAt = Date.now();

    // Run first cycle immediately then on interval
    await this.runCycle();
    this.timer = setInterval(() => { void this.runCycle(); }, this.config.cycleIntervalMs);
  }

  /** Stop the arbitrage loop. */
  async stop(): Promise<void> {
    this.running = false;
    if (this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  isRunning(): boolean { return this.running; }

  getMetrics(): EnergyArbitrageMetrics {
    const cheapest = this.connector.getCheapestMarket();
    const costReport = this.costModel.calculateCost();

    return {
      cyclesCompleted: this.cyclesCompleted,
      currentEnergyPriceUsd: cheapest?.pricePerMwh ?? 0,
      currentComputeCostHourly: costReport.costs.totalHourly,
      currentProfitMargin: this.treasury.getBalance() > 0
        ? (this.totalMiningEarnings / this.treasury.getBalance()) * 100
        : 0,
      totalMiningEarningsUsd: this.totalMiningEarnings,
      treasuryBalanceUsd: this.treasury.getBalance(),
      lastOptimizedAction: this.lastAction,
      uptimeMs: this.running ? Date.now() - this.startedAt : 0,
    };
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private async runCycle(): Promise<void> {
    if (!this.running) return;

    try {
      // 1. Fetch energy prices
      const prices = await this.connector.fetchPrices();

      // 2. Record compute usage for this cycle (1 CPU-hour equivalent)
      this.costModel.recordUsage({ cpuHours: 1, memoryGbHours: 4, bandwidthGb: 0.1 });
      const costReport = this.costModel.calculateCost();

      // 3. Optimize schedule
      const schedule = this.optimizer.optimize(prices, costReport);
      const nextSlot = schedule.slots[0];
      if (nextSlot) {
        this.lastAction = nextSlot.action;
      }

      // 4. Mining/staking report
      const miningReport = await this.miner.generateReport(this.config.cycleIntervalMs);
      this.totalMiningEarnings += Math.max(0, miningReport.netProfitUsd);

      // 5. Treasury: record income and expense
      if (miningReport.netProfitUsd > 0) {
        this.treasury.recordIncome(miningReport.netProfitUsd, 'mining');
      }
      this.treasury.recordExpense(costReport.costs.totalHourly, 'compute');

      this.cyclesCompleted++;
    } catch {
      // Cycle errors are non-fatal — log would go to structured logger in production
    }
  }
}

export default EnergyArbitrageEngine;
