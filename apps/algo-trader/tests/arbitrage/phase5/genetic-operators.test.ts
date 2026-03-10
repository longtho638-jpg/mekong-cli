/**
 * Tests: GeneticOperators — mutation, crossover, tournament selection.
 */

import { GeneticOperators } from '../../../src/arbitrage/phase5_god_mode/evolutionEngine/genetic-operators';
import { randomGenotype } from '../../../src/arbitrage/phase5_god_mode/evolutionEngine/genotype';
import type { Genotype } from '../../../src/arbitrage/phase5_god_mode/evolutionEngine/genotype';

function makeGenotype(id: string, fitness: number): Genotype {
  const g = randomGenotype(id, 0);
  g.fitness = fitness;
  return g;
}

describe('GeneticOperators — tournament selection', () => {
  const ops = new GeneticOperators({ tournamentSize: 3 });

  test('selects from non-empty pool without error', () => {
    const pool = [makeGenotype('a', 1.0), makeGenotype('b', 2.0), makeGenotype('c', 0.5)];
    const selected = ops.select(pool);
    expect(['a', 'b', 'c']).toContain(selected.id);
  });

  test('throws on empty pool', () => {
    expect(() => ops.select([])).toThrow();
  });

  test('selects single element from pool of one', () => {
    const pool = [makeGenotype('only', 5.0)];
    expect(ops.select(pool).id).toBe('only');
  });

  test('tends to select higher-fitness candidates (statistical)', () => {
    // Run 200 selections — best fitness should win majority
    const pool = [makeGenotype('low', 0.1), makeGenotype('high', 10.0), makeGenotype('mid', 1.0)];
    let highCount = 0;
    for (let i = 0; i < 200; i++) {
      if (ops.select(pool).id === 'high') highCount++;
    }
    expect(highCount).toBeGreaterThan(100); // statistically likely
  });
});

describe('GeneticOperators — crossover', () => {
  const ops = new GeneticOperators();

  test('produces two offspring with correct ids', () => {
    const pA = makeGenotype('p1', 1.0);
    const pB = makeGenotype('p2', 2.0);
    const [cA, cB] = ops.crossover(pA, pB, 'c1', 'c2');
    expect(cA.id).toBe('c1');
    expect(cB.id).toBe('c2');
  });

  test('offspring fitness is reset to 0', () => {
    const pA = makeGenotype('p1', 5.0);
    const pB = makeGenotype('p2', 3.0);
    const [cA, cB] = ops.crossover(pA, pB, 'c1', 'c2');
    expect(cA.fitness).toBe(0);
    expect(cB.fitness).toBe(0);
  });

  test('offspring generation is parent max + 1', () => {
    const pA = randomGenotype('p1', 3);
    const pB = randomGenotype('p2', 5);
    const [cA, cB] = ops.crossover(pA, pB, 'c1', 'c2');
    expect(cA.generation).toBe(6);
    expect(cB.generation).toBe(6);
  });

  test('offspring inherit mixed params from both parents', () => {
    const pA = randomGenotype('p1', 0);
    pA.riskPercent = 1.0;
    pA.indicator = 'SMA';
    const pB = randomGenotype('p2', 0);
    pB.riskPercent = 3.0;
    pB.indicator = 'RSI';
    const [cA, cB] = ops.crossover(pA, pB, 'c1', 'c2');
    // cA gets riskPercent from B
    expect(cA.riskPercent).toBe(pB.riskPercent);
    // cB gets indicator from A
    expect(cB.indicator).toBe(pA.indicator);
  });
});

describe('GeneticOperators — mutation', () => {
  const ops = new GeneticOperators({ mutationRate: 1.0, mutationStrength: 0.5 });

  test('mutated genotype has reset fitness', () => {
    const g = makeGenotype('g1', 9.9);
    const mutated = ops.mutate(g);
    expect(mutated.fitness).toBe(0);
  });

  test('mutated period stays within [2, 200]', () => {
    for (let i = 0; i < 50; i++) {
      const g = randomGenotype(`g${i}`, 0);
      const mutated = ops.mutate(g);
      expect(mutated.period).toBeGreaterThanOrEqual(2);
      expect(mutated.period).toBeLessThanOrEqual(200);
    }
  });

  test('mutated riskPercent stays within [0.1, 5.0]', () => {
    for (let i = 0; i < 50; i++) {
      const g = randomGenotype(`g${i}`, 0);
      const mutated = ops.mutate(g);
      expect(mutated.riskPercent).toBeGreaterThanOrEqual(0.1);
      expect(mutated.riskPercent).toBeLessThanOrEqual(5.0);
    }
  });

  test('mutation rate can be adjusted via setMutationRate', () => {
    const ops2 = new GeneticOperators({ mutationRate: 0.5 });
    ops2.setMutationRate(0.9);
    expect(ops2.getMutationRate()).toBeCloseTo(0.9, 5);
  });

  test('setMutationRate clamps to [0.01, 1.0]', () => {
    const ops2 = new GeneticOperators();
    ops2.setMutationRate(99);
    expect(ops2.getMutationRate()).toBe(1.0);
    ops2.setMutationRate(-1);
    expect(ops2.getMutationRate()).toBe(0.01);
  });
});
