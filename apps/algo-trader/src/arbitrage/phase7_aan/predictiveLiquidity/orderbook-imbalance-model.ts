/**
 * Orderbook Imbalance Model — mock ONNX inference.
 * Returns predicted buy pressure [0,1] and sell pressure [0,1].
 * In production: replace runInference() with actual onnxruntime-node session.
 */

import type { FeatureVector } from './feature-extractor';

export interface ImbalancePrediction {
  buyPressure: number;   // [0, 1]
  sellPressure: number;  // [0, 1]
  confidence: number;    // [0, 1]
  latencyMs: number;
}

export interface ModelConfig {
  modelPath: string;
  /** Clamp raw output below this to 0 (dead zone). */
  deadZone: number;
}

/**
 * Mock ONNX session — simulates model inference using a
 * weighted linear combination of features.
 */
function mockOnnxInference(features: number[]): [number, number] {
  // Weights tuned to mimic a trained imbalance model.
  // [volumeImbalance, bookSlope_norm, microPrice_norm, tradeFlow]
  const [vi, bs, , tf] = features;
  const raw = 0.45 * vi + 0.15 * bs + 0.40 * tf;
  // Map [-1,1] range to [0,1] buy/sell pressures
  const buyPressure = Math.max(0, Math.min(1, 0.5 + raw / 2));
  const sellPressure = 1 - buyPressure;
  return [buyPressure, sellPressure];
}

export class OrderbookImbalanceModel {
  private readonly config: ModelConfig;
  private loaded = false;

  constructor(config: ModelConfig) {
    this.config = config;
  }

  /**
   * Load model (mock: sets loaded=true immediately).
   * Real impl: await ort.InferenceSession.create(config.modelPath)
   */
  async load(): Promise<void> {
    // Simulate async model loading
    await Promise.resolve();
    this.loaded = true;
  }

  /**
   * Run inference on a feature vector.
   */
  async predict(features: FeatureVector): Promise<ImbalancePrediction> {
    if (!this.loaded) {
      await this.load();
    }

    const start = Date.now();

    // Normalise bookSlope to [0,1] range with sigmoid
    const bsNorm = 1 / (1 + Math.exp(-features.bookSlope / 100));

    const inputTensor = [
      features.volumeImbalance,
      bsNorm,
      features.microPrice > 0 ? (features.microPrice - features.midPrice) / (features.midPrice + 1e-9) : 0,
      features.tradeFlow,
    ];

    const [rawBuy, rawSell] = mockOnnxInference(inputTensor);

    const buyPressure = rawBuy < this.config.deadZone ? 0 : rawBuy;
    const sellPressure = rawSell < this.config.deadZone ? 0 : rawSell;

    // Confidence inversely proportional to spread (tighter spread = more reliable)
    const spreadRatio = features.spread / (features.midPrice + 1e-9);
    const confidence = Math.max(0, 1 - spreadRatio * 100);

    return {
      buyPressure,
      sellPressure,
      confidence,
      latencyMs: Date.now() - start,
    };
  }

  isLoaded(): boolean {
    return this.loaded;
  }
}
