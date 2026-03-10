/**
 * Liquidity Score Calculator — combines imbalance model output with
 * spread and depth metrics to produce a unified liquidity score [0,1].
 */

import type { FeatureVector } from './feature-extractor';
import type { ImbalancePrediction } from './orderbook-imbalance-model';

export interface LiquidityScore {
  score: number;          // [0, 1]: 1 = highly liquid
  spreadComponent: number;
  depthComponent: number;
  imbalanceComponent: number;
  timestamp: number;
}

export interface LiquidityScoreConfig {
  /** Max acceptable spread in basis points (above = score 0). */
  maxSpreadBps: number;
  /** Target depth in base currency units at top-N levels. */
  targetDepth: number;
  /** Weights for each component (must sum to 1). */
  weights: {
    spread: number;
    depth: number;
    imbalance: number;
  };
}

const DEFAULT_CONFIG: LiquidityScoreConfig = {
  maxSpreadBps: 20,
  targetDepth: 100,
  weights: { spread: 0.35, depth: 0.35, imbalance: 0.30 },
};

/**
 * Compute spread component: linear decay from 0 bps (score 1) to maxSpreadBps (score 0).
 */
function spreadScore(features: FeatureVector, maxSpreadBps: number): number {
  if (features.midPrice === 0) return 0;
  const spreadBps = (features.spread / features.midPrice) * 10_000;
  return Math.max(0, 1 - spreadBps / maxSpreadBps);
}

/**
 * Compute depth component: ratio of available depth to target depth, capped at 1.
 */
function depthScore(features: FeatureVector, targetDepth: number): number {
  // bookSlope acts as a proxy for depth availability
  const normalized = features.bookSlope / (features.bookSlope + targetDepth);
  return Math.min(1, normalized * 2); // scale up for usable range
}

/**
 * Compute imbalance component: confidence-weighted model certainty.
 * High confidence with balanced pressure = more liquid.
 */
function imbalanceScore(prediction: ImbalancePrediction): number {
  const balance = 1 - Math.abs(prediction.buyPressure - prediction.sellPressure);
  return prediction.confidence * (0.5 + 0.5 * balance);
}

export class LiquidityScoreCalculator {
  private readonly cfg: LiquidityScoreConfig;

  constructor(config: Partial<LiquidityScoreConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Compute overall liquidity score from features and model prediction.
   */
  compute(features: FeatureVector, prediction: ImbalancePrediction): LiquidityScore {
    const { weights } = this.cfg;

    const spreadComponent = spreadScore(features, this.cfg.maxSpreadBps);
    const depthComponent = depthScore(features, this.cfg.targetDepth);
    const imbalanceComponent = imbalanceScore(prediction);

    const score =
      weights.spread * spreadComponent +
      weights.depth * depthComponent +
      weights.imbalance * imbalanceComponent;

    return {
      score: Math.max(0, Math.min(1, score)),
      spreadComponent,
      depthComponent,
      imbalanceComponent,
      timestamp: features.timestamp,
    };
  }
}
