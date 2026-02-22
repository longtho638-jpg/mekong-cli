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

  async onCandle(candle: ICandle): Promise<ISignal | null> {
    // Giả định candle này là giá BTC/USDT (cặp cơ sở)
    // Metadata chứa giá của 2 cặp còn lại trong tam giác
    // Loop: BTC/USDT -> ETH/BTC -> ETH/USDT

    const priceBTC_USDT = candle.close;
    const priceETH_BTC = candle.metadata?.priceETH_BTC as number | undefined;
    const priceETH_USDT = candle.metadata?.priceETH_USDT as number | undefined;

    if (typeof priceETH_BTC !== 'number' || typeof priceETH_USDT !== 'number') {
      return null;
    }

    // Giả sử ta bắt đầu với 1 USDT
    // 1. USDT -> BTC: amountBTC = 1 / priceBTC_USDT
    // 2. BTC -> ETH: amountETH = amountBTC / priceETH_BTC
    // 3. ETH -> USDT: finalUSDT = amountETH * priceETH_USDT

    const forwardRate = (1 / priceBTC_USDT / priceETH_BTC) * priceETH_USDT;
    const forwardProfit = forwardRate - 1;

    // Ngược lại
    // 1. USDT -> ETH: amountETH = 1 / priceETH_USDT
    // 2. ETH -> BTC: amountBTC = amountETH * priceETH_BTC
    // 3. BTC -> USDT: finalUSDT = amountBTC * priceBTC_USDT

    const backwardRate = (1 / priceETH_USDT) * priceETH_BTC * priceBTC_USDT;
    const backwardProfit = backwardRate - 1;

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
