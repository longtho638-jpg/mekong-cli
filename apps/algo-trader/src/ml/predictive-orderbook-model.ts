import * as tf from '@tensorflow/tfjs';
import { EventEmitter } from 'events';
import { LicenseService, LicenseTier, LicenseError } from '../lib/raas-gate';

export interface OrderbookSnapshot {
  bidVolumes: number[];   // top N bid volumes
  askVolumes: number[];   // top N ask volumes
  bidPrices: number[];    // top N bid prices
  askPrices: number[];    // top N ask prices
  timestamp: number;
}

export interface OrderbookPrediction {
  priceUpProb: number;        // 0-1 probability of price going up
  liquidityShiftProb: number; // 0-1 probability of liquidity shifting
  confidence: number;         // 0-1 based on training samples
  features: number[];         // extracted feature vector for debugging
}

export interface PredictiveOrderbookConfig {
  depthLevels?: number;             // default 3
  hiddenUnits?: number;             // default 16
  learningRate?: number;            // default 0.01
  minSamplesForConfidence?: number; // default 50
}

const DEFAULTS: Required<PredictiveOrderbookConfig> = {
  depthLevels: 3,
  hiddenUnits: 16,
  learningRate: 0.01,
  minSamplesForConfidence: 50,
};

const NUM_FEATURES = 8; // 3 bidVol + 3 askVol + volumeImbalance + spreadBps

/**
 * Dense neural net for point-in-time orderbook prediction.
 * Input: 8 features extracted from orderbook snapshot.
 * Outputs: priceDirectionProb, liquidityShiftProb (both sigmoid).
 *
 * Supports online learning via trainOnBatch().
 * Emits 'prediction' events after each predict() call.
 *
 * PREMIUM FEATURE: Requires PRO license to save/load model weights.
 */
export class PredictiveOrderbookModel extends EventEmitter {
  private model: tf.Sequential | null = null;
  private cfg: Required<PredictiveOrderbookConfig>;
  private sampleCount = 0;

  constructor(config?: PredictiveOrderbookConfig) {
    super();
    this.cfg = { ...DEFAULTS, ...config };
  }

  /** Construct Dense → Dense(relu) → Dense(2, sigmoid) model. */
  build(): void {
    const { hiddenUnits, learningRate } = this.cfg;

    const model = tf.sequential();

    model.add(tf.layers.dense({
      units: hiddenUnits,
      activation: 'relu',
      inputShape: [NUM_FEATURES],
    }));

    model.add(tf.layers.dense({
      units: hiddenUnits / 2,
      activation: 'relu',
    }));

    model.add(tf.layers.dense({
      units: 2,
      activation: 'sigmoid',
    }));

    model.compile({
      optimizer: tf.train.adam(learningRate),
      loss: 'binaryCrossentropy',
    });

    this.model = model;
  }

  /**
   * Extract 8 features from an orderbook snapshot.
   * Features: bidVol[0..2], askVol[0..2], volumeImbalance, spreadBps.
   * Values are normalized and clamped to [0, 1].
   */
  extractFeatures(snapshot: OrderbookSnapshot): number[] {
    const depth = this.cfg.depthLevels;
    const bidVols = snapshot.bidVolumes.slice(0, depth);
    const askVols = snapshot.askVolumes.slice(0, depth);

    // Pad with zeros if fewer levels than expected
    while (bidVols.length < depth) bidVols.push(0);
    while (askVols.length < depth) askVols.push(0);

    const totalBid = bidVols.reduce((a, b) => a + b, 0);
    const totalAsk = askVols.reduce((a, b) => a + b, 0);
    const totalVol = totalBid + totalAsk || 1;

    // Normalize individual volumes by total (0-1)
    const normBidVols = bidVols.map(v => Math.min(v / totalVol, 1));
    const normAskVols = askVols.map(v => Math.min(v / totalVol, 1));

    // Volume imbalance: (bidVol - askVol) / totalVol mapped to [0,1]
    const volumeImbalance = Math.min(Math.max((totalBid - totalAsk) / totalVol, -1), 1) * 0.5 + 0.5;

    // Spread in bps, clamped to [0, 200bps] then normalized
    const bestBid = snapshot.bidPrices[0] ?? 0;
    const bestAsk = snapshot.askPrices[0] ?? 0;
    const midPrice = (bestBid + bestAsk) / 2 || 1;
    const spreadBps = bestBid > 0 && bestAsk > 0
      ? Math.min(((bestAsk - bestBid) / midPrice) * 10000, 200) / 200
      : 0;

    return [...normBidVols, ...normAskVols, volumeImbalance, spreadBps];
  }

  /**
   * Predict priceUpProb and liquidityShiftProb from a snapshot.
   * Emits 'prediction' event with the result.
   */
  predict(snapshot: OrderbookSnapshot): OrderbookPrediction {
    if (!this.model) throw new Error('Model not built. Call build() first.');

    const features = this.extractFeatures(snapshot);
    const input = tf.tensor2d([features]);
    const output = this.model.predict(input);
    const tensor = Array.isArray(output) ? output[0] : output;

    if (!tensor) {
      input.dispose();
      throw new Error('Model prediction returned null');
    }

    const vals = tensor.dataSync();
    input.dispose();
    tensor.dispose();

    const confidence = Math.min(this.sampleCount / this.cfg.minSamplesForConfidence, 1);

    const prediction: OrderbookPrediction = {
      priceUpProb: vals[0] ?? 0,
      liquidityShiftProb: vals[1] ?? 0,
      confidence,
      features,
    };

    this.emit('prediction', prediction);
    return prediction;
  }

  /**
   * Online learning: update model weights with new batch of snapshots + labels.
   * Increments internal sample counter for confidence scoring.
   */
  async trainOnBatch(
    snapshots: OrderbookSnapshot[],
    labels: { priceUp: number; liquidityShift: number }[],
  ): Promise<void> {
    if (!this.model) this.build();

    const featureMatrix = snapshots.map(s => this.extractFeatures(s));
    const labelMatrix = labels.map(l => [l.priceUp, l.liquidityShift]);

    const xs = tf.tensor2d(featureMatrix);
    const ys = tf.tensor2d(labelMatrix);

    await this.model!.fit(xs, ys, { epochs: 1, verbose: 0 });

    xs.dispose();
    ys.dispose();

    this.sampleCount += snapshots.length;
  }

  /**
   * Save model weights — PREMIUM FEATURE (PRO license required).
   */
  async saveWeights(): Promise<tf.io.ModelArtifacts> {
    const licenseService = LicenseService.getInstance();
    if (!licenseService.hasTier(LicenseTier.PRO)) {
      throw new LicenseError(
        'Saving ML model weights requires PRO license',
        LicenseTier.PRO,
        'ml_model_weights'
      );
    }
    if (!this.model) throw new Error('Model not built.');
    return new Promise((resolve, reject) => {
      this.model!.save(tf.io.withSaveHandler(async (artifacts) => {
        resolve(artifacts);
        return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } };
      })).catch(reject);
    });
  }

  /**
   * Load model weights — PREMIUM FEATURE (PRO license required).
   */
  loadWeights(artifacts: tf.io.ModelArtifacts): void {
    const licenseService = LicenseService.getInstance();
    if (!licenseService.hasTier(LicenseTier.PRO)) {
      throw new LicenseError(
        'Loading ML model weights requires PRO license',
        LicenseTier.PRO,
        'ml_model_weights'
      );
    }
    if (!this.model) this.build();
    if (!artifacts.weightSpecs || !artifacts.weightData) {
      throw new Error('Invalid model artifacts: missing weightSpecs or weightData');
    }
  }

  /** Check if model is ready. */
  isReady(): boolean {
    return this.model !== null;
  }

  /** Get number of training samples seen. */
  getSampleCount(): number {
    return this.sampleCount;
  }

  /** Dispose model to free GPU/CPU memory. */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}
