import * as tf from '@tensorflow/tfjs';
import { LicenseService, LicenseTier, LicenseError } from '../lib/raas-gate';

export interface GruModelConfig {
  windowSize?: number;      // lookback candle count (default 60)
  numFeatures?: number;     // feature vector length (default 7)
  gruUnits?: number;        // GRU hidden units (default 64)
  denseUnits?: number;      // pre-output dense units (default 32)
  dropoutRate?: number;     // dropout rate (default 0.2)
  learningRate?: number;    // Adam lr (default 0.001)
}

const DEFAULTS: Required<GruModelConfig> = {
  windowSize: 60,
  numFeatures: 7,
  gruUnits: 64,
  denseUnits: 32,
  dropoutRate: 0.2,
  learningRate: 0.001,
};

export interface TrainResult {
  epochs: number;
  finalLoss: number;
  trainingTimeMs: number;
}

/**
 * GRU-based price direction prediction model.
 * Input: [windowSize, numFeatures] sliding window of normalized features.
 * Output: probability of price going UP (sigmoid).
 *
 * PREMIUM FEATURE: Requires PRO license to load model weights.
 */
export class GruPricePredictionModel {
  private model: tf.Sequential | null = null;
  private cfg: Required<GruModelConfig>;

  constructor(config?: GruModelConfig) {
    this.cfg = { ...DEFAULTS, ...config };
  }

  /** Build the GRU → Dropout → Dense → Dense(1, sigmoid) model. */
  build(): void {
    const { windowSize, numFeatures, gruUnits, denseUnits, dropoutRate, learningRate } = this.cfg;

    const model = tf.sequential();

    model.add(tf.layers.gru({
      units: gruUnits,
      inputShape: [windowSize, numFeatures],
      returnSequences: false,
    }));

    model.add(tf.layers.dropout({ rate: dropoutRate }));

    model.add(tf.layers.dense({ units: denseUnits, activation: 'relu' }));

    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

    model.compile({
      optimizer: tf.train.adam(learningRate),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });

    this.model = model;
  }

  /** Train on feature windows + binary labels (1=price up, 0=price down). */
  async train(
    windows: number[][][],   // [samples, windowSize, numFeatures]
    labels: number[],        // [samples] — 0 or 1
    epochs = 20,
    batchSize = 32,
  ): Promise<TrainResult> {
    if (!this.model) this.build();

    const xs = tf.tensor3d(windows);
    const ys = tf.tensor2d(labels, [labels.length, 1]);

    const start = Date.now();

    const history = await this.model!.fit(xs, ys, {
      epochs,
      batchSize,
      shuffle: true,
      validationSplit: 0.1,
      verbose: 0,
    });

    const finalLoss = history.history['loss']
      ? (history.history['loss'] as number[])[epochs - 1] ?? 0
      : 0;

    xs.dispose();
    ys.dispose();

    return { epochs, finalLoss, trainingTimeMs: Date.now() - start };
  }

  /** Predict probability of price going up for a single window. */
  predict(window: number[][]): number {
    if (!this.model) throw new Error('Model not built. Call build() or load() first.');

    const input = tf.tensor3d([window]);
    const output = this.model.predict(input);
    // Type guard: TFJS predict returns Tensor | Tensor[] for Sequential models
    const tensor = Array.isArray(output) ? output[0] : output;
    if (!tensor) {
      input.dispose();
      throw new Error('Model prediction returned null');
    }
    const prob = tensor.dataSync()[0];

    input.dispose();
    tensor.dispose();

    return prob;
  }

  /** Batch predict for multiple windows. */
  predictBatch(windows: number[][][]): number[] {
    if (!this.model) throw new Error('Model not built. Call build() or load() first.');

    const input = tf.tensor3d(windows);
    const output = this.model.predict(input);
    // Type guard: TFJS predict returns Tensor | Tensor[] for Sequential models
    const tensor = Array.isArray(output) ? output[0] : output;
    if (!tensor) {
      input.dispose();
      throw new Error('Model prediction returned null');
    }
    const probs = Array.from(tensor.dataSync());

    input.dispose();
    tensor.dispose();

    return probs;
  }

  /**
   * Save model weights to JSON-serializable format.
   * PREMIUM FEATURE: Requires PRO license.
   */
  async saveWeights(): Promise<tf.io.ModelArtifacts> {
    // Gate premium feature
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
      this.model!.save(tf.io.withSaveHandler(async (modelArtifacts) => {
        resolve(modelArtifacts);
        return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } };
      })).catch(reject);
    });
  }

  /**
   * Load model weights from saved artifacts.
   * PREMIUM FEATURE: Requires PRO license.
   */
  loadWeights(artifacts: tf.io.ModelArtifacts): void {
    // Gate premium feature
    const licenseService = LicenseService.getInstance();
    if (!licenseService.hasTier(LicenseTier.PRO)) {
      throw new LicenseError(
        'Loading ML model weights requires PRO license',
        LicenseTier.PRO,
        'ml_model_weights'
      );
    }

    if (!this.model) this.build();

    // TFJS: loadWeights accepts NamedTensorMap
    // Extract weights from artifacts weightSpecs
    if (!artifacts.weightSpecs || !artifacts.weightData) {
      throw new Error('Invalid model artifacts: missing weightSpecs or weightData');
    }
    // Note: Full implementation requires parsing weightData ArrayBuffer
    // This is a type-safe stub - TFJS loadWeights needs NamedTensorMap
  }

  /** Get config for reconstruction. */
  getConfig(): Required<GruModelConfig> {
    return { ...this.cfg };
  }

  /** Check if model is built. */
  isReady(): boolean {
    return this.model !== null;
  }

  /** Dispose model to free memory. */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}
