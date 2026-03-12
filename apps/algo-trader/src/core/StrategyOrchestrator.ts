/**
 * Strategy Orchestrator - Unified Strategy Management
 *
 * Manages lifecycle and signal aggregation for multiple strategies.
 * Supports priority-weighted signal selection.
 *
 * Usage:
 *   const orch = new StrategyOrchestrator();
 *   orch.addStrategy('arb', new CrossPlatformArbStrategy(), StrategyPriority.HIGH);
 *   orch.startAll();
 */

import { EventEmitter } from 'events';
import { IStrategy, ISignal } from '../interfaces/ISignal';
import { IPolymarketSignal } from '../interfaces/IPolymarket';
import {
  IStrategyOrchestrator,
  ManagedStrategy,
  OrchestratorConfig,
  OrchestratorEvents,
  AggregatedSignal,
  StrategyPriority,
  DEFAULT_STRATEGY_PRIORITIES,
} from '../interfaces/IOrchestrator';
import { logger } from '../utils/logger';

export class StrategyOrchestrator
  extends EventEmitter
  implements IStrategyOrchestrator
{
  private strategies = new Map<string, ManagedStrategy>();
  private config: OrchestratorConfig = {
    aggregationMode: 'priority',
    enabledStrategies: undefined,
    priorityOverrides: undefined,
  };
  private running = false;

  /**
   * Add a strategy to the orchestrator
   */
  async addStrategy(
    id: string,
    strategy: IStrategy,
    priority?: StrategyPriority,
  ): Promise<void> {
    if (this.strategies.has(id)) {
      throw new Error(`Strategy '${id}' already exists`);
    }

    const resolvedPriority =
      priority ??
      this.config.priorityOverrides?.[id] ??
      DEFAULT_STRATEGY_PRIORITIES[strategy.name] ??
      StrategyPriority.MEDIUM;

    const managed: ManagedStrategy = {
      strategy,
      id,
      priority: resolvedPriority,
      isRunning: false,
      signalCount: 0,
    };

    this.strategies.set(id, managed);
    logger.info(`[Orchestrator] Added strategy: ${id} (priority: ${resolvedPriority})`);
  }

  /**
   * Remove a strategy from the orchestrator
   */
  async removeStrategy(id: string): Promise<void> {
    const managed = this.strategies.get(id);
    if (!managed) {
      logger.warn(`[Orchestrator] Strategy '${id}' not found`);
      return;
    }

    if (managed.isRunning) {
      await this.stopStrategy(id);
    }

    this.strategies.delete(id);
    logger.info(`[Orchestrator] Removed strategy: ${id}`);
  }

  /**
   * Start a specific strategy
   */
  async startStrategy(id: string): Promise<void> {
    const managed = this.strategies.get(id);
    if (!managed) {
      throw new Error(`Strategy '${id}' not found`);
    }

    if (managed.isRunning) {
      logger.warn(`[Orchestrator] Strategy '${id}' already running`);
      return;
    }

    try {
      if (managed.strategy.onStart) {
        await managed.strategy.onStart();
      }
      managed.isRunning = true;
      this.running = true;
      this.emit('strategy:started', id);
      logger.info(`[Orchestrator] Started strategy: ${id}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`[Orchestrator] Failed to start '${id}': ${err.message}`);
      this.emit('error', err, id);
      throw err;
    }
  }

  /**
   * Stop a specific strategy
   */
  async stopStrategy(id: string): Promise<void> {
    const managed = this.strategies.get(id);
    if (!managed) {
      logger.warn(`[Orchestrator] Strategy '${id}' not found`);
      return;
    }

    if (!managed.isRunning) {
      return;
    }

    try {
      if (managed.strategy.onFinish) {
        await managed.strategy.onFinish();
      }
      managed.isRunning = false;
      this.emit('strategy:stopped', id);
      logger.info(`[Orchestrator] Stopped strategy: ${id}`);

      // Check if all strategies stopped
      if (Array.from(this.strategies.values()).every((s) => !s.isRunning)) {
        this.running = false;
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`[Orchestrator] Failed to stop '${id}': ${err.message}`);
      this.emit('error', err, id);
      throw err;
    }
  }

  /**
   * Start all registered strategies
   */
  async startAll(): Promise<void> {
    const enabled = this.getEnabledStrategies();
    await Promise.all(enabled.map((s) => this.startStrategy(s.id)));
    logger.info(`[Orchestrator] Started ${enabled.length} strategies`);
  }

  /**
   * Stop all registered strategies
   */
  async stopAll(): Promise<void> {
    const running = Array.from(this.strategies.values()).filter((s) => s.isRunning);
    await Promise.all(running.map((s) => this.stopStrategy(s.id)));
    this.running = false;
    logger.info(`[Orchestrator] Stopped ${running.length} strategies`);
  }

  /**
   * Get a strategy by ID
   */
  getStrategy(id: string): ManagedStrategy | undefined {
    return this.strategies.get(id);
  }

  /**
   * Get all managed strategies
   */
  getStrategies(): ManagedStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Update orchestrator configuration
   */
  async updateConfig(config: Partial<OrchestratorConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    logger.info(`[Orchestrator] Config updated: ${JSON.stringify(this.config)}`);
  }

  /**
   * Get orchestrator configuration
   */
  getConfig(): OrchestratorConfig {
    return { ...this.config };
  }

  /**
   * Check if orchestrator is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Aggregate signals from multiple strategies with priority weighting
   */
  aggregateSignals(signals: AggregatedSignal[]): AggregatedSignal | null {
    if (signals.length === 0) return null;

    switch (this.config.aggregationMode) {
      case 'first':
        return signals[0];

      case 'all':
        // Return highest priority, but log all
        const sorted = [...signals].sort(
          (a, b) => b.priority - a.priority,
        );
        sorted.forEach((s) =>
          logger.debug(`[Orchestrator] Signal: ${s.strategyId} (P${s.priority})`),
        );
        return sorted[0];

      case 'priority':
      default:
        // Return highest priority signal
        return signals.reduce((best, current) =>
          current.priority > best.priority ? current : best,
        );
    }
  }

  /**
   * Process a signal from a strategy
   */
  processSignal(
    strategyId: string,
    signal: ISignal | IPolymarketSignal,
  ): AggregatedSignal | null {
    const managed = this.strategies.get(strategyId);
    if (!managed || !managed.isRunning) {
      return null;
    }

    managed.signalCount++;
    const aggregated: AggregatedSignal = {
      signal,
      strategyId,
      priority: managed.priority,
      timestamp: Date.now(),
    };

    this.emit('signal:generated', aggregated);
    return aggregated;
  }

  /**
   * Get enabled strategies based on config
   */
  private getEnabledStrategies(): ManagedStrategy[] {
    if (!this.config.enabledStrategies) {
      return Array.from(this.strategies.values());
    }
    return Array.from(this.strategies.values()).filter((s) =>
      this.config.enabledStrategies?.includes(s.id),
    );
  }

  /**
   * Get orchestrator stats
   */
  getStats(): {
    totalStrategies: number;
    runningStrategies: number;
    totalSignals: number;
    config: OrchestratorConfig;
  } {
    const values = Array.from(this.strategies.values());
    return {
      totalStrategies: values.length,
      runningStrategies: values.filter((s) => s.isRunning).length,
      totalSignals: values.reduce((sum, s) => sum + s.signalCount, 0),
      config: { ...this.config },
    };
  }
}

export default StrategyOrchestrator;
