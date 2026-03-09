/**
 * Hedge Optimizer — gradient descent to find optimal hedge ratio
 * for IL mitigation using perps/options as hedging instruments.
 */

import { EventEmitter } from 'events';
import { ImpermanentLossCalculator } from './impermanent-loss-calculator';

export interface HedgeInstrument {
  id: string;
  type: 'perp' | 'option';
  /** Cost as fraction of notional per unit time. */
  costPerUnit: number;
  /** Delta per unit of instrument (how much price exposure it neutralises). */
  deltaPerUnit: number;
}

export interface HedgeOptimizationResult {
  optimalRatio: number;       // fraction of LP notional to hedge
  expectedNetIL: number;      // IL after hedging (USD)
  hedgeCostUsd: number;
  netBenefitUsd: number;      // ilReduction - hedgeCost
  iterations: number;
  converged: boolean;
}

export interface HedgeOptimizerConfig {
  learningRate: number;
  maxIterations: number;
  convergenceTolerance: number;
  dryRun: boolean;
}

const DEFAULT_CONFIG: HedgeOptimizerConfig = {
  learningRate: 0.01,
  maxIterations: 200,
  convergenceTolerance: 1e-6,
  dryRun: true,
};

export class HedgeOptimizer extends EventEmitter {
  private readonly cfg: HedgeOptimizerConfig;
  private readonly ilCalc = new ImpermanentLossCalculator();

  constructor(config: Partial<HedgeOptimizerConfig> = {}) {
    super();
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Gradient descent to minimise: netCost(ratio) = IL(ratio) + hedgeCost(ratio)
   * IL decreases as ratio increases; hedgeCost increases linearly.
   *
   * @param p0 - Entry price
   * @param p1 - Current price
   * @param liquidityUsd - LP position size USD
   * @param instrument - Hedging instrument to use
   */
  optimize(
    p0: number,
    p1: number,
    liquidityUsd: number,
    instrument: HedgeInstrument,
  ): HedgeOptimizationResult {
    let ratio = 0.5; // start at 50% hedge
    let prevCost = Infinity;
    let iterations = 0;
    let converged = false;

    for (let i = 0; i < this.cfg.maxIterations; i++) {
      iterations++;
      const cost = this.netCost(ratio, p0, p1, liquidityUsd, instrument);
      const grad = this.gradient(ratio, p0, p1, liquidityUsd, instrument);

      ratio = Math.max(0, Math.min(1, ratio - this.cfg.learningRate * grad));

      if (Math.abs(prevCost - cost) < this.cfg.convergenceTolerance) {
        converged = true;
        break;
      }
      prevCost = cost;
    }

    const ilResult = this.ilCalc.calculateV2(p0, p1, liquidityUsd);
    const ilAfterHedge = ilResult.ilUsd * (1 - ratio * instrument.deltaPerUnit);
    const hedgeCostUsd = ratio * liquidityUsd * instrument.costPerUnit;
    const netBenefitUsd = (ilResult.ilUsd - ilAfterHedge) - hedgeCostUsd;

    const result: HedgeOptimizationResult = {
      optimalRatio: ratio,
      expectedNetIL: Math.max(0, ilAfterHedge),
      hedgeCostUsd,
      netBenefitUsd,
      iterations,
      converged,
    };

    this.emit('optimization:complete', result);
    return result;
  }

  private netCost(
    ratio: number,
    p0: number,
    p1: number,
    liquidityUsd: number,
    instrument: HedgeInstrument,
  ): number {
    const ilResult = this.ilCalc.calculateV2(p0, p1, liquidityUsd);
    const residualIL = ilResult.ilUsd * Math.max(0, 1 - ratio * instrument.deltaPerUnit);
    const hedgeCost = ratio * liquidityUsd * instrument.costPerUnit;
    return residualIL + hedgeCost;
  }

  /** Numerical gradient (finite difference). */
  private gradient(
    ratio: number,
    p0: number,
    p1: number,
    liquidityUsd: number,
    instrument: HedgeInstrument,
    eps = 1e-4,
  ): number {
    const fPlus = this.netCost(ratio + eps, p0, p1, liquidityUsd, instrument);
    const fMinus = this.netCost(ratio - eps, p0, p1, liquidityUsd, instrument);
    return (fPlus - fMinus) / (2 * eps);
  }
}
