/**
 * PopulationManager — maintains the in-memory pool of strategy genotypes,
 * ordered by fitness. Provides add/remove/query operations.
 */

import { randomGenotype } from './genotype';
import type { Genotype } from './genotype';

export class PopulationManager {
  private pool: Map<string, Genotype> = new Map();
  private nextId = 0;

  constructor(initialSize = 0) {
    for (let i = 0; i < initialSize; i++) {
      this.addRandom(0);
    }
  }

  /** Add a known genotype to the pool. */
  add(g: Genotype): void {
    this.pool.set(g.id, g);
  }

  /** Generate and add a random genotype. */
  addRandom(generation = 0): Genotype {
    const id = `g${this.nextId++}`;
    const g = randomGenotype(id, generation);
    this.pool.set(id, g);
    return g;
  }

  /** Remove a genotype by id. */
  remove(id: string): boolean {
    return this.pool.delete(id);
  }

  /** Return all genotypes sorted by fitness descending. */
  getByFitness(): Genotype[] {
    return [...this.pool.values()].sort((a, b) => b.fitness - a.fitness);
  }

  /** Return top N genotypes by fitness. */
  getTop(n: number): Genotype[] {
    return this.getByFitness().slice(0, n);
  }

  /** Return all genotypes as array (unordered). */
  getAll(): Genotype[] {
    return [...this.pool.values()];
  }

  /** Current population size. */
  size(): number {
    return this.pool.size;
  }

  /** Update fitness for an existing genotype. */
  updateFitness(id: string, fitness: number): void {
    const g = this.pool.get(id);
    if (g) { g.fitness = fitness; }
  }

  /** Get a genotype by id. */
  get(id: string): Genotype | undefined {
    return this.pool.get(id);
  }

  /** Generate a unique id for offspring. */
  newId(): string {
    return `g${this.nextId++}`;
  }
}
