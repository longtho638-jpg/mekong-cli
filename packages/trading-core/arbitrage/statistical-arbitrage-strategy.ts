/**
 * Statistical Arbitrage (Pairs Trading) Strategy
 * Mean-reversion on correlated asset pairs.
 * Entry: Z-score > 2 (Sell A, Buy B) or Z-score < -2 (Buy A, Sell B)
 * Requires correlation >= 0.8 between pair.
 */

import { IStrategy, ISignal, SignalType } from '../interfaces/strategy-types';
import { ICandle } from '../interfaces/candle-types';
import { Indicators } from '../analysis/technical-indicators';

export class StatisticalArbitrage implements IStrategy {
  name = 'Statistical Arbitrage (Pairs Trading)';

  private pricesA: number[] = [];
  private pricesB: number[] = [];
  private readonly lookbackPeriod = 100;
  private readonly entryZScore = 2.0;

  async onCandle(candle: ICandle): Promise<ISignal | null> {
    const priceA = candle.close;
    const priceB = candle.metadata?.priceB;

    if (typeof priceB !== 'number') {
      return null;
    }

    this.pricesA.push(priceA);
    this.pricesB.push(priceB);

    if (this.pricesA.length > this.lookbackPeriod) {
      this.pricesA.shift();
      this.pricesB.shift();
    }

    if (this.pricesA.length < this.lookbackPeriod) {
      return null;
    }

    const ratios = this.pricesA.map((p, i) => p / this.pricesB[i]);
    const currentRatio = ratios[ratios.length - 1];

    const mean = ratios.reduce((a, b) => a + b) / ratios.length;
    const stdDev = Indicators.standardDeviation(ratios);
    const zScore = Indicators.zScore(currentRatio, mean, stdDev);

    const correlation = Indicators.correlation(this.pricesA, this.pricesB);

    if (correlation < 0.8) {
      return null;
    }

    if (zScore > this.entryZScore) {
      return {
        type: SignalType.SELL,
        price: priceA,
        timestamp: candle.timestamp,
        metadata: { zScore, correlation, pair: 'A/B', action: 'SELL_A_BUY_B' }
      };
    } else if (zScore < -this.entryZScore) {
      return {
        type: SignalType.BUY,
        price: priceA,
        timestamp: candle.timestamp,
        metadata: { zScore, correlation, pair: 'A/B', action: 'BUY_A_SELL_B' }
      };
    }

    return null;
  }

  async init(history: ICandle[]): Promise<void> {
    this.pricesA = [];
    this.pricesB = [];
    for (const candle of history) {
      if (candle.metadata?.priceB !== undefined) {
        this.pricesA.push(candle.close);
        this.pricesB.push(candle.metadata.priceB as number);
      }
    }
    if (this.pricesA.length > this.lookbackPeriod) {
      this.pricesA = this.pricesA.slice(-this.lookbackPeriod);
      this.pricesB = this.pricesB.slice(-this.lookbackPeriod);
    }
  }
}
