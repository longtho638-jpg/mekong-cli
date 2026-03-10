/**
 * Tests: EvolutionScheduler — promotion logic, cycle execution, RL mutation rate.
 */

import { EvolutionScheduler } from '../../../src/arbitrage/phase5_god_mode/evolutionEngine/evolution-scheduler';

describe('EvolutionScheduler — lifecycle', () => {
  test('starts and reports running', () => {
    const s = new EvolutionScheduler({ populationSize: 10, evolutionIntervalMs: 9_999_999 });
    s.start();
    expect(s.isRunning()).toBe(true);
    s.stop();
    expect(s.isRunning()).toBe(false);
  });

  test('double start is idempotent', () => {
    const s = new EvolutionScheduler({ populationSize: 10, evolutionIntervalMs: 9_999_999 });
    s.start();
    s.start(); // second call should be no-op
    expect(s.isRunning()).toBe(true);
    s.stop();
  });
});

describe('EvolutionScheduler — cycle execution', () => {
  test('runCycle increments generation', () => {
    const s = new EvolutionScheduler({ populationSize: 20, evolutionIntervalMs: 9_999_999, offspringPerCycle: 4 });
    s.start();
    expect(s.getStatus().generation).toBe(0);
    s.runCycle();
    expect(s.getStatus().generation).toBe(1);
    s.runCycle();
    expect(s.getStatus().generation).toBe(2);
    s.stop();
  });

  test('runCycle returns GeneratedStrategy array', () => {
    const s = new EvolutionScheduler({ populationSize: 20, evolutionIntervalMs: 9_999_999, promotionRate: 0.1, offspringPerCycle: 4 });
    s.start();
    const promoted = s.runCycle();
    expect(Array.isArray(promoted)).toBe(true);
    for (const p of promoted) {
      expect(p).toHaveProperty('genotypeId');
      expect(p).toHaveProperty('filename');
      expect(p).toHaveProperty('code');
      expect(p.filename).toMatch(/generated-strategy-/);
    }
    s.stop();
  });

  test('population size stays at configured limit after cycle', () => {
    const size = 15;
    const s = new EvolutionScheduler({ populationSize: size, evolutionIntervalMs: 9_999_999, offspringPerCycle: 6 });
    s.start();
    s.runCycle();
    s.runCycle();
    expect(s.getStatus().populationSize).toBeLessThanOrEqual(size);
    s.stop();
  });

  test('emits cycle:complete event with promoted strategies', (done) => {
    const s = new EvolutionScheduler({ populationSize: 10, evolutionIntervalMs: 9_999_999, promotionRate: 0.2, offspringPerCycle: 4 });
    s.start();
    s.on('cycle:complete', ({ generation, promoted }) => {
      expect(generation).toBe(1);
      expect(Array.isArray(promoted)).toBe(true);
      s.stop();
      done();
    });
    s.runCycle();
  });
});

describe('EvolutionScheduler — promotion logic', () => {
  test('promotedCount increases each cycle', () => {
    const s = new EvolutionScheduler({ populationSize: 20, evolutionIntervalMs: 9_999_999, promotionRate: 0.1, offspringPerCycle: 4 });
    s.start();
    const before = s.getStatus().promotedCount;
    s.runCycle();
    const after = s.getStatus().promotedCount;
    expect(after).toBeGreaterThan(before);
    s.stop();
  });

  test('promoted strategies have valid TypeScript code', () => {
    const s = new EvolutionScheduler({ populationSize: 20, evolutionIntervalMs: 9_999_999, promotionRate: 0.5, offspringPerCycle: 4 });
    s.start();
    const promoted = s.runCycle();
    for (const p of promoted) {
      expect(p.code).toContain('export const strategyMeta');
      expect(p.code).toContain('export function evaluate');
    }
    s.stop();
  });
});

describe('EvolutionScheduler — status', () => {
  test('getStatus returns expected shape', () => {
    const s = new EvolutionScheduler({ populationSize: 10, evolutionIntervalMs: 9_999_999 });
    s.start();
    const status = s.getStatus();
    expect(status).toHaveProperty('generation');
    expect(status).toHaveProperty('populationSize');
    expect(status).toHaveProperty('topFitness');
    expect(status).toHaveProperty('diversityScore');
    expect(status).toHaveProperty('promotedCount');
    expect(status).toHaveProperty('running');
    s.stop();
  });
});
