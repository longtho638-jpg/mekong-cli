import { IStrategy, ISignal, SignalType } from '../interfaces/IStrategy';
import { ICandle } from '../interfaces/ICandle';

/**
 * Cross-Exchange Arbitrage
 * Chiến thuật so sánh giá của cùng một tài sản trên hai sàn giao dịch khác nhau.
 * Detect spread > 0.1%, thực hiện mua ở sàn rẻ và bán ở sàn đắt đồng thời.
 */
export class CrossExchangeArbitrage implements IStrategy {
  name = 'Cross-Exchange Arbitrage';

  private readonly minSpread = 0.001; // 0.1%

  async onCandle(candle: ICandle): Promise<ISignal | null> {
    // Giả định metadata chứa giá từ sàn giao dịch thứ 2 (Exchange B)
    const priceA = candle.close;
    const priceB = candle.metadata?.exchangeBPrice as number | undefined;

    if (typeof priceB !== 'number') {
      return null;
    }

    const spread = Math.abs(priceA - priceB) / Math.min(priceA, priceB);

    if (spread > this.minSpread) {
      if (priceA < priceB) {
        // Mua ở sàn A (giá hiện tại của candle), Bán ở sàn B
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
        // Bán ở sàn A, Mua ở sàn B
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

  async init(history: ICandle[]): Promise<void> {
    // Arbitrage thường không cần nạp history dài hạn để tính toán indicators
  }
}
