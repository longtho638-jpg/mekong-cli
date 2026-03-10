/**
 * Phase 12 Omega — Energy Arbitrage Module.
 * Finds compute scheduling opportunities based on energy price.
 * Cheap energy → schedule intensive tasks. Expensive → reduce usage.
 * Outputs OptimizedSchedule with time slots and recommended actions.
 */

import type { EnergyPrice } from './energy-market-connector';
import type { ComputeCostReport } from './compute-cost-model';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ComputeAction =
  | 'SCALE_UP'       // cheap energy — run full workload
  | 'SCALE_DOWN'     // expensive — defer non-critical tasks
  | 'DEFER_BATCH'    // queue batch jobs for off-peak window
  | 'MAINTAIN'       // neutral — hold current allocation

export interface TimeSlot {
  startMs: number;
  endMs: number;
  energyPricePerMwh: number;
  action: ComputeAction;
  estimatedSavingsUsd: number;
  reason: string;
}

export interface OptimizedSchedule {
  generatedAt: number;
  slots: TimeSlot[];
  totalEstimatedSavingsUsd: number;
  cheapestSlot: TimeSlot | undefined;
  mostExpensiveSlot: TimeSlot | undefined;
}

export interface ArbitrageOptimizerConfig {
  /** Price threshold below which we scale up ($/MWh). Default 40 */
  cheapThresholdUsd: number;
  /** Price threshold above which we scale down ($/MWh). Default 80 */
  expensiveThresholdUsd: number;
  /** Baseline compute cost per hour (USD). Used for savings estimate. */
  baselineComputeCostUsd: number;
  /** Hours ahead to project schedule. Default 24 */
  lookAheadHours: number;
}

// ── ArbitrageOptimizer ────────────────────────────────────────────────────────

export class ArbitrageOptimizer {
  private readonly config: ArbitrageOptimizerConfig;

  constructor(config: Partial<ArbitrageOptimizerConfig> = {}) {
    this.config = {
      cheapThresholdUsd: 40,
      expensiveThresholdUsd: 80,
      baselineComputeCostUsd: 2.5,
      lookAheadHours: 24,
      ...config,
    };
  }

  /**
   * Optimize schedule based on current energy prices and compute costs.
   * Projects forward using simulated price curve if only one price provided.
   */
  optimize(prices: EnergyPrice[], costReport?: ComputeCostReport): OptimizedSchedule {
    const now = Date.now();
    const hourMs = 3_600_000;
    const baselineCost = costReport?.costs.totalHourly ?? this.config.baselineComputeCostUsd;

    const slots: TimeSlot[] = [];

    for (let h = 0; h < this.config.lookAheadHours; h++) {
      const slotStart = now + h * hourMs;
      const slotEnd = slotStart + hourMs;

      // Pick cheapest available price for this slot
      const price = this.pickPriceForSlot(prices, h);
      const { action, savingsUsd, reason } = this.classifySlot(price, baselineCost);

      slots.push({
        startMs: slotStart,
        endMs: slotEnd,
        energyPricePerMwh: price,
        action,
        estimatedSavingsUsd: round(savingsUsd),
        reason,
      });
    }

    const totalSavings = slots.reduce((s, sl) => s + sl.estimatedSavingsUsd, 0);

    const sorted = [...slots].sort((a, b) => a.energyPricePerMwh - b.energyPricePerMwh);

    return {
      generatedAt: now,
      slots,
      totalEstimatedSavingsUsd: round(totalSavings),
      cheapestSlot: sorted[0],
      mostExpensiveSlot: sorted[sorted.length - 1],
    };
  }

  /** Classify a single time slot and compute estimated savings. */
  private classifySlot(
    pricePerMwh: number,
    baselineCostUsd: number,
  ): { action: ComputeAction; savingsUsd: number; reason: string } {
    if (pricePerMwh <= this.config.cheapThresholdUsd) {
      // Energy is cheap — scale up, run extra workloads
      const savingsUsd = baselineCostUsd * 0.3; // 30% more throughput at same cost
      return {
        action: 'SCALE_UP',
        savingsUsd,
        reason: `Energy cheap at $${pricePerMwh}/MWh (≤$${this.config.cheapThresholdUsd})`,
      };
    }

    if (pricePerMwh >= this.config.expensiveThresholdUsd) {
      // Energy expensive — scale down or defer
      const savingsUsd = baselineCostUsd * 0.4; // 40% cost reduction by deferring
      const action: ComputeAction = pricePerMwh >= this.config.expensiveThresholdUsd * 1.5
        ? 'DEFER_BATCH'
        : 'SCALE_DOWN';
      return {
        action,
        savingsUsd,
        reason: `Energy expensive at $${pricePerMwh}/MWh (≥$${this.config.expensiveThresholdUsd})`,
      };
    }

    return {
      action: 'MAINTAIN',
      savingsUsd: 0,
      reason: `Energy neutral at $${pricePerMwh}/MWh`,
    };
  }

  /**
   * Pick energy price for slot hour h.
   * Rotates through available prices using modulo to project forward.
   */
  private pickPriceForSlot(prices: EnergyPrice[], hour: number): number {
    if (prices.length === 0) return this.config.cheapThresholdUsd;
    return prices[hour % prices.length].pricePerMwh;
  }

  getConfig(): ArbitrageOptimizerConfig {
    return { ...this.config };
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export default ArbitrageOptimizer;
