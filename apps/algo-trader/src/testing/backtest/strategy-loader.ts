/**
 * Strategy Loader for Historical Backtesting
 * Dynamically loads strategy instances based on phase configuration
 */

import { IStrategy, ISignal, SignalType } from '../../interfaces/IStrategy';
import { ICandle } from '../../interfaces/ICandle';
import { PhaseConfig } from './backtest-config-types';

export interface StrategyInstance {
  phaseId: string;
  name: string;
  strategy: IStrategy;
  config: PhaseConfig;
}

export class StrategyLoader {
  private phaseConfigs: Record<string, PhaseConfig>;

  constructor(phaseConfigs: Record<string, PhaseConfig>) {
    this.phaseConfigs = phaseConfigs;
  }

  async loadStrategies(): Promise<StrategyInstance[]> {
    const instances: StrategyInstance[] = [];

    for (const [phaseId, config] of Object.entries(this.phaseConfigs)) {
      if (!config.enabled) continue;

      const strategy = this.createMockStrategy(phaseId, config);
      await strategy.init([]);

      instances.push({
        phaseId,
        name: `${phaseId}-strategy`,
        strategy,
        config,
      });
    }

    return instances;
  }

  createMockStrategy(phaseId: string, config: PhaseConfig): IStrategy {
    // Simple mean-reversion mock: buy on down ticks, sell on up ticks
    let lastPrice = 0;
    let tickCount = 0;
    const signalInterval = typeof config.jitterMeanMs === 'number'
      ? Math.max(1, Math.floor(config.jitterMeanMs / 100))
      : 10;

    return {
      name: `mock-${phaseId}`,

      async init(_history: ICandle[], _cfg?: Record<string, unknown>): Promise<void> {
        lastPrice = 0;
        tickCount = 0;
      },

      async onCandle(candle: ICandle): Promise<ISignal | null> {
        tickCount++;

        // Only emit signal every N ticks to avoid over-trading
        if (tickCount % signalInterval !== 0) {
          return { type: SignalType.NONE, price: candle.close, timestamp: candle.timestamp };
        }

        if (lastPrice === 0) {
          lastPrice = candle.close;
          return { type: SignalType.NONE, price: candle.close, timestamp: candle.timestamp };
        }

        const change = (candle.close - lastPrice) / lastPrice;
        lastPrice = candle.close;

        const threshold = typeof config.sandwichThreshold === 'number'
          ? config.sandwichThreshold
          : 0.001;

        if (change < -threshold) {
          return { type: SignalType.BUY, price: candle.close, timestamp: candle.timestamp, tag: phaseId };
        }
        if (change > threshold) {
          return { type: SignalType.SELL, price: candle.close, timestamp: candle.timestamp, tag: phaseId };
        }

        return { type: SignalType.NONE, price: candle.close, timestamp: candle.timestamp };
      },
    };
  }
}
