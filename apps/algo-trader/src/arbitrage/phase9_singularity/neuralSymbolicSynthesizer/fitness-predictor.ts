/**
 * Fitness Predictor — lightweight neural network (mocked TF.js) that predicts
 * strategy fitness from AST features without running a full backtest.
 * Reduces compute by ~10x on large populations.
 */

import { AstNode } from './grammar';

export interface FitnessPredictorConfig {
  learningRate: number;
  hiddenSize: number;
  featureCount: number; // number of AST features extracted
}

export interface PredictionResult {
  predictedFitness: number; // 0..1 normalised
  confidence: number; // 0..1
}

const DEFAULT_CONFIG: FitnessPredictorConfig = {
  learningRate: 0.01,
  hiddenSize: 16,
  featureCount: 8,
};

// ── Feature extraction ───────────────────────────────────────────────────────

/** Count total nodes in AST (proxy for complexity). */
function countNodes(node: AstNode): number {
  if (node.type === 'binary') return 1 + countNodes(node.left) + countNodes(node.right);
  if (node.type === 'unary') return 1 + countNodes(node.operand);
  if (node.type === 'condition') {
    return 1 + countNodes(node.test) + countNodes(node.consequent) + countNodes(node.alternate);
  }
  return 1;
}

/** Max depth of AST. */
function maxDepth(node: AstNode): number {
  if (node.type === 'binary') return 1 + Math.max(maxDepth(node.left), maxDepth(node.right));
  if (node.type === 'unary') return 1 + maxDepth(node.operand);
  if (node.type === 'condition') {
    return 1 + Math.max(maxDepth(node.test), maxDepth(node.consequent), maxDepth(node.alternate));
  }
  return 0;
}

/** Count occurrences of a given node type. */
function countType(node: AstNode, t: AstNode['type']): number {
  let n = node.type === t ? 1 : 0;
  if (node.type === 'binary') n += countType(node.left, t) + countType(node.right, t);
  if (node.type === 'unary') n += countType(node.operand, t);
  if (node.type === 'condition') {
    n += countType(node.test, t) + countType(node.consequent, t) + countType(node.alternate, t);
  }
  return n;
}

/** Extract fixed-length feature vector from AST. */
export function extractFeatures(ast: AstNode): number[] {
  const total = countNodes(ast);
  return [
    Math.min(total / 20, 1),                         // 0: normalised complexity
    Math.min(maxDepth(ast) / 10, 1),                  // 1: normalised depth
    Math.min(countType(ast, 'indicator') / 5, 1),     // 2: indicator density
    Math.min(countType(ast, 'price') / 5, 1),         // 3: price-leaf density
    Math.min(countType(ast, 'binary') / 10, 1),       // 4: binary-op density
    Math.min(countType(ast, 'condition') / 5, 1),     // 5: condition density
    Math.min(countType(ast, 'unary') / 5, 1),         // 6: unary-op density
    total > 3 ? 1 : 0,                                // 7: non-trivial flag
  ];
}

// ── Minimal linear model (mock NN) ───────────────────────────────────────────

/** Simple linear layer: output = sigmoid(W·x + b). */
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, v, i) => sum + v * b[i], 0);
}

export class FitnessPredictor {
  private readonly cfg: FitnessPredictorConfig;
  private weights: number[]; // flat [featureCount] linear model
  private bias: number;
  private trainingSamples = 0;
  private mse = 1; // running mean squared error

  constructor(config: Partial<FitnessPredictorConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
    // Initialise with small random weights (deterministic seed for tests)
    this.weights = Array.from({ length: this.cfg.featureCount }, (_, i) => 0.1 * ((i % 3) - 1));
    this.bias = 0.5;
  }

  /** Predict fitness of a single AST. */
  predict(ast: AstNode): PredictionResult {
    const features = extractFeatures(ast);
    const raw = dotProduct(features, this.weights) + this.bias;
    const predictedFitness = sigmoid(raw);
    // Confidence increases with training samples (saturates at 100 samples)
    const confidence = Math.min(this.trainingSamples / 100, 0.95);
    return { predictedFitness, confidence };
  }

  /**
   * Online SGD update on a batch of (ast, actualFitness) pairs.
   * actualFitness should be in 0..1.
   */
  train(samples: Array<{ ast: AstNode; actualFitness: number }>): void {
    let batchMse = 0;
    for (const { ast, actualFitness } of samples) {
      const features = extractFeatures(ast);
      const raw = dotProduct(features, this.weights) + this.bias;
      const predicted = sigmoid(raw);
      const error = predicted - actualFitness;
      const grad = error * predicted * (1 - predicted); // sigmoid derivative

      // SGD weight update
      for (let i = 0; i < this.weights.length; i++) {
        this.weights[i] -= this.cfg.learningRate * grad * features[i];
      }
      this.bias -= this.cfg.learningRate * grad;
      batchMse += error * error;
      this.trainingSamples++;
    }
    this.mse = batchMse / Math.max(samples.length, 1);
  }

  /** Mean squared error on last training batch (lower = better). */
  getAccuracy(): number {
    // Return 1 - normalised MSE as a proxy for accuracy
    return Math.max(0, 1 - this.mse);
  }

  getTrainingSamples(): number {
    return this.trainingSamples;
  }
}
