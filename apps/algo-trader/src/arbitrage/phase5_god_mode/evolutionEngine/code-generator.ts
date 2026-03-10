/**
 * CodeGenerator — produces a valid TypeScript strategy file from a genotype.
 * Generated files are self-contained and export a default strategy object.
 * SIMULATION MODE ONLY — no real execution of generated code.
 */

import type { Genotype } from './genotype';

export interface GeneratedStrategy {
  genotypeId: string;
  filename: string;
  code: string;
}

/**
 * Generates TypeScript strategy source from a genotype.
 * The output is a string; actual hot-loading is handled externally.
 */
export class CodeGenerator {
  /**
   * Generate TypeScript source code for the given genotype.
   * @param g - Strategy genotype
   */
  generate(g: Genotype): GeneratedStrategy {
    const filename = `generated-strategy-${g.id}.ts`;
    const code = this.buildSource(g);
    return { genotypeId: g.id, filename, code };
  }

  private buildSource(g: Genotype): string {
    return `/**
 * Auto-generated strategy: ${g.id}
 * Generation: ${g.generation} | Fitness: ${g.fitness.toFixed(4)}
 * DO NOT EDIT — regenerate via EvolutionEngine
 */

export interface StrategySignal {
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
}

export const strategyMeta = {
  id: '${g.id}',
  entryCondition: '${g.entryCondition}',
  indicator: '${g.indicator}',
  period: ${g.period},
  asset: '${g.asset}',
  riskPercent: ${g.riskPercent.toFixed(4)},
  takeProfitMult: ${g.takeProfitMult.toFixed(4)},
  stopLossPct: ${g.stopLossPct.toFixed(4)},
  generation: ${g.generation},
  fitness: ${g.fitness.toFixed(6)},
} as const;

/**
 * Evaluate market data and return a trading signal.
 * @param prices - Recent price array (newest last)
 */
export function evaluate(prices: number[]): StrategySignal {
  const period = ${g.period};
  if (prices.length < period) return { action: 'hold', confidence: 0 };

  const slice = prices.slice(-period);
  const ma = slice.reduce((s, v) => s + v, 0) / slice.length;
  const current = prices[prices.length - 1];
  const prev = prices[prices.length - 2] ?? current;

  const condition = '${g.entryCondition}';
  if (condition === 'crossAbove' && current > ma && prev <= ma) {
    return { action: 'buy', confidence: Math.min((current - ma) / ma, 1) };
  }
  if (condition === 'crossBelow' && current < ma && prev >= ma) {
    return { action: 'sell', confidence: Math.min((ma - current) / ma, 1) };
  }
  if (condition === 'breakout' && current > ma * 1.005) {
    return { action: 'buy', confidence: 0.7 };
  }
  if (condition === 'meanRevert' && current < ma * 0.995) {
    return { action: 'buy', confidence: 0.6 };
  }
  return { action: 'hold', confidence: 0 };
}

export default { meta: strategyMeta, evaluate };
`;
  }
}
