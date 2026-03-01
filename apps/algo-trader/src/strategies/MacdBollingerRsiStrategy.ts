import { BaseStrategy } from './BaseStrategy';
import { ISignal, SignalType } from '../interfaces/IStrategy';
import { ICandle } from '../interfaces/ICandle';
import { Indicators } from '../analysis/indicators';

export interface MacdBollingerRsiConfig {
  macdFastPeriod?: number;
  macdSlowPeriod?: number;
  macdSignalPeriod?: number;
  bbPeriod?: number;
  bbStdDev?: number;
  rsiPeriod?: number;
  rsiOversold?: number;
  rsiOverbought?: number;
}

/**
 * Strategy combining MACD, Bollinger Bands, and RSI.
 *
 * Buy Signal:
 * 1. Price is near or below the lower Bollinger Band.
 * 2. RSI is oversold (e.g., < 30) or recovering from it.
 * 3. MACD histogram shows bullish momentum (histogram > 0 or crossing above 0).
 *
 * Sell Signal:
 * 1. Price is near or above the upper Bollinger Band.
 * 2. RSI is overbought (e.g., > 70).
 * 3. MACD histogram shows bearish momentum (histogram < 0 or crossing below 0).
 */
export class MacdBollingerRsiStrategy extends BaseStrategy {
  name = 'MACD_BB_RSI_Combo';

  protected strategyConfig: Required<MacdBollingerRsiConfig>;

  constructor(config: MacdBollingerRsiConfig = {}) {
    super();
    this.strategyConfig = {
      macdFastPeriod: config.macdFastPeriod || 12,
      macdSlowPeriod: config.macdSlowPeriod || 26,
      macdSignalPeriod: config.macdSignalPeriod || 9,
      bbPeriod: config.bbPeriod || 20,
      bbStdDev: config.bbStdDev || 2,
      rsiPeriod: config.rsiPeriod || 14,
      rsiOversold: config.rsiOversold || 30,
      rsiOverbought: config.rsiOverbought || 70,
    };

    // Ensure we keep enough history for the longest period (MACD slow period or BB/RSI period)
    this.maxHistoryBuffer = Math.max(
      this.strategyConfig.macdSlowPeriod + this.strategyConfig.macdSignalPeriod,
      this.strategyConfig.bbPeriod,
      this.strategyConfig.rsiPeriod
    ) * 2;
  }

  async onCandle(candle: ICandle): Promise<ISignal | null> {
    this.bufferCandle(candle);

    if (this.candles.length < this.maxHistoryBuffer / 2) {
      return null; // Not enough data
    }

    const closes = this.getCloses();

    // Calculate Indicators
    const macdResult = Indicators.macd(closes, this.strategyConfig.macdFastPeriod, this.strategyConfig.macdSlowPeriod, this.strategyConfig.macdSignalPeriod);
    const bbResult = Indicators.bbands(closes, this.strategyConfig.bbPeriod, this.strategyConfig.bbStdDev);
    const rsiResult = Indicators.rsi(closes, this.strategyConfig.rsiPeriod);

    if (macdResult.length === 0 || bbResult.length === 0 || rsiResult.length === 0) {
      return null;
    }

    const lastMacd = macdResult[macdResult.length - 1];
    const prevMacd = macdResult.length > 1 ? macdResult[macdResult.length - 2] : null;
    const lastBb = bbResult[bbResult.length - 1];
    const lastRsi = rsiResult[rsiResult.length - 1];
    const currentPrice = candle.close;

    // BUY LOGIC
    // 1. Price near or below lower band (allow small margin, e.g. within 2% of band or below it)
    const isPriceLow = currentPrice <= lastBb.lower * 1.02;
    // 2. RSI is oversold or recently oversold
    const isRsiOversold = lastRsi <= this.strategyConfig.rsiOversold;
    // 3. MACD Histogram is positive or turning positive (bullish cross)
    const isMacdBullish = lastMacd.histogram !== undefined && lastMacd.histogram > 0 &&
                          (prevMacd?.histogram !== undefined ? prevMacd.histogram <= 0 : true);

    if (isPriceLow && isRsiOversold && isMacdBullish) {
      return {
        type: SignalType.BUY,
        price: currentPrice,
        timestamp: candle.timestamp,
        metadata: {
          rsi: lastRsi,
          macdHistogram: lastMacd.histogram,
          bbLower: lastBb.lower,
        }
      };
    }

    // SELL LOGIC
    // 1. Price near or above upper band
    const isPriceHigh = currentPrice >= lastBb.upper * 0.98;
    // 2. RSI is overbought
    const isRsiOverbought = lastRsi >= this.strategyConfig.rsiOverbought;
    // 3. MACD Histogram is negative or turning negative (bearish cross)
    const isMacdBearish = lastMacd.histogram !== undefined && lastMacd.histogram < 0 &&
                          (prevMacd?.histogram !== undefined ? prevMacd.histogram >= 0 : true);

    if (isPriceHigh && isRsiOverbought && isMacdBearish) {
      return {
        type: SignalType.SELL,
        price: currentPrice,
        timestamp: candle.timestamp,
        metadata: {
          rsi: lastRsi,
          macdHistogram: lastMacd.histogram,
          bbUpper: lastBb.upper,
        }
      };
    }

    return null;
  }
}
