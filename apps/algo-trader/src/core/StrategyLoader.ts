import { IStrategy } from '../interfaces/IStrategy';
import { RsiSmaStrategy } from '../strategies/RsiSmaStrategy';
import { RsiCrossoverStrategy } from '../strategies/RsiCrossoverStrategy';
import { BollingerBandStrategy } from '../strategies/BollingerBandStrategy';
import { MacdCrossoverStrategy } from '../strategies/MacdCrossoverStrategy';
import { MacdBollingerRsiStrategy } from '../strategies/MacdBollingerRsiStrategy';
import { CrossExchangeArbitrage, TriangularArbitrage, StatisticalArbitrage } from '@agencyos/vibe-arbitrage-engine/strategies';
import { QLearningStrategy } from '../ml/tabular-q-learning-rl-trading-strategy';
import { GruPredictionStrategy } from '../ml/gru-prediction-strategy';
import { GruPricePredictionModel } from '../ml/gru-price-prediction-model';

export class StrategyLoader {
  private static strategies: Map<string, new () => IStrategy> = new Map<string, new () => IStrategy>([
    ['RsiSma', RsiSmaStrategy],
    ['RsiCrossover', RsiCrossoverStrategy],
    ['Bollinger', BollingerBandStrategy],
    ['MacdCrossover', MacdCrossoverStrategy],
    ['MacdBollingerRsi', MacdBollingerRsiStrategy],
    ['CrossExchange', CrossExchangeArbitrage],
    ['Triangular', TriangularArbitrage],
    ['Statistical', StatisticalArbitrage],
  ]);

  /** Factory functions for strategies that need config (ML strategies). */
  private static factories: Map<string, () => IStrategy> = new Map();

  static register(name: string, strategyClass: new () => IStrategy) {
    this.strategies.set(name, strategyClass);
  }

  /** Register a factory function for strategies requiring constructor args. */
  static registerFactory(name: string, factory: () => IStrategy) {
    this.factories.set(name, factory);
  }

  static load(name: string): IStrategy {
    // Check factories first (ML strategies)
    const factory = this.factories.get(name);
    if (factory) return factory();

    const StrategyClass = this.strategies.get(name);
    if (!StrategyClass) {
      throw new Error(`Strategy ${name} not found. Available: ${Array.from(this.getNames()).join(', ')}`);
    }

    return new StrategyClass();
  }

  /** Get all registered strategy names (both class-based and factory-based). */
  static getNames(): string[] {
    return [
      ...Array.from(this.strategies.keys()),
      ...Array.from(this.factories.keys()),
    ];
  }

  /** Load all registered strategies */
  static loadAll(): { name: string; strategy: IStrategy }[] {
    return this.getNames().map(name => ({ name, strategy: this.load(name) }));
  }

  /** Register ML strategies with default configs. */
  static registerMLStrategies(): void {
    this.registerFactory('QLearning', () => new QLearningStrategy());
    this.registerFactory('GruPrediction', () => {
      const model = new GruPricePredictionModel({ gruUnits: 64, denseUnits: 32 });
      model.build();
      return new GruPredictionStrategy(model);
    });
  }
}
