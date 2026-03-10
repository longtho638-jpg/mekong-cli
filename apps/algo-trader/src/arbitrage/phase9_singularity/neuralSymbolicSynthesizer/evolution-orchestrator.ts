/**
 * Evolution Orchestrator — drives the NS3 evolution loop.
 * Coordinates PopulationManager + FitnessPredictor + BacktestEngine.
 * Promotes top strategies above a configurable fitness threshold.
 * Disabled by default.
 */

import { EventEmitter } from 'events';
import { PopulationManager } from './population-manager';
import { FitnessPredictor } from './fitness-predictor';
import { BacktestEngine, HistoricalDataPoint } from './backtest-engine';
import { Individual } from './population-manager';

export interface EvolutionStatus {
  running: boolean;
  generation: number;
  bestFitness: number;
  promotedCount: number;
  predictorAccuracy: number;
  populationSize: number;
}

export interface EvolutionOrchestratorConfig {
  enabled: boolean;
  /** Full-backtest every N generations (others use predictor). */
  backtestEveryN: number;
  /** Individuals with fitness >= threshold are promoted. */
  promotionThreshold: number;
  /** Max generations before auto-stop. */
  maxGenerations: number;
  /** Delay between synchronous generation ticks (ms). 0 = no delay. */
  tickDelayMs: number;
}

const DEFAULT_CONFIG: EvolutionOrchestratorConfig = {
  enabled: false,
  backtestEveryN: 5,
  promotionThreshold: 0.7,
  maxGenerations: 50,
  tickDelayMs: 0,
};

export class EvolutionOrchestrator extends EventEmitter {
  private readonly cfg: EvolutionOrchestratorConfig;
  readonly population: PopulationManager;
  readonly predictor: FitnessPredictor;
  readonly backtest: BacktestEngine;

  private running = false;
  private generation = 0;
  private promotedCount = 0;
  private promotedIndividuals: Individual[] = [];
  private tickTimer: ReturnType<typeof setTimeout> | ReturnType<typeof setImmediate> | null = null;

  constructor(
    population: PopulationManager,
    predictor: FitnessPredictor,
    backtest: BacktestEngine,
    config: Partial<EvolutionOrchestratorConfig> = {},
  ) {
    super();
    this.cfg = { ...DEFAULT_CONFIG, ...config };
    this.population = population;
    this.predictor = predictor;
    this.backtest = backtest;
  }

  /** Begin the evolution loop. Emits 'generation', 'promoted', 'stopped'. */
  start(): void {
    if (!this.cfg.enabled) {
      this.emit('disabled');
      return;
    }
    if (this.running) return;

    this.running = true;
    this.generation = 0;
    this.promotedCount = 0;
    this.promotedIndividuals = [];
    this.population.initialize();
    this.emit('started', this.getStatus());
    this.scheduleTick();
  }

  private scheduleTick(): void {
    if (!this.running) return;
    if (this.cfg.tickDelayMs > 0) {
      this.tickTimer = setTimeout(() => this.tick(), this.cfg.tickDelayMs);
    } else {
      // Use setImmediate so stop() can cancel before the next tick fires
      this.tickTimer = setImmediate(() => this.tick());
    }
  }

  private tick(): void {
    if (!this.running) return;
    if (this.generation >= this.cfg.maxGenerations) {
      this.stop();
      return;
    }

    this.generation++;
    const useBacktest = this.generation % this.cfg.backtestEveryN === 0;
    const individuals = this.population.getPopulation();

    // Evaluate fitness
    const scores = new Map<string, number>();
    const trainSamples: Array<{ ast: unknown; actualFitness: number }> = [];

    for (const ind of individuals) {
      let fitness: number;
      if (useBacktest) {
        const result = this.backtest.run(ind.ast);
        // Normalise Sharpe to 0..1 (clamp [-3, 3] → [0, 1])
        fitness = Math.min(Math.max((result.sharpeRatio + 3) / 6, 0), 1);
        trainSamples.push({ ast: ind.ast, actualFitness: fitness });
      } else {
        const { predictedFitness } = this.predictor.predict(ind.ast);
        fitness = predictedFitness;
      }
      scores.set(ind.id, fitness);
    }

    // Train predictor on backtest ground truth
    if (trainSamples.length > 0) {
      this.predictor.train(trainSamples as Parameters<FitnessPredictor['train']>[0]);
    }

    this.population.updateFitness(scores);

    // Promote top individuals
    for (const ind of individuals) {
      const f = scores.get(ind.id) ?? 0;
      if (f >= this.cfg.promotionThreshold) {
        this.promotedCount++;
        this.promotedIndividuals.push({ ...ind, fitness: f });
        this.emit('promoted', { individual: ind, fitness: f, generation: this.generation });
      }
    }

    const best = this.population.getBest();
    this.emit('generation', {
      generation: this.generation,
      bestFitness: best.fitness,
      useBacktest,
      status: this.getStatus(),
    });

    // Evolve for next generation
    this.population.evolve();
    this.scheduleTick();
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    if (this.tickTimer) {
      clearTimeout(this.tickTimer as ReturnType<typeof setTimeout>);
      clearImmediate(this.tickTimer as ReturnType<typeof setImmediate>);
      this.tickTimer = null;
    }
    this.emit('stopped', this.getStatus());
  }

  getStatus(): EvolutionStatus {
    const best = this.population.getPopulation().length > 0
      ? this.population.getBest().fitness
      : 0;
    return {
      running: this.running,
      generation: this.generation,
      bestFitness: best,
      promotedCount: this.promotedCount,
      predictorAccuracy: this.predictor.getAccuracy(),
      populationSize: this.population.getPopulation().length,
    };
  }

  getPromoted(): Individual[] {
    return [...this.promotedIndividuals];
  }

  loadHistoricalData(data: HistoricalDataPoint[]): void {
    this.backtest.loadData(data);
  }
}
