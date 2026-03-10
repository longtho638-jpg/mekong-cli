/**
 * GeneticOperators — tournament selection, single-point crossover,
 * random parameter mutation, and fitness evaluation wrapper.
 */

import { ENTRY_CONDITIONS, INDICATORS, cloneGenotype } from './genotype';
import type { Genotype } from './genotype';

export interface GeneticConfig {
  tournamentSize: number; // k candidates in tournament selection
  mutationRate: number;   // probability [0,1] each numeric param mutates
  mutationStrength: number; // std-dev multiplier for Gaussian perturbation
}

const DEFAULT_CONFIG: GeneticConfig = {
  tournamentSize: 3,
  mutationRate: 0.2,
  mutationStrength: 0.15,
};

export class GeneticOperators {
  private config: GeneticConfig;

  constructor(config: Partial<GeneticConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Tournament selection — pick best from k random candidates.
   * @param pool - Candidate genotypes
   */
  select(pool: Genotype[]): Genotype {
    if (pool.length === 0) throw new Error('Empty pool for selection');
    const k = Math.min(this.config.tournamentSize, pool.length);
    let best: Genotype | null = null;
    for (let i = 0; i < k; i++) {
      const candidate = pool[Math.floor(Math.random() * pool.length)];
      if (!best || candidate.fitness > best.fitness) best = candidate;
    }
    return best!;
  }

  /**
   * Single-point crossover between two parents → two offspring.
   * @param parentA - First parent
   * @param parentB - Second parent
   * @param childIdA - Id for first offspring
   * @param childIdB - Id for second offspring
   */
  crossover(parentA: Genotype, parentB: Genotype, childIdA: string, childIdB: string): [Genotype, Genotype] {
    const childA = cloneGenotype(parentA, childIdA);
    const childB = cloneGenotype(parentB, childIdB);

    // Crossover point: swap riskPercent, takeProfitMult, stopLossPct from B to A
    childA.riskPercent = parentB.riskPercent;
    childA.takeProfitMult = parentB.takeProfitMult;
    childB.indicator = parentA.indicator;
    childB.period = parentA.period;
    childA.generation = Math.max(parentA.generation, parentB.generation) + 1;
    childB.generation = childA.generation;

    return [childA, childB];
  }

  /**
   * Mutate a genotype in-place with Gaussian noise on numeric params
   * and random replacement on categorical params.
   */
  mutate(g: Genotype): Genotype {
    const mutated = { ...g };
    const { mutationRate, mutationStrength } = this.config;

    if (Math.random() < mutationRate) {
      mutated.entryCondition = ENTRY_CONDITIONS[Math.floor(Math.random() * ENTRY_CONDITIONS.length)];
    }
    if (Math.random() < mutationRate) {
      mutated.indicator = INDICATORS[Math.floor(Math.random() * INDICATORS.length)];
    }
    if (Math.random() < mutationRate) {
      mutated.period = Math.max(2, Math.min(200, Math.round(g.period + this.gaussian() * 20 * mutationStrength)));
    }
    if (Math.random() < mutationRate) {
      mutated.riskPercent = Math.max(0.1, Math.min(5.0, g.riskPercent + this.gaussian() * 1.0 * mutationStrength));
    }
    if (Math.random() < mutationRate) {
      mutated.takeProfitMult = Math.max(0.5, Math.min(5.0, g.takeProfitMult + this.gaussian() * 1.0 * mutationStrength));
    }
    if (Math.random() < mutationRate) {
      mutated.stopLossPct = Math.max(0.1, Math.min(10.0, g.stopLossPct + this.gaussian() * 2.0 * mutationStrength));
    }
    mutated.fitness = 0; // reset fitness — needs re-evaluation
    return mutated;
  }

  /** Box-Muller Gaussian sample (mean=0, std=1). */
  private gaussian(): number {
    const u = 1 - Math.random();
    const v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /** Adjust mutation rate (RL controller hook). */
  setMutationRate(rate: number): void {
    this.config.mutationRate = Math.max(0.01, Math.min(1.0, rate));
  }

  getMutationRate(): number {
    return this.config.mutationRate;
  }
}
