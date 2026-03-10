/**
 * Neural-Symbolic Strategy Synthesizer (NS3) — barrel exports and entry point.
 * Module 2 of Phase 9 Singularity.
 *
 * Combines context-free grammar, genetic programming, neural fitness prediction,
 * and backtesting to autonomously evolve trading strategies.
 * All sub-systems disabled by default.
 */

// Grammar
export { randomExpression, mutateExpression, crossover, GRAMMAR_RULES } from './grammar';
export type { AstNode, PriceNode, IndicatorNode, BinaryOpNode, UnaryOpNode, ConditionNode, GrammarRule, GrammarConfig } from './grammar';

// Population Manager
export { PopulationManager } from './population-manager';
export type { Individual, PopulationManagerConfig } from './population-manager';

// Fitness Predictor
export { FitnessPredictor, extractFeatures } from './fitness-predictor';
export type { FitnessPredictorConfig, PredictionResult } from './fitness-predictor';

// Backtest Engine
export { BacktestEngine } from './backtest-engine';
export type { BacktestResult, HistoricalDataPoint, BacktestEngineConfig } from './backtest-engine';

// Code Generator
export { CodeGenerator } from './code-generator';
export type { GeneratedStrategy, CodeGeneratorConfig } from './code-generator';

// Evolution Orchestrator
export { EvolutionOrchestrator } from './evolution-orchestrator';
export type { EvolutionStatus, EvolutionOrchestratorConfig } from './evolution-orchestrator';

// ── Direct imports for factory (avoid circular self-reference) ───────────────

import { PopulationManager as _PopulationManager } from './population-manager';
import { FitnessPredictor as _FitnessPredictor } from './fitness-predictor';
import { BacktestEngine as _BacktestEngine } from './backtest-engine';
import { EvolutionOrchestrator as _EvolutionOrchestrator } from './evolution-orchestrator';

// ── Top-level config & factory ───────────────────────────────────────────────

export interface NeuralSymbolicSynthesizerConfig {
  enabled: boolean;
  populationSize: number;
  /** Evolution interval in minutes (used when wiring external scheduler). */
  evolutionIntervalMin: number;
  /** Fitness threshold for strategy promotion. */
  promotionThreshold: number;
  /** Proportion of generations that use full backtest vs predictor. */
  backtestEveryN: number;
  /** Max generations before orchestrator self-stops. */
  maxGenerations: number;
}

const DEFAULT_NS3_CONFIG: NeuralSymbolicSynthesizerConfig = {
  enabled: false,
  populationSize: 50,
  evolutionIntervalMin: 60,
  promotionThreshold: 0.7,
  backtestEveryN: 5,
  maxGenerations: 100,
};

/**
 * Initialise and return a fully wired EvolutionOrchestrator.
 * Does NOT call start() — caller decides when to begin.
 */
export function initNeuralSymbolicSynthesizer(
  config: Partial<NeuralSymbolicSynthesizerConfig> = {},
): _EvolutionOrchestrator {
  const cfg: NeuralSymbolicSynthesizerConfig = { ...DEFAULT_NS3_CONFIG, ...config };

  const population = new _PopulationManager({ populationSize: cfg.populationSize });
  const predictor = new _FitnessPredictor();
  const backtest = new _BacktestEngine();

  return new _EvolutionOrchestrator(population, predictor, backtest, {
    enabled: cfg.enabled,
    promotionThreshold: cfg.promotionThreshold,
    backtestEveryN: cfg.backtestEveryN,
    maxGenerations: cfg.maxGenerations,
    tickDelayMs: 0,
  });
}
