/**
 * StrategyOrchestrator Tests
 *
 * Tests for the Strategy Orchestrator lifecycle management
 * and signal aggregation functionality.
 */

import { StrategyOrchestrator } from '../../src/core/StrategyOrchestrator';
import {
  StrategyPriority,
  DEFAULT_STRATEGY_PRIORITIES,
  IStrategyOrchestrator,
  ManagedStrategy,
} from '../../src/interfaces/IOrchestrator';
import { IStrategy, ISignal, SignalType } from '../../src/interfaces/ISignal';

/**
 * Mock strategy for testing
 */
class MockStrategy implements IStrategy {
  name = 'MockStrategy';

  async init(): Promise<void> {}
  async onCandle(): Promise<ISignal | null> { return null; }
  async onStart?(): Promise<void> {}
  async onFinish?(): Promise<void> {}
}

describe('StrategyOrchestrator', () => {
  let orchestrator: StrategyOrchestrator;

  beforeEach(() => {
    orchestrator = new StrategyOrchestrator();
  });

  afterEach(async () => {
    await orchestrator.stopAll();
  });

  describe('Lifecycle Management', () => {
    it('should add and retrieve strategies', async () => {
      const strategy = new MockStrategy();
      await orchestrator.addStrategy('mock', strategy, StrategyPriority.HIGH);

      const retrieved = orchestrator.getStrategy('mock');
      expect(retrieved).toBeDefined();
      expect(retrieved?.strategy).toBe(strategy);
      expect(retrieved?.priority).toBe(StrategyPriority.HIGH);
    });

    it('should assign default priority when not specified', async () => {
      const strategy = new MockStrategy();
      await orchestrator.addStrategy('mock', strategy);

      const retrieved = orchestrator.getStrategy('mock');
      expect(retrieved?.priority).toBe(StrategyPriority.MEDIUM);
    });

    it('should start and stop individual strategies', async () => {
      const strategy = new MockStrategy();
      await orchestrator.addStrategy('mock', strategy);

      await orchestrator.startStrategy('mock');
      expect(orchestrator.getStrategy('mock')?.isRunning).toBe(true);

      await orchestrator.stopStrategy('mock');
      expect(orchestrator.getStrategy('mock')?.isRunning).toBe(false);
    });

    it('should start and stop all strategies', async () => {
      await orchestrator.addStrategy('mock1', new MockStrategy());
      await orchestrator.addStrategy('mock2', new MockStrategy());
      await orchestrator.addStrategy('mock3', new MockStrategy());

      await orchestrator.startAll();
      const strategies = orchestrator.getStrategies();
      expect(strategies.every((s) => s.isRunning)).toBe(true);

      await orchestrator.stopAll();
      const stopped = orchestrator.getStrategies();
      expect(stopped.every((s) => !s.isRunning)).toBe(true);
    });

    it('should remove strategy and stop if running', async () => {
      await orchestrator.addStrategy('mock', new MockStrategy());
      await orchestrator.startStrategy('mock');

      await orchestrator.removeStrategy('mock');
      expect(orchestrator.getStrategy('mock')).toBeUndefined();
    });

    it('should throw error adding duplicate strategy', async () => {
      await orchestrator.addStrategy('mock', new MockStrategy());
      await expect(
        orchestrator.addStrategy('mock', new MockStrategy())
      ).rejects.toThrow('already exists');
    });

    it('should handle start non-existent strategy', async () => {
      await expect(
        orchestrator.startStrategy('nonexistent')
      ).rejects.toThrow('not found');
    });
  });

  describe('Signal Aggregation', () => {
    const createSignal = (priority: StrategyPriority, price: number) => ({
      signal: { type: SignalType.BUY, price, timestamp: Date.now() },
      strategyId: `strategy-${priority}`,
      priority,
      timestamp: Date.now(),
    });

    it('should aggregate signals with priority weighting', () => {
      const lowSignal = createSignal(StrategyPriority.LOW, 0.5);
      const highSignal = createSignal(StrategyPriority.HIGH, 0.6);

      const result = orchestrator.aggregateSignals([lowSignal, highSignal]);
      expect(result?.priority).toBe(StrategyPriority.HIGH);
      expect(result?.strategyId).toBe(`strategy-${StrategyPriority.HIGH}`);
    });

    it('should return null for empty signals array', () => {
      const result = orchestrator.aggregateSignals([]);
      expect(result).toBeNull();
    });

    it('should return first signal in first mode', async () => {
      await orchestrator.updateConfig({ aggregationMode: 'first' });

      const lowSignal = createSignal(StrategyPriority.LOW, 0.5);
      const highSignal = createSignal(StrategyPriority.HIGH, 0.6);

      const result = orchestrator.aggregateSignals([lowSignal, highSignal]);
      expect(result?.strategyId).toBe(`strategy-${StrategyPriority.LOW}`);
    });

    it('should return highest priority in priority mode (default)', () => {
      const lowSignal = createSignal(StrategyPriority.LOW, 0.5);
      const medSignal = createSignal(StrategyPriority.MEDIUM, 0.55);
      const highSignal = createSignal(StrategyPriority.HIGH, 0.6);

      const result = orchestrator.aggregateSignals([lowSignal, medSignal, highSignal]);
      expect(result?.priority).toBe(StrategyPriority.HIGH);
    });

    it('should process signals from strategies', async () => {
      await orchestrator.addStrategy('mock', new MockStrategy(), StrategyPriority.MEDIUM);
      await orchestrator.startStrategy('mock');

      const signal: ISignal = { type: SignalType.BUY, price: 0.5, timestamp: Date.now() };
      const result = orchestrator.processSignal('mock', signal);

      expect(result).toBeDefined();
      expect(result?.strategyId).toBe('mock');
      expect(result?.priority).toBe(StrategyPriority.MEDIUM);
    });

    it('should not process signals from stopped strategies', async () => {
      await orchestrator.addStrategy('mock', new MockStrategy());
      // Don't start the strategy

      const signal: ISignal = { type: SignalType.BUY, price: 0.5, timestamp: Date.now() };
      const result = orchestrator.processSignal('mock', signal);

      expect(result).toBeNull();
    });

    it('should not process signals from non-existent strategies', () => {
      const signal: ISignal = { type: SignalType.BUY, price: 0.5, timestamp: Date.now() };
      const result = orchestrator.processSignal('nonexistent', signal);

      expect(result).toBeNull();
    });
  });

  describe('Event Emission', () => {
    it('should emit strategy:started event', async () => {
      const startedPromise = new Promise<string>((resolve) => {
        orchestrator.once('strategy:started', resolve);
      });

      await orchestrator.addStrategy('mock', new MockStrategy());
      await orchestrator.startStrategy('mock');

      const eventId = await startedPromise;
      expect(eventId).toBe('mock');
    });

    it('should emit strategy:stopped event', async () => {
      await orchestrator.addStrategy('mock', new MockStrategy());
      await orchestrator.startStrategy('mock');

      const stoppedPromise = new Promise<string>((resolve) => {
        orchestrator.once('strategy:stopped', resolve);
      });

      await orchestrator.stopStrategy('mock');
      const eventId = await stoppedPromise;
      expect(eventId).toBe('mock');
    });

    it('should emit signal:generated event', async () => {
      await orchestrator.addStrategy('mock', new MockStrategy(), StrategyPriority.MEDIUM);
      await orchestrator.startStrategy('mock');

      const signalPromise = new Promise<any>((resolve) => {
        orchestrator.once('signal:generated', resolve);
      });

      const signal: ISignal = { type: SignalType.BUY, price: 0.5, timestamp: Date.now() };
      orchestrator.processSignal('mock', signal);

      const emitted = await signalPromise;
      expect(emitted.strategyId).toBe('mock');
      expect(emitted.priority).toBe(StrategyPriority.MEDIUM);
    });
  });

  describe('Configuration', () => {
    it('should update and retrieve configuration', async () => {
      const initialConfig = orchestrator.getConfig();
      expect(initialConfig.aggregationMode).toBe('priority');

      await orchestrator.updateConfig({
        aggregationMode: 'first',
        enabledStrategies: ['mock'],
      });

      const updatedConfig = orchestrator.getConfig();
      expect(updatedConfig.aggregationMode).toBe('first');
      expect(updatedConfig.enabledStrategies).toEqual(['mock']);
    });

    it('should return all strategies when enabledStrategies is undefined', async () => {
      await orchestrator.addStrategy('mock1', new MockStrategy());
      await orchestrator.addStrategy('mock2', new MockStrategy());

      await orchestrator.updateConfig({ enabledStrategies: undefined });

      const strategies = orchestrator.getStrategies();
      expect(strategies.length).toBe(2);
    });
  });

  describe('Stats', () => {
    it('should return orchestrator stats', async () => {
      await orchestrator.addStrategy('mock1', new MockStrategy());
      await orchestrator.addStrategy('mock2', new MockStrategy());

      await orchestrator.startStrategy('mock1');

      const signal: ISignal = { type: SignalType.BUY, price: 0.5, timestamp: Date.now() };
      orchestrator.processSignal('mock1', signal);

      const stats = orchestrator.getStats();
      expect(stats.totalStrategies).toBe(2);
      expect(stats.runningStrategies).toBe(1);
      expect(stats.totalSignals).toBe(1);
    });

    it('should return isRunning status', async () => {
      expect(orchestrator.isRunning()).toBe(false);

      await orchestrator.addStrategy('mock', new MockStrategy());
      await orchestrator.startStrategy('mock');

      expect(orchestrator.isRunning()).toBe(true);

      await orchestrator.stopStrategy('mock');
      expect(orchestrator.isRunning()).toBe(false);
    });
  });

  describe('Default Strategy Priorities', () => {
    it('should have correct default priorities for built-in strategies', () => {
      expect(DEFAULT_STRATEGY_PRIORITIES.CrossPlatformArb).toBe(StrategyPriority.HIGH);
      expect(DEFAULT_STRATEGY_PRIORITIES.ListingArb).toBe(StrategyPriority.MEDIUM);
      expect(DEFAULT_STRATEGY_PRIORITIES.MarketMaker).toBe(StrategyPriority.LOW);
    });
  });
});
