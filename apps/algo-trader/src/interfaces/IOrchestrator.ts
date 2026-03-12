/**
 * Strategy Orchestrator Interface
 *
 * Unified lifecycle management for multiple trading strategies.
 * Aggregates signals with priority weighting.
 */

import { IStrategy, ISignal } from './ISignal';
import { IPolymarketSignal } from './IPolymarket';

/**
 * Strategy priority levels (higher = more important)
 */
export enum StrategyPriority {
  LOW = 1,
  MEDIUM = 5,
  HIGH = 10,
}

/**
 * Default priority mapping for built-in strategies
 */
export const DEFAULT_STRATEGY_PRIORITIES: Record<string, StrategyPriority> = {
  CrossPlatformArb: StrategyPriority.HIGH,
  ListingArb: StrategyPriority.MEDIUM,
  MarketMaker: StrategyPriority.LOW,
};

/**
 * Orchestrator configuration
 */
export interface OrchestratorConfig {
  /** Signal aggregation mode */
  aggregationMode: 'priority' | 'first' | 'all';
  /** Enable/disable individual strategies */
  enabledStrategies?: string[];
  /** Priority override per strategy */
  priorityOverrides?: Record<string, StrategyPriority>;
}

/**
 * Strategy wrapper with metadata
 */
export interface ManagedStrategy {
  /** Strategy instance */
  strategy: IStrategy;
  /** Unique identifier */
  id: string;
  /** Priority level */
  priority: StrategyPriority;
  /** Configuration */
  config?: Record<string, unknown>;
  /** Running state */
  isRunning: boolean;
  /** Signal count */
  signalCount: number;
}

/**
 * Aggregated signal result
 */
export interface AggregatedSignal {
  /** Original strategy signal */
  signal: ISignal | IPolymarketSignal;
  /** Source strategy ID */
  strategyId: string;
  /** Strategy priority */
  priority: StrategyPriority;
  /** Timestamp */
  timestamp: number;
}

/**
 * Orchestrator event types
 */
export interface OrchestratorEvents {
  'strategy:started': (strategyId: string) => void;
  'strategy:stopped': (strategyId: string) => void;
  'signal:generated': (signal: AggregatedSignal) => void;
  'error': (error: Error, strategyId?: string) => void;
}

/**
 * Strategy Orchestrator Interface
 */
export interface IStrategyOrchestrator {
  /**
   * Add a strategy to the orchestrator
   */
  addStrategy(id: string, strategy: IStrategy, priority?: StrategyPriority): Promise<void>;

  /**
   * Remove a strategy from the orchestrator
   */
  removeStrategy(id: string): Promise<void>;

  /**
   * Start a specific strategy
   */
  startStrategy(id: string): Promise<void>;

  /**
   * Stop a specific strategy
   */
  stopStrategy(id: string): Promise<void>;

  /**
   * Start all registered strategies
   */
  startAll(): Promise<void>;

  /**
   * Stop all registered strategies
   */
  stopAll(): Promise<void>;

  /**
   * Get a strategy by ID
   */
  getStrategy(id: string): ManagedStrategy | undefined;

  /**
   * Get all managed strategies
   */
  getStrategies(): ManagedStrategy[];

  /**
   * Update orchestrator configuration
   */
  updateConfig(config: Partial<OrchestratorConfig>): Promise<void>;

  /**
   * Get orchestrator configuration
   */
  getConfig(): OrchestratorConfig;

  /**
   * Check if orchestrator is running
   */
  isRunning(): boolean;
}
