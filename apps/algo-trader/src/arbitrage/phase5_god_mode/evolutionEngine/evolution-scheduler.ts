/**
 * EvolutionScheduler — runs the genetic loop: select → breed → backtest →
 * update population → promote top 1% to live.
 * Uses a simple RL controller to adjust mutation rate based on diversity.
 * SIMULATION MODE ONLY.
 */

import { EventEmitter } from 'events';
import { PopulationManager } from './population-manager';
import { GeneticOperators } from './genetic-operators';
import { BacktestEngine } from './backtest-engine';
import { CodeGenerator } from './code-generator';
import type { Genotype } from './genotype';
import type { GeneratedStrategy } from './code-generator';
import { logger } from '../../../utils/logger';

export interface SchedulerConfig {
  populationSize: number;
  evolutionIntervalMs: number;
  promotionRate: number; // top fraction promoted to live [0,1]
  offspringPerCycle: number;
}

export interface EvolutionStatus {
  generation: number;
  populationSize: number;
  topFitness: number;
  diversityScore: number;
  promotedCount: number;
  running: boolean;
}

const DEFAULT_CONFIG: SchedulerConfig = {
  populationSize: 100,
  evolutionIntervalMs: 60_000,
  promotionRate: 0.01,
  offspringPerCycle: 10,
};

export class EvolutionScheduler extends EventEmitter {
  private population: PopulationManager;
  private operators: GeneticOperators;
  private backtester: BacktestEngine;
  private codeGen: CodeGenerator;
  private config: SchedulerConfig;
  private generation = 0;
  private promotedCount = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(config: Partial<SchedulerConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.population = new PopulationManager(this.config.populationSize);
    this.operators = new GeneticOperators();
    this.backtester = new BacktestEngine(200);
    this.codeGen = new CodeGenerator();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    logger.info('[EvolutionEngine] Starting scheduler (SIMULATION MODE)');
    // Evaluate initial population
    this.evaluateAll();
    this.timer = setInterval(() => this.runCycle(), this.config.evolutionIntervalMs);
  }

  stop(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.running = false;
    logger.info('[EvolutionEngine] Scheduler stopped');
  }

  /** Run one full evolution cycle (exposed for testing). */
  runCycle(): GeneratedStrategy[] {
    this.generation++;
    const pool = this.population.getAll();
    if (pool.length < 2) return [];

    // Breed offspring
    const offspring: Genotype[] = [];
    for (let i = 0; i < this.config.offspringPerCycle; i += 2) {
      const pA = this.operators.select(pool);
      const pB = this.operators.select(pool);
      const [cA, cB] = this.operators.crossover(
        pA, pB,
        this.population.newId(),
        this.population.newId(),
      );
      offspring.push(this.operators.mutate(cA), this.operators.mutate(cB));
    }

    // Backtest offspring
    for (const g of offspring) {
      const result = this.backtester.run(g);
      g.fitness = result.fitness;
      this.population.add(g);
    }

    // Trim population to size
    const sorted = this.population.getByFitness();
    const excess = sorted.slice(this.config.populationSize);
    for (const g of excess) { this.population.remove(g.id); }

    // Promote top 1%
    const promoteN = Math.max(1, Math.round(this.config.populationSize * this.config.promotionRate));
    const promoted = this.population.getTop(promoteN);
    const generated = promoted.map((g) => this.codeGen.generate(g));
    this.promotedCount += generated.length;

    // RL: adjust mutation rate based on diversity (std dev of fitness)
    this.adjustMutationRate();

    this.emit('cycle:complete', { generation: this.generation, promoted: generated });
    logger.info(`[EvolutionEngine] Gen ${this.generation}: pop=${this.population.size()} promoted=${generated.length}`);

    return generated;
  }

  private evaluateAll(): void {
    for (const g of this.population.getAll()) {
      const result = this.backtester.run(g);
      this.population.updateFitness(g.id, result.fitness);
    }
  }

  private adjustMutationRate(): void {
    const fitnesses = this.population.getAll().map((g) => g.fitness);
    if (fitnesses.length < 2) return;
    const mean = fitnesses.reduce((s, v) => s + v, 0) / fitnesses.length;
    const variance = fitnesses.reduce((s, v) => s + (v - mean) ** 2, 0) / fitnesses.length;
    const diversity = Math.sqrt(variance);
    // Low diversity → increase mutation to explore; high diversity → reduce
    const targetRate = diversity < 0.01 ? 0.4 : diversity > 0.1 ? 0.1 : 0.2;
    this.operators.setMutationRate(targetRate);
  }

  getStatus(): EvolutionStatus {
    const top = this.population.getTop(1)[0];
    const fitnesses = this.population.getAll().map((g) => g.fitness);
    const mean = fitnesses.reduce((s, v) => s + v, 0) / (fitnesses.length || 1);
    const variance = fitnesses.reduce((s, v) => s + (v - mean) ** 2, 0) / (fitnesses.length || 1);
    return {
      generation: this.generation,
      populationSize: this.population.size(),
      topFitness: top?.fitness ?? 0,
      diversityScore: Math.sqrt(variance),
      promotedCount: this.promotedCount,
      running: this.running,
    };
  }

  isRunning(): boolean { return this.running; }
}
