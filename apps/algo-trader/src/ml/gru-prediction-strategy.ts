import { ISignal, SignalType } from '../interfaces/IStrategy';
import { ICandle } from '../interfaces/ICandle';
import { BaseStrategy } from '../strategies/BaseStrategy';
import { FeatureEngineeringPipeline } from './feature-engineering-candle-to-vector-pipeline';
import { GruPricePredictionModel } from './gru-price-prediction-model';

export interface GruStrategyConfig {
  buyThreshold?: number;   // prob > threshold → BUY (default 0.55)
  sellThreshold?: number;  // prob < threshold → SELL (default 0.45)
  windowSize?: number;     // lookback window (default 60)
}

const MIN_CANDLES = 80; // windowSize + warmup buffer for indicators

/**
 * IStrategy wrapper around GRU price prediction model.
 * Uses FeatureEngineeringPipeline to extract features, then predicts
 * probability of price going up via trained GRU model.
 */
export class GruPredictionStrategy extends BaseStrategy {
  name = 'GRU Price Prediction Strategy';

  private gruModel: GruPricePredictionModel;
  private pipeline: FeatureEngineeringPipeline;
  private buyThreshold: number;
  private sellThreshold: number;
  private windowSize: number;
  private isLong = false;

  constructor(
    model: GruPricePredictionModel,
    config?: GruStrategyConfig,
  ) {
    super();
    this.maxHistoryBuffer = 200;
    this.gruModel = model;
    this.pipeline = new FeatureEngineeringPipeline();
    this.buyThreshold = config?.buyThreshold ?? 0.55;
    this.sellThreshold = config?.sellThreshold ?? 0.45;
    this.windowSize = config?.windowSize ?? 60;
  }

  async onCandle(candle: ICandle): Promise<ISignal | null> {
    this.bufferCandle(candle);

    if (this.candles.length < MIN_CANDLES) return null;
    if (!this.gruModel.isReady()) return null;

    // Extract features from buffered candles
    const features = this.pipeline.extract(this.candles);
    if (features.length < this.windowSize) return null;

    // Build input window from last windowSize features
    const window = features
      .slice(-this.windowSize)
      .map(fv => FeatureEngineeringPipeline.toArray(fv));

    const prob = this.gruModel.predict(window);

    // Generate signal based on thresholds
    if (prob > this.buyThreshold && !this.isLong) {
      this.isLong = true;
      return {
        type: SignalType.BUY,
        price: candle.close,
        timestamp: candle.timestamp,
        tag: 'gru-buy',
        metadata: { probability: prob },
      };
    }

    if (prob < this.sellThreshold && this.isLong) {
      this.isLong = false;
      return {
        type: SignalType.SELL,
        price: candle.close,
        timestamp: candle.timestamp,
        tag: 'gru-sell',
        metadata: { probability: prob },
      };
    }

    return null;
  }

  /** Reset position state (for backtesting). */
  resetPosition(): void {
    this.isLong = false;
  }

  getPosition(): boolean {
    return this.isLong;
  }
}
