/**
 * PortfolioOptimizer — simulated annealing optimizer that finds target
 * allocations minimizing risk while maximizing yield, subject to constraints.
 */

import { logger } from '../../../utils/logger';
import type { PortfolioSnapshot } from './exposure-aggregator';
import type { RiskMetrics } from './risk-calculator';

export interface TargetAllocation {
  asset: string;
  targetPct: number;
  currentPct: number;
  adjustmentUsd: number;
}

export interface OptimizationResult {
  allocations: TargetAllocation[];
  riskReduction: number;
  expectedYieldBps: number;
}

interface OptimizerConstraints {
  maxSlippageBps: number;
}

// Cost function weights
const RISK_WEIGHT = 0.6;
const YIELD_WEIGHT = 0.3;
const FEE_WEIGHT = 0.1;

const ANNEALING_ITERATIONS = 1000;
const INITIAL_TEMP = 1.0;
const COOLING_RATE = 0.995;

export class PortfolioOptimizer {
  /**
   * Run simulated annealing to find optimal target allocations.
   * Perturbs current allocation pcts randomly, accepts improvements
   * (and occasional regressions to escape local minima).
   */
  optimize(
    snapshot: PortfolioSnapshot,
    riskMetrics: RiskMetrics[],
    constraints: OptimizerConstraints,
  ): OptimizationResult {
    const assets = [...new Set(snapshot.exposures.map(e => e.asset))];
    if (assets.length === 0) {
      return { allocations: [], riskReduction: 0, expectedYieldBps: 0 };
    }

    const total = snapshot.totalValueUsd || 1;

    // Current allocation percentages
    const currentPcts = new Map<string, number>();
    for (const asset of assets) {
      const assetValue = snapshot.exposures
        .filter(e => e.asset === asset)
        .reduce((s, e) => s + e.valueUsd, 0);
      currentPcts.set(asset, assetValue / total);
    }

    // Build risk and yield maps for cost function
    const riskMap = new Map<string, number>();
    const yieldMap = new Map<string, number>();
    for (const m of riskMetrics) {
      riskMap.set(m.asset, Math.abs(m.delta) / total);
    }
    for (const e of snapshot.exposures) {
      if (e.apy) {
        yieldMap.set(e.asset, (yieldMap.get(e.asset) ?? 0) + e.apy);
      }
    }

    // Start from equal-weight allocation
    let current = new Map<string, number>();
    const evenWeight = 1 / assets.length;
    for (const a of assets) current.set(a, evenWeight);

    let bestState = new Map(current);
    let bestCost = this.costFunction(current, riskMap, yieldMap, currentPcts, constraints.maxSlippageBps);

    let temp = INITIAL_TEMP;

    for (let i = 0; i < ANNEALING_ITERATIONS; i++) {
      const candidate = new Map(current);

      // Perturb: move weight between two random assets
      const idx1 = Math.floor(Math.random() * assets.length);
      const idx2 = (idx1 + 1 + Math.floor(Math.random() * (assets.length - 1))) % assets.length;
      const delta = (Math.random() - 0.5) * 0.05; // ±2.5%
      const a1 = assets[idx1];
      const a2 = assets[idx2];
      candidate.set(a1, Math.max(0, (candidate.get(a1) ?? 0) + delta));
      candidate.set(a2, Math.max(0, (candidate.get(a2) ?? 0) - delta));

      // Renormalize
      const sum = [...candidate.values()].reduce((s, v) => s + v, 0);
      if (sum > 0) for (const [k, v] of candidate) candidate.set(k, v / sum);

      const candidateCost = this.costFunction(candidate, riskMap, yieldMap, currentPcts, constraints.maxSlippageBps);
      const costDiff = candidateCost - bestCost;

      // Accept if better, or probabilistically if worse (Boltzmann criterion)
      if (costDiff < 0 || Math.random() < Math.exp(-costDiff / temp)) {
        current = candidate;
        if (candidateCost < bestCost) {
          bestCost = candidateCost;
          bestState = new Map(current);
        }
      }

      temp *= COOLING_RATE;
    }

    const allocations: TargetAllocation[] = assets.map(asset => {
      const targetPct = bestState.get(asset) ?? 0;
      const currentPct = currentPcts.get(asset) ?? 0;
      const adjustmentUsd = (targetPct - currentPct) * total;
      return { asset, targetPct, currentPct, adjustmentUsd };
    });

    // Estimate improvements
    const initialRisk = [...riskMap.values()].reduce((s, v) => s + v, 0);
    const finalRisk = allocations.reduce((s, a) => s + (riskMap.get(a.asset) ?? 0) * a.targetPct, 0);
    const riskReduction = initialRisk > 0 ? (initialRisk - finalRisk) / initialRisk : 0;
    const expectedYieldBps = allocations.reduce((s, a) => {
      const yieldPct = yieldMap.get(a.asset) ?? 0;
      return s + yieldPct * a.targetPct * 10000;
    }, 0);

    logger.info(`[PortfolioOptimizer] Done: riskReduction=${(riskReduction * 100).toFixed(1)}% yieldBps=${expectedYieldBps.toFixed(0)}`);
    return { allocations, riskReduction, expectedYieldBps };
  }

  private costFunction(
    allocs: Map<string, number>,
    riskMap: Map<string, number>,
    yieldMap: Map<string, number>,
    currentPcts: Map<string, number>,
    maxSlippageBps: number,
  ): number {
    let totalRisk = 0;
    let totalYield = 0;
    let totalFees = 0;

    for (const [asset, pct] of allocs) {
      totalRisk += (riskMap.get(asset) ?? 0) * pct;
      totalYield += (yieldMap.get(asset) ?? 0) * pct;
      // Fee = slippage cost of rebalancing trade
      const tradePct = Math.abs(pct - (currentPcts.get(asset) ?? 0));
      totalFees += tradePct * (maxSlippageBps / 10000);
    }

    return RISK_WEIGHT * totalRisk - YIELD_WEIGHT * totalYield + FEE_WEIGHT * totalFees;
  }
}
