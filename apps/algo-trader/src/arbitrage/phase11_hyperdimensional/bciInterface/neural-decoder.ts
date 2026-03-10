/**
 * Phase 11 Module 2: BCI Integration — Neural Decoder.
 *
 * Rule-based classifier that maps EEG band-power ratios to trader intentions.
 * No external ML libraries — pure arithmetic decision tree.
 */

import type { EegSample } from './eeg-simulator';

export type IntentionType =
  | 'increase_risk'
  | 'decrease_risk'
  | 'pause'
  | 'resume'
  | 'emergency_stop'
  | 'none';

export interface NeuralDecoderConfig {
  /** Dry-run mode. Default: true */
  dryRun: boolean;
}

export interface DecodedIntention {
  intention: IntentionType;
  /** Normalized confidence score 0–1 */
  confidence: number;
  timestamp: number;
  /** Raw band powers used for classification */
  bandPower: { alpha: number; beta: number; theta: number };
}

const DEFAULTS: NeuralDecoderConfig = { dryRun: true };

/**
 * Classify EEG band-power ratios into trader intentions.
 *
 * Decision rules (in priority order):
 *  1. Very high theta (>300) + high beta (>300)  → emergency_stop  (stressed overload)
 *  2. High beta (>200) + low alpha (<50)          → increase_risk   (focused/alert)
 *  3. High alpha (>200) + low beta (<50)          → decrease_risk   (relaxed)
 *  4. High theta (>200) + low beta (<50)          → pause           (drowsy/theta dominant)
 *  5. Balanced alpha+beta, low theta (<30)        → resume          (neutral ready)
 *  6. Otherwise                                   → none
 */
export class NeuralDecoder {
  private readonly cfg: NeuralDecoderConfig;
  private decodeCount = 0;

  constructor(config: Partial<NeuralDecoderConfig> = {}) {
    this.cfg = { ...DEFAULTS, ...config };
  }

  decode(sample: EegSample): DecodedIntention {
    this.decodeCount++;
    const { alpha, beta, theta } = sample.bandPower;
    const total = alpha + beta + theta + 1e-9; // avoid div-by-zero

    let intention: IntentionType = 'none';
    let rawScore = 0;

    if (theta > 300 && beta > 300) {
      // Extreme stress overload → emergency stop
      intention = 'emergency_stop';
      rawScore = Math.min((theta + beta) / 800, 1);
    } else if (beta > 200 && alpha < 50) {
      // High beta, suppressed alpha → focused/alert → increase risk
      intention = 'increase_risk';
      rawScore = Math.min(beta / 400, 1) * (1 - alpha / 100);
    } else if (alpha > 200 && beta < 50) {
      // High alpha, suppressed beta → relaxed → decrease risk
      intention = 'decrease_risk';
      rawScore = Math.min(alpha / 400, 1) * (1 - beta / 100);
    } else if (theta > 200 && beta < 50) {
      // Theta dominant, low beta → drowsy/unfocused → pause
      intention = 'pause';
      rawScore = Math.min(theta / 400, 1) * (1 - beta / 100);
    } else if (alpha > 50 && beta > 50 && theta < 30) {
      // Balanced, low theta → neutral-ready → resume
      intention = 'resume';
      const balance = 1 - Math.abs(alpha - beta) / (alpha + beta + 1);
      rawScore = balance * (1 - theta / 60);
    } else {
      intention = 'none';
      rawScore = 0;
    }

    // Normalize confidence to [0, 1] with band-ratio context
    const dominanceRatio = Math.max(alpha, beta, theta) / total;
    const confidence = Math.max(0, Math.min(1, rawScore * dominanceRatio * 2));

    return {
      intention,
      confidence,
      timestamp: Date.now(),
      bandPower: { alpha, beta, theta },
    };
  }

  getDecodeCount(): number {
    return this.decodeCount;
  }

  getConfig(): NeuralDecoderConfig {
    return { ...this.cfg };
  }

  reset(): void {
    this.decodeCount = 0;
  }
}
