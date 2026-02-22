import { IStrategy, ISignal, SignalType } from '../interfaces/IStrategy';
import { ICandle } from '../interfaces/ICandle';
import { Indicators } from '../analysis/indicators';

/**
 * Statistical Arbitrage (Pairs Trading)
 * Chiến thuật giao dịch cặp tiền dựa trên sự tương quan và hồi quy về giá trị trung bình (Mean Reversion).
 * Ví dụ: ETH/BTC correlation.
 * Entry: Z-score > 2 (Sell A, Buy B) hoặc Z-score < -2 (Buy A, Sell B)
 * Exit: Z-score hồi quy về gần 0 (z < 0.5)
 */
export class StatisticalArbitrage implements IStrategy {
  name = 'Statistical Arbitrage (Pairs Trading)';

  private pricesA: number[] = [];
  private pricesB: number[] = [];
  private readonly lookbackPeriod = 100;
  private readonly entryZScore = 2.0;
  private readonly exitZScore = 0.5;

  // Giả định metadata của candle chứa thông tin giá của tài sản thứ 2 trong cặp correlation
  // Trong thực tế, IDataProvider cần cung cấp dữ liệu đồng bộ cho cả 2 tài sản.
  async onCandle(candle: ICandle): Promise<ISignal | null> {
    const priceA = candle.close;
    const priceB = candle.metadata?.priceB;

    if (priceB === undefined) {
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

    // Tính toán ratio hoặc spread. Ở đây dùng ratio A/B
    const ratios = this.pricesA.map((p, i) => p / this.pricesB[i]);
    const currentRatio = ratios[ratios.length - 1];

    const mean = ratios.reduce((a, b) => a + b) / ratios.length;
    const stdDev = Indicators.standardDeviation(ratios);
    const zScore = Indicators.zScore(currentRatio, mean, stdDev);

    // Kiểm tra sự tương quan (optional check)
    const correlation = Indicators.correlation(this.pricesA, this.pricesB);

    // Nếu độ tương quan quá thấp, không giao dịch
    if (correlation < 0.8) {
      return null;
    }

    // Giao dịch dựa trên Z-Score
    if (zScore > this.entryZScore) {
      // A quá đắt so với B -> Bán A, Mua B (Signal SELL A)
      return {
        type: SignalType.SELL,
        price: priceA,
        timestamp: candle.timestamp,
        metadata: { zScore, correlation, pair: 'A/B', action: 'SELL_A_BUY_B' }
      };
    } else if (zScore < -this.entryZScore) {
      // A quá rẻ so với B -> Mua A, Bán B (Signal BUY A)
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
  }
}
