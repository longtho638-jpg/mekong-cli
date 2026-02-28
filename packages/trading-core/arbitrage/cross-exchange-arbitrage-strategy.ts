/**
 * Cross-Exchange Arbitrage Strategy
 * Compares price of same asset on two exchanges.
 * Detects spread > 0.1%, signals simultaneous buy-low/sell-high.
 */

import { IStrategy, ISignal, SignalType } from '../interfaces/strategy-types';
import { ICandle } from '../interfaces/candle-types';

export class CrossExchangeArbitrage implements IStrategy {
  name = 'Cross-Exchange Arbitrage';

  private readonly minSpread = 0.001; // 0.1%

  async onCandle(candle: ICandle): Promise<ISignal | null> {
    const priceA = candle.close;
    const priceB = candle.metadata?.exchangeBPrice;

    if (typeof priceB !== 'number') {
      return null;
    }

    const spread = Math.abs(priceA - priceB) / Math.min(priceA, priceB);

    if (spread > this.minSpread) {
      if (priceA < priceB) {
        return {
          type: SignalType.BUY,
          price: priceA,
          timestamp: candle.timestamp,
          metadata: {
            spread,
            exchangeA: 'current',
            exchangeB: 'remote',
            action: 'BUY_A_SELL_B'
          }
        };
      } else {
        return {
          type: SignalType.SELL,
          price: priceA,
          timestamp: candle.timestamp,
          metadata: {
            spread,
            exchangeA: 'current',
            exchangeB: 'remote',
            action: 'SELL_A_BUY_B'
          }
        };
      }
    }

    return null;
  }

  async init(_history: ICandle[]): Promise<void> {
    // Arbitrage does not require historical indicator warm-up
  }
}
