/**
 * ValidatorBehaviorModel — online ML model predicting validator tx inclusion probability.
 * Uses a simple logistic regression with stochastic gradient descent (no external deps).
 * Module 3 of Phase 10 Cosmic — default disabled/dry-run.
 */

export interface ValidatorBehaviorModelConfig {
  /** Master switch. Default: false. */
  enabled: boolean;
  /** Learning rate for online SGD. Default: 0.01. */
  learningRate: number;
  /** Feature vector dimension. Default: 6. */
  featureDim: number;
}

export interface ValidatorPrediction {
  txHash: string;
  inclusionProbability: number;
  /** Predicted blocks until inclusion. */
  blocksUntilInclusion: number;
  confidence: number;
}

const DEFAULT_CONFIG: ValidatorBehaviorModelConfig = {
  enabled: false,
  learningRate: 0.01,
  featureDim: 6,
};

/** Sigmoid activation. */
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/** Extract feature vector from a raw transaction-like object. */
function extractFeatures(
  gasPrice: number,
  value: number,
  dataLen: number,
  nonce: number,
  pendingCount: number,
  baseFee: number,
): number[] {
  // Normalise to ~[0,1] ranges
  return [
    Math.min(gasPrice / 1e11, 1),
    Math.min(value / 1e18, 1),
    Math.min(dataLen / 10_000, 1),
    Math.min(nonce / 1000, 1),
    Math.min(pendingCount / 500, 1),
    Math.min(Math.max(gasPrice - baseFee, 0) / 1e10, 1),
  ];
}

export class ValidatorBehaviorModel {
  private readonly cfg: ValidatorBehaviorModelConfig;
  /** Weight vector (logistic regression). */
  private weights: number[];
  private bias: number = 0;
  private trainCount = 0;
  private correctCount = 0;

  constructor(config: Partial<ValidatorBehaviorModelConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
    // Small non-zero init to break symmetry
    this.weights = Array.from({ length: this.cfg.featureDim }, (_, i) => 0.1 * (i + 1) / this.cfg.featureDim);
  }

  /** Predict inclusion probability for a transaction. */
  predict(
    txHash: string,
    gasPrice: number,
    value: number,
    dataLen: number,
    nonce: number,
    pendingCount: number,
    baseFee: number,
  ): ValidatorPrediction {
    const features = extractFeatures(gasPrice, value, dataLen, nonce, pendingCount, baseFee);
    const logit = features.reduce((sum, f, i) => sum + f * this.weights[i], this.bias);
    const prob = sigmoid(logit);
    // Rough block estimate: high prob → few blocks
    const blocksUntilInclusion = Math.max(1, Math.round((1 - prob) * 20));
    const confidence = Math.abs(prob - 0.5) * 2; // 0=uncertain, 1=certain
    return { txHash, inclusionProbability: prob, blocksUntilInclusion, confidence };
  }

  /** Online SGD update: label=1 if included, 0 if dropped. */
  train(
    gasPrice: number,
    value: number,
    dataLen: number,
    nonce: number,
    pendingCount: number,
    baseFee: number,
    label: 0 | 1,
  ): void {
    const features = extractFeatures(gasPrice, value, dataLen, nonce, pendingCount, baseFee);
    const logit = features.reduce((sum, f, i) => sum + f * this.weights[i], this.bias);
    const pred = sigmoid(logit);
    const error = label - pred;
    const lr = this.cfg.learningRate;

    for (let i = 0; i < this.weights.length; i++) {
      this.weights[i] += lr * error * features[i];
    }
    this.bias += lr * error;

    this.trainCount++;
    if ((label === 1 && pred >= 0.5) || (label === 0 && pred < 0.5)) {
      this.correctCount++;
    }
  }

  /** Returns accuracy over training history. 0 if no samples yet. */
  getAccuracy(): number {
    return this.trainCount === 0 ? 0 : this.correctCount / this.trainCount;
  }

  getTrainCount(): number {
    return this.trainCount;
  }

  getWeights(): number[] {
    return [...this.weights];
  }
}
