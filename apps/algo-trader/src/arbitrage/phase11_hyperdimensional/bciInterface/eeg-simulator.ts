/**
 * Phase 11 Module 2: BCI Integration — EEG Simulator.
 *
 * Simulates EEG signal data using sinusoidal wave models for
 * alpha (8-13Hz), beta (13-30Hz), and theta (4-8Hz) frequency bands.
 * All output is synthetic / dry-run safe.
 */

export type MentalState = 'focused' | 'relaxed' | 'alert' | 'stressed' | 'neutral';

export interface EegSimulatorConfig {
  /** Samples per second. Default: 256 */
  sampleRateHz: number;
  /** Number of EEG channels. Default: 8 */
  channelCount: number;
  /** Dry-run: no side effects. Default: true */
  dryRun: boolean;
}

export interface EegSample {
  /** Raw channel amplitudes (µV) */
  channels: number[];
  /** Unix timestamp ms */
  timestamp: number;
  /** Classified mental state for this sample */
  mentalState: MentalState;
  /** Band powers (µV²) */
  bandPower: { alpha: number; beta: number; theta: number };
}

const DEFAULTS: EegSimulatorConfig = {
  sampleRateHz: 256,
  channelCount: 8,
  dryRun: true,
};

/** Amplitude profiles per mental state (alpha, beta, theta µV) */
const STATE_PROFILES: Record<MentalState, { alpha: number; beta: number; theta: number }> = {
  focused:  { alpha: 5,  beta: 20, theta: 3  },
  relaxed:  { alpha: 25, beta: 5,  theta: 8  },
  alert:    { alpha: 8,  beta: 30, theta: 4  },
  stressed: { alpha: 3,  beta: 35, theta: 12 },
  neutral:  { alpha: 12, beta: 12, theta: 6  },
};

export class EegSimulator {
  private readonly cfg: EegSimulatorConfig;
  private currentState: MentalState = 'neutral';
  private sampleIndex = 0;

  constructor(config: Partial<EegSimulatorConfig> = {}) {
    this.cfg = { ...DEFAULTS, ...config };
  }

  /** Override the simulated mental state. */
  setMentalState(state: MentalState): void {
    this.currentState = state;
  }

  /** Generate one EEG sample for the current mental state. */
  generateSample(): EegSample {
    const profile = STATE_PROFILES[this.currentState];
    const t = this.sampleIndex / this.cfg.sampleRateHz;
    this.sampleIndex++;

    // Generate each band signal using mid-band frequency
    const alphaSignal  = profile.alpha * Math.sin(2 * Math.PI * 10 * t);  // 10 Hz
    const betaSignal   = profile.beta  * Math.sin(2 * Math.PI * 20 * t);  // 20 Hz
    const thetaSignal  = profile.theta * Math.sin(2 * Math.PI * 6  * t);  // 6 Hz

    const channels = Array.from({ length: this.cfg.channelCount }, (_, ch) => {
      const phaseShift = ch * 0.1;
      const noise = (Math.random() - 0.5) * 2; // ±1 µV noise
      return (
        profile.alpha * Math.sin(2 * Math.PI * 10 * t + phaseShift) +
        profile.beta  * Math.sin(2 * Math.PI * 20 * t + phaseShift) +
        profile.theta * Math.sin(2 * Math.PI * 6  * t + phaseShift) +
        noise
      );
    });

    // Band power approximation: amplitude squared
    const bandPower = {
      alpha: alphaSignal * alphaSignal,
      beta:  betaSignal  * betaSignal,
      theta: thetaSignal * thetaSignal,
    };

    return {
      channels,
      timestamp: Date.now(),
      mentalState: this.currentState,
      bandPower,
    };
  }

  getMentalState(): MentalState {
    return this.currentState;
  }

  getConfig(): EegSimulatorConfig {
    return { ...this.cfg };
  }

  getSampleIndex(): number {
    return this.sampleIndex;
  }

  reset(): void {
    this.sampleIndex = 0;
    this.currentState = 'neutral';
  }
}
