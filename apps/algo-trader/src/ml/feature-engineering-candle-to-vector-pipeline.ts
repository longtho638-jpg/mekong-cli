import { ICandle } from '../interfaces/ICandle';
import { Indicators } from '../analysis/indicators';

export interface FeatureVector {
  rsiNorm: number;       // RSI / 100 → [0, 1]
  macdHistNorm: number;  // MACD histogram / ATR → clamped [-1, 1]
  bbWidth: number;       // (upper - lower) / middle → typically [0, 0.2]
  bbPercentB: number;    // (close - lower) / (upper - lower) → [0, 1]
  atrNorm: number;       // ATR / close → volatility ratio
  volumeRatio: number;   // volume / SMA(volume, 20) → clamped [0, 3]
  hlRange: number;       // (high - low) / close → daily range %
}

export interface FeaturePipelineConfig {
  rsiPeriod?: number;
  smaPeriod?: number;
  macdFast?: number;
  macdSlow?: number;
  macdSignal?: number;
  bbPeriod?: number;
  bbStdDev?: number;
  atrPeriod?: number;
  volumeSmaPeriod?: number;
}

const DEFAULTS: Required<FeaturePipelineConfig> = {
  rsiPeriod: 14,
  smaPeriod: 20,
  macdFast: 12,
  macdSlow: 26,
  macdSignal: 9,
  bbPeriod: 20,
  bbStdDev: 2,
  atrPeriod: 14,
  volumeSmaPeriod: 20,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Compute ATR (Average True Range) values for the given candles. */
function computeAtr(candles: ICandle[], period: number): number[] {
  if (candles.length < 2) return [];

  const trueRanges: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const { high, low } = candles[i];
    const prevClose = candles[i - 1].close;
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose),
    );
    trueRanges.push(tr);
  }

  // SMA of true ranges over period
  return Indicators.sma(trueRanges, period);
}

export class FeatureEngineeringPipeline {
  private config: Required<FeaturePipelineConfig>;

  constructor(config?: FeaturePipelineConfig) {
    this.config = { ...DEFAULTS, ...config };
  }

  /**
   * Extract feature vectors from candle array.
   * Requires min ~50 candles for proper indicator warmup.
   */
  extract(candles: ICandle[]): FeatureVector[] {
    const { rsiPeriod, macdFast, macdSlow, macdSignal, bbPeriod, bbStdDev, atrPeriod, volumeSmaPeriod } = this.config;

    const closes = candles.map(c => c.close);
    const volumes = candles.map(c => c.volume);

    const rsiValues = Indicators.rsi(closes, rsiPeriod);
    const macdValues = Indicators.macd(closes, macdFast, macdSlow, macdSignal);
    const bbValues = Indicators.bbands(closes, bbPeriod, bbStdDev);
    const atrValues = computeAtr(candles, atrPeriod);
    const volumeSmaValues = Indicators.sma(volumes, volumeSmaPeriod);

    // Align all indicator arrays to the same tail length
    const minLen = Math.min(
      rsiValues.length,
      macdValues.length,
      bbValues.length,
      atrValues.length,
      volumeSmaValues.length,
    );

    if (minLen === 0) return [];

    const results: FeatureVector[] = [];

    for (let i = 0; i < minLen; i++) {
      // Reverse-index to align tails: index 0 of result = oldest aligned candle
      const candleIdx = candles.length - minLen + i;
      const candle = candles[candleIdx];

      const rsi = rsiValues[rsiValues.length - minLen + i];
      const macdHist = macdValues[macdValues.length - minLen + i].histogram ?? 0;
      const bb = bbValues[bbValues.length - minLen + i];
      const atr = atrValues[atrValues.length - minLen + i];
      const volSma = volumeSmaValues[volumeSmaValues.length - minLen + i];

      const rsiNorm = clamp(rsi / 100, 0, 1);
      const macdHistNorm = atr > 0 ? clamp(macdHist / atr, -1, 1) : 0;
      const bbWidth = bb.middle > 0 ? (bb.upper - bb.lower) / bb.middle : 0;
      const bbRange = bb.upper - bb.lower;
      const bbPercentB = bbRange > 0 ? clamp((candle.close - bb.lower) / bbRange, 0, 1) : 0.5;
      const atrNorm = candle.close > 0 ? atr / candle.close : 0;
      const volumeRatio = volSma > 0 ? clamp(candle.volume / volSma, 0, 3) : 0;
      const hlRange = candle.close > 0 ? (candle.high - candle.low) / candle.close : 0;

      results.push({ rsiNorm, macdHistNorm, bbWidth, bbPercentB, atrNorm, volumeRatio, hlRange });
    }

    return results;
  }

  /** Extract single feature vector from last candle (for live inference). */
  extractLast(candles: ICandle[]): FeatureVector | null {
    const features = this.extract(candles);
    return features.length > 0 ? features[features.length - 1] : null;
  }

  /** Convert FeatureVector to flat number array (for model input). */
  static toArray(fv: FeatureVector): number[] {
    return [fv.rsiNorm, fv.macdHistNorm, fv.bbWidth, fv.bbPercentB, fv.atrNorm, fv.volumeRatio, fv.hlRange];
  }

  /** Create sliding windows: returns array of [windowSize][7] tensors. */
  static toWindows(features: FeatureVector[], windowSize: number): number[][][] {
    if (windowSize <= 0 || features.length < windowSize) return [];
    const windows: number[][][] = [];
    for (let i = windowSize; i <= features.length; i++) {
      const window = features.slice(i - windowSize, i).map(fv => FeatureEngineeringPipeline.toArray(fv));
      windows.push(window);
    }
    return windows;
  }
}
