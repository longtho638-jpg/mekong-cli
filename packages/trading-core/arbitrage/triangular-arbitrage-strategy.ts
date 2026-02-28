/**
 * Triangular Arbitrage Strategy
 * Exploits price discrepancies across 3 trading pairs on same exchange.
 * Example: BTC -> ETH -> USDT -> BTC
 * Detects profitable loops > 0.05% after fees.
 */

import { IStrategy, ISignal, SignalType } from '../interfaces/strategy-types';
import { ICandle } from '../interfaces/candle-types';

export class TriangularArbitrage implements IStrategy {
  name = 'Triangular Arbitrage';

  private readonly minProfit = 0.0005; // 0.05%
  private readonly feeRate = 0.001; // 0.1%

  async onCandle(candle: ICandle): Promise<ISignal | null> {
    const priceBTC_USDT = candle.close;
    const priceETH_BTC = candle.metadata?.priceETH_BTC;
    const priceETH_USDT = candle.metadata?.priceETH_USDT;

    if (typeof priceETH_BTC !== 'number' || typeof priceETH_USDT !== 'number') {
      return null;
    }

    // Forward Loop: USDT -> BTC -> ETH -> USDT
    const step1Forward = (1 / priceBTC_USDT) * (1 - this.feeRate);
    const step2Forward = (step1Forward / priceETH_BTC) * (1 - this.feeRate);
    const step3Forward = (step2Forward * priceETH_USDT) * (1 - this.feeRate);
    const forwardProfit = step3Forward - 1;

    // Backward Loop: USDT -> ETH -> BTC -> USDT
    const step1Backward = (1 / priceETH_USDT) * (1 - this.feeRate);
    const step2Backward = (step1Backward * priceETH_BTC) * (1 - this.feeRate);
    const step3Backward = (step2Backward * priceBTC_USDT) * (1 - this.feeRate);
    const backwardProfit = step3Backward - 1;

    if (forwardProfit > this.minProfit) {
      return {
        type: SignalType.BUY,
        price: priceBTC_USDT,
        timestamp: candle.timestamp,
        metadata: {
          profit: forwardProfit,
          direction: 'forward',
          path: 'USDT -> BTC -> ETH -> USDT'
        }
      };
    }

    if (backwardProfit > this.minProfit) {
      return {
        type: SignalType.SELL,
        price: priceBTC_USDT,
        timestamp: candle.timestamp,
        metadata: {
          profit: backwardProfit,
          direction: 'backward',
          path: 'USDT -> ETH -> BTC -> USDT'
        }
      };
    }

    return null;
  }

  async init(_history: ICandle[]): Promise<void> {
    // Triangular arbitrage does not require historical data
  }
}
