/**
 * EvolutionEngine module barrel — Meta-Strategy Genetic Synthesizer.
 * SIMULATION MODE ONLY.
 */

export { EvolutionScheduler } from './evolution-scheduler';
export type { SchedulerConfig, EvolutionStatus } from './evolution-scheduler';
export { PopulationManager } from './population-manager';
export { GeneticOperators } from './genetic-operators';
export type { GeneticConfig } from './genetic-operators';
export { BacktestEngine } from './backtest-engine';
export type { BacktestResult } from './backtest-engine';
export { CodeGenerator } from './code-generator';
export type { GeneratedStrategy } from './code-generator';
export { randomGenotype, cloneGenotype, ENTRY_CONDITIONS, INDICATORS } from './genotype';
export type { Genotype, EntryCondition, Indicator } from './genotype';

/** Convenience: create and start an EvolutionScheduler. */
export function start(config?: Partial<import('./evolution-scheduler').SchedulerConfig>): import('./evolution-scheduler').EvolutionScheduler {
  const { EvolutionScheduler } = require('./evolution-scheduler') as typeof import('./evolution-scheduler');
  const scheduler = new EvolutionScheduler(config);
  scheduler.start();
  return scheduler;
}
