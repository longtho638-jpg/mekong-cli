import { IStrategy } from '../interfaces/IStrategy';
import { RsiSmaStrategy } from '../strategies/RsiSmaStrategy';
import { RsiCrossoverStrategy } from '../strategies/RsiCrossoverStrategy';
import { BollingerBandStrategy } from '../strategies/BollingerBandStrategy';
import { MacdCrossoverStrategy } from '../strategies/MacdCrossoverStrategy';
import { MacdBollingerRsiStrategy } from '../strategies/MacdBollingerRsiStrategy';
import { CrossExchangeArbitrage, TriangularArbitrage, StatisticalArbitrage } from '@agencyos/vibe-arbitrage-engine/strategies';
import { LicenseService, LicenseTier, LicenseError } from '../lib/raas-gate';

// Deferred imports for ML strategies (only loaded when needed)
import type { QLearningStrategy as QLearningStrategyType } from '../ml/tabular-q-learning-rl-trading-strategy';
import type { GruPredictionStrategy as GruPredictionStrategyType } from '../ml/gru-prediction-strategy';
import type { GruPricePredictionModel } from '../ml/gru-price-prediction-model';

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

  /** Factory functions for strategies that need config (ML strategies - PREMIUM). */
  private static factories: Map<string, () => IStrategy> = new Map();

  static register(name: string, strategyClass: new () => IStrategy) {
    this.strategies.set(name, strategyClass);
  }

  /** Register a factory function for strategies requiring constructor args. */
  static registerFactory(name: string, factory: () => IStrategy) {
    this.factories.set(name, factory);
  }

  /**
   * Load strategy by name.
   * ML strategies (QLearning, GruPrediction) require PRO license.
   */
  static load(name: string): IStrategy {
    // Check factories first (ML strategies - premium gated)
    const factory = this.factories.get(name);
    if (factory) {
      // Verify license for ML strategies
      const licenseService = LicenseService.getInstance();
      if (!licenseService.hasTier(LicenseTier.PRO)) {
        throw new LicenseError(
          `Strategy "${name}" requires PRO license`,
          LicenseTier.PRO,
          'ml_strategies'
        );
      }
      return factory();
    }

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

  /**
   * Register ML strategies with default configs.
   * PREMIUM FEATURE: Requires PRO license to register.
   */
  static registerMLStrategies(): void {
    const licenseService = LicenseService.getInstance();
    if (!licenseService.hasTier(LicenseTier.PRO)) {
      throw new LicenseError(
        'Registering ML strategies requires PRO license',
        LicenseTier.PRO,
        'ml_strategies'
      );
    }

    // Lazy load ML modules to avoid import errors when TF.js not available
    const { QLearningStrategy } = require('../ml/tabular-q-learning-rl-trading-strategy');
    const { GruPredictionStrategy } = require('../ml/gru-prediction-strategy');
    const { GruPricePredictionModel } = require('../ml/gru-price-prediction-model');

    this.registerFactory('QLearning', () => new QLearningStrategy());
    this.registerFactory('GruPrediction', () => {
      const model = new GruPricePredictionModel({ gruUnits: 64, denseUnits: 32 });
      model.build();
      return new GruPredictionStrategy(model);
    });
  }
}
