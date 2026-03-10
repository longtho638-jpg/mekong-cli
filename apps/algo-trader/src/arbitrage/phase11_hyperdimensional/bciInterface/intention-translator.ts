/**
 * Phase 11 Module 2: BCI Integration — Intention Translator.
 *
 * Maps decoded neural intentions to concrete trading config changes.
 * Only applies changes when confidence >= minConfidence threshold.
 */

import type { DecodedIntention, IntentionType } from './neural-decoder';

export interface IntentionTranslatorConfig {
  /** Minimum confidence required to apply a change. Default: 0.6 */
  minConfidence: number;
  /** Dry-run mode. Default: true */
  dryRun: boolean;
}

export interface ConfigChange {
  parameter: string;
  oldValue: unknown;
  newValue: unknown;
  reason: string;
  timestamp: number;
  intention: IntentionType;
  confidence: number;
}

const DEFAULTS: IntentionTranslatorConfig = {
  minConfidence: 0.6,
  dryRun: true,
};

/** Current simulated trading config state tracked by the translator. */
interface TradingState {
  maxPositionSize: number;
  tradingEnabled: boolean;
  riskMultiplier: number;
}

const INITIAL_STATE: TradingState = {
  maxPositionSize: 1000,
  tradingEnabled: true,
  riskMultiplier: 1.0,
};

export class IntentionTranslator {
  private readonly cfg: IntentionTranslatorConfig;
  private readonly history: ConfigChange[] = [];
  private state: TradingState = { ...INITIAL_STATE };

  constructor(config: Partial<IntentionTranslatorConfig> = {}) {
    this.cfg = { ...DEFAULTS, ...config };
  }

  /**
   * Translate a decoded intention into a config change.
   * Returns null if confidence is below threshold or intention is 'none'.
   */
  translate(decoded: DecodedIntention): ConfigChange | null {
    if (decoded.intention === 'none') return null;
    if (decoded.confidence < this.cfg.minConfidence) return null;

    const change = this.buildChange(decoded);
    if (change === null) return null;

    this.applyChange(change);
    this.history.push(change);
    return change;
  }

  private buildChange(decoded: DecodedIntention): ConfigChange | null {
    const { intention, confidence, timestamp } = decoded;
    const base = { intention, confidence, timestamp };

    switch (intention) {
      case 'increase_risk': {
        const oldValue = this.state.maxPositionSize;
        const newValue = Math.round(oldValue * 1.5);
        return { ...base, parameter: 'maxPositionSize', oldValue, newValue, reason: 'High beta focus state detected — increasing position size by 50%' };
      }
      case 'decrease_risk': {
        const oldValue = this.state.maxPositionSize;
        const newValue = Math.round(oldValue * 0.5);
        return { ...base, parameter: 'maxPositionSize', oldValue, newValue, reason: 'High alpha relaxed state detected — halving position size' };
      }
      case 'pause': {
        const oldValue = this.state.tradingEnabled;
        if (!oldValue) return null; // already paused
        return { ...base, parameter: 'tradingEnabled', oldValue, newValue: false, reason: 'Theta-dominant drowsy state — pausing trading' };
      }
      case 'resume': {
        const oldValue = this.state.tradingEnabled;
        if (oldValue) return null; // already active
        return { ...base, parameter: 'tradingEnabled', oldValue, newValue: true, reason: 'Balanced neutral-ready state — resuming trading' };
      }
      case 'emergency_stop': {
        const oldValue = this.state.tradingEnabled;
        return { ...base, parameter: 'tradingEnabled', oldValue, newValue: false, reason: 'Extreme stress overload detected — emergency stop' };
      }
      default:
        return null;
    }
  }

  private applyChange(change: ConfigChange): void {
    switch (change.parameter) {
      case 'maxPositionSize':
        this.state.maxPositionSize = change.newValue as number;
        break;
      case 'tradingEnabled':
        this.state.tradingEnabled = change.newValue as boolean;
        break;
      case 'riskMultiplier':
        this.state.riskMultiplier = change.newValue as number;
        break;
    }
  }

  getHistory(): ConfigChange[] {
    return [...this.history];
  }

  getCurrentState(): Readonly<TradingState> {
    return { ...this.state };
  }

  getConfig(): IntentionTranslatorConfig {
    return { ...this.cfg };
  }

  reset(): void {
    this.history.length = 0;
    this.state = { ...INITIAL_STATE };
  }
}
