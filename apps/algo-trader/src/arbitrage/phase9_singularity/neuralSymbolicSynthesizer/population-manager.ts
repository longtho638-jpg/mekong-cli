/**
 * Population Manager — maintains a pool of strategy ASTs with fitness scores.
 * Implements genetic programming: tournament selection, crossover, mutation.
 */

import { AstNode, randomExpression, mutateExpression, crossover } from './grammar';

export interface Individual {
  id: string;
  ast: AstNode;
  fitness: number; // higher is better
  generation: number;
}

export interface PopulationManagerConfig {
  populationSize: number;
  tournamentSize: number;
  mutationRate: number; // 0..1
  eliteCount: number; // top N survive unchanged
  maxGenerations: number;
}

const DEFAULT_CONFIG: PopulationManagerConfig = {
  populationSize: 50,
  tournamentSize: 5,
  mutationRate: 0.2,
  eliteCount: 3,
  maxGenerations: 100,
};

let _idCounter = 0;
function nextId(): string {
  return `ind-${++_idCounter}`;
}

export class PopulationManager {
  private readonly cfg: PopulationManagerConfig;
  private population: Individual[] = [];
  private currentGeneration = 0;
  private rng: () => number;

  constructor(config: Partial<PopulationManagerConfig> = {}, rng: () => number = Math.random) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
    this.rng = rng;
  }

  /** Seed the population with random individuals (fitness = 0). */
  initialize(): void {
    this.population = [];
    this.currentGeneration = 0;
    for (let i = 0; i < this.cfg.populationSize; i++) {
      this.population.push({
        id: nextId(),
        ast: randomExpression(0, this.rng),
        fitness: 0,
        generation: 0,
      });
    }
  }

  /** Update fitness scores for the current population (batch). */
  updateFitness(scores: Map<string, number>): void {
    for (const ind of this.population) {
      const score = scores.get(ind.id);
      if (score !== undefined) ind.fitness = score;
    }
  }

  /**
   * Advance one generation: selection → crossover → mutation.
   * Elites are preserved unchanged.
   */
  evolve(): void {
    if (this.population.length === 0) throw new Error('Call initialize() first');

    this.currentGeneration++;
    const sorted = [...this.population].sort((a, b) => b.fitness - a.fitness);

    // Preserve elites
    const nextGen: Individual[] = sorted
      .slice(0, this.cfg.eliteCount)
      .map((ind) => ({ ...ind, generation: this.currentGeneration }));

    // Fill remainder with offspring
    while (nextGen.length < this.cfg.populationSize) {
      const p1 = this.tournamentSelect(sorted);
      const p2 = this.tournamentSelect(sorted);
      const [child1Ast, child2Ast] = crossover(p1.ast, p2.ast, this.rng);

      const applyMutation = (ast: AstNode): AstNode =>
        this.rng() < this.cfg.mutationRate ? mutateExpression(ast, this.rng) : ast;

      nextGen.push({
        id: nextId(),
        ast: applyMutation(child1Ast),
        fitness: 0,
        generation: this.currentGeneration,
      });

      if (nextGen.length < this.cfg.populationSize) {
        nextGen.push({
          id: nextId(),
          ast: applyMutation(child2Ast),
          fitness: 0,
          generation: this.currentGeneration,
        });
      }
    }

    this.population = nextGen.slice(0, this.cfg.populationSize);
  }

  /** Tournament selection — pick best of K random individuals. */
  private tournamentSelect(sorted: Individual[]): Individual {
    let best: Individual | null = null;
    const k = Math.min(this.cfg.tournamentSize, sorted.length);
    for (let i = 0; i < k; i++) {
      const candidate = sorted[Math.floor(this.rng() * sorted.length)];
      if (!best || candidate.fitness > best.fitness) best = candidate;
    }
    return best!;
  }

  /** Return the individual with the highest fitness. */
  getBest(): Individual {
    if (this.population.length === 0) throw new Error('Population is empty');
    return [...this.population].sort((a, b) => b.fitness - a.fitness)[0];
  }

  getPopulation(): Individual[] {
    return [...this.population];
  }

  getCurrentGeneration(): number {
    return this.currentGeneration;
  }

  getConfig(): PopulationManagerConfig {
    return { ...this.cfg };
  }
}
