import { IStrategy, ISignal, SignalType } from '../interfaces/IStrategy';
import { ICandle } from '../interfaces/ICandle';

/**
 * Triangular Arbitrage
 * Chiến thuật khai thác sự chênh lệch giá giữa 3 cặp tiền trên cùng một sàn.
 * Ví dụ: BTC -> ETH -> USDT -> BTC
 * Detect profitable loops > 0.05%
 */
export class TriangularArbitrage implements IStrategy {
  name = 'Triangular Arbitrage';

  private readonly minProfit = 0.0005; // 0.05%
  private readonly feeRate = 0.001; // 0.1%

  async onCandle(candle: ICandle): Promise<ISignal | null> {
    // Giả định candle này là giá BTC/USDT (cặp cơ sở)
    // Metadata chứa giá của 2 cặp còn lại trong tam giác
    // Loop: BTC/USDT -> ETH/BTC -> ETH/USDT

    const priceBTC_USDT = candle.close;
    // ICandleMetadata fields are already typed as number | undefined — no cast needed
    const priceETH_BTC = candle.metadata?.priceETH_BTC;
    const priceETH_USDT = candle.metadata?.priceETH_USDT;

    if (typeof priceETH_BTC !== 'number' || typeof priceETH_USDT !== 'number') {
      return null;
    }

    // Triangular Arbitrage Profit Calculation (Net of Fees)
    // We must account for fees at each of the 3 trade steps.

    // 1. Forward Loop: USDT -> BTC -> ETH -> USDT
    // Step 1: Buy BTC with USDT (USDT -> BTC)
    const step1Forward = (1 / priceBTC_USDT) * (1 - this.feeRate);
    // Step 2: Buy ETH with BTC (BTC -> ETH)
    const step2Forward = (step1Forward / priceETH_BTC) * (1 - this.feeRate);
    // Step 3: Sell ETH for USDT (ETH -> USDT)
    const step3Forward = (step2Forward * priceETH_USDT) * (1 - this.feeRate);
    const forwardProfit = step3Forward - 1;

    // 2. Backward Loop: USDT -> ETH -> BTC -> USDT
    // Step 1: Buy ETH with USDT (USDT -> ETH)
    const step1Backward = (1 / priceETH_USDT) * (1 - this.feeRate);
    // Step 2: Sell ETH for BTC (ETH -> BTC)
    const step2Backward = (step1Backward * priceETH_BTC) * (1 - this.feeRate);
    // Step 3: Sell BTC for USDT (BTC -> USDT)
    const step3Backward = (step2Backward * priceBTC_USDT) * (1 - this.feeRate);
    const backwardProfit = step3Backward - 1;

    if (forwardProfit > this.minProfit) {
      return {
        type: SignalType.BUY, // Kích hoạt chuỗi lệnh mua/bán
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
        type: SignalType.SELL, // Kích hoạt chuỗi lệnh mua/bán
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

  async init(history: ICandle[]): Promise<void> {
    // Không cần history cho triangular arbitrage
  }
}
