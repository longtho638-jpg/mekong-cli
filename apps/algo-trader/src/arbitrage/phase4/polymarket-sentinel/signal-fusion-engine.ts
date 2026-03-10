/**
 * SignalFusionEngine — combines NLP sentiment + prediction market probabilities
 * into a composite MacroDriftSignal using weighted average + EMA smoothing.
 */

import { logger } from '../../../utils/logger';

export interface MacroDriftSignal {
  direction: 'bullish' | 'bearish' | 'neutral';
  strength: number;   // 0.0 - 1.0
  confidence: number; // 0.0 - 1.0
  timestamp: number;
  components: {
    nlpScore: number;
    marketProb: number;
  };
}

interface FusionConfig {
  nlpWeight: number;
  marketWeight: number;
  historySize: number;
  emaAlpha: number; // smoothing factor 0-1 (higher = less smoothing)
}

const DEFAULT_CONFIG: FusionConfig = {
  nlpWeight: 0.45,
  marketWeight: 0.55,
  historySize: 50,
  emaAlpha: 0.3,
};

export class SignalFusionEngine {
  private config: FusionConfig;
  private history: MacroDriftSignal[] = [];
  private emaValue = 0;
  private initialized = false;

  constructor(config?: Partial<FusionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Fuse NLP scores and market probabilities into a single MacroDriftSignal.
   * marketProbs are Polymarket yesPrice values (0-1), normalized to [-1, 1].
   */
  fuse(nlpScores: number[], marketProbs: number[]): MacroDriftSignal {
    const nlpAvg = nlpScores.length > 0
      ? nlpScores.reduce((s, v) => s + v, 0) / nlpScores.length
      : 0;

    // Convert market probability (0-1) to sentiment (-1 to 1): p=0.5 -> 0
    const marketSentiments = marketProbs.map(p => (p - 0.5) * 2);
    const marketAvg = marketSentiments.length > 0
      ? marketSentiments.reduce((s, v) => s + v, 0) / marketSentiments.length
      : 0;

    const raw = this.config.nlpWeight * nlpAvg + this.config.marketWeight * marketAvg;

    // EMA smoothing (Kalman-like approximation)
    if (!this.initialized) {
      this.emaValue = raw;
      this.initialized = true;
    } else {
      this.emaValue = this.config.emaAlpha * raw + (1 - this.config.emaAlpha) * this.emaValue;
    }

    const smoothed = Math.max(-1, Math.min(1, this.emaValue));
    const strength = Math.abs(smoothed);
    const direction: MacroDriftSignal['direction'] =
      smoothed > 0.1 ? 'bullish' : smoothed < -0.1 ? 'bearish' : 'neutral';

    // Confidence scales with input sample size
    const sampleFactor = Math.min(1, (nlpScores.length + marketProbs.length) / 10);
    const confidence = Math.min(0.95, 0.4 + sampleFactor * 0.55);

    const signal: MacroDriftSignal = {
      direction,
      strength,
      confidence,
      timestamp: Date.now(),
      components: { nlpScore: nlpAvg, marketProb: marketAvg },
    };

    this.history.push(signal);
    if (this.history.length > this.config.historySize) {
      this.history.shift();
    }

    logger.debug(`[SignalFusionEngine] ${direction} strength=${strength.toFixed(3)} conf=${confidence.toFixed(2)}`);
    return signal;
  }

  getHistory(): MacroDriftSignal[] {
    return [...this.history];
  }
}
