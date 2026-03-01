import { IStrategy } from '../interfaces/IStrategy';
import { RsiSmaStrategy } from '../strategies/RsiSmaStrategy';
import { RsiCrossoverStrategy } from '../strategies/RsiCrossoverStrategy';
import { BollingerBandStrategy } from '../strategies/BollingerBandStrategy';
import { MacdCrossoverStrategy } from '../strategies/MacdCrossoverStrategy';
import { MacdBollingerRsiStrategy } from '../strategies/MacdBollingerRsiStrategy';
import { CrossExchangeArbitrage, TriangularArbitrage, StatisticalArbitrage } from '@agencyos/vibe-arbitrage-engine/strategies';

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

  static register(name: string, strategyClass: new () => IStrategy) {
    this.strategies.set(name, strategyClass);
  }

  static load(name: string): IStrategy {
    const StrategyClass = this.strategies.get(name);
    if (!StrategyClass) {
      throw new Error(`Strategy ${name} not found. Available: ${Array.from(this.strategies.keys()).join(', ')}`);
    }

    return new StrategyClass();
  }

  /** Get all registered strategy names */
  static getNames(): string[] {
    return Array.from(this.strategies.keys());
  }

  /** Load all registered strategies */
  static loadAll(): { name: string; strategy: IStrategy }[] {
    return this.getNames().map(name => ({ name, strategy: this.load(name) }));
  }
}
