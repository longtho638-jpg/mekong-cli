/**
 * Jitter Injector — adds randomized delays and order size variation
 * to avoid deterministic patterns detectable by anti-bot systems.
 */
import { JitterConfig } from '../types';

export class JitterInjector {
  private config: JitterConfig;

  constructor(config: JitterConfig) {
    this.config = config;
  }

  /** Generate a random delay (ms) using Box-Muller normal distribution */
  generateDelay(): number {
    const { meanMs, stdMs } = this.config;
    const u1 = Math.random();
    const u2 = Math.random();
    // Box-Muller transform for normal distribution
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const delay = Math.max(0, meanMs + z * stdMs);
    return Math.round(delay * 100) / 100;
  }

  /** Apply jitter delay — returns a promise that resolves after the delay */
  async applyDelay(): Promise<number> {
    const delayMs = this.generateDelay();
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return delayMs;
  }

  /** Jitter an order size by ±configured percentage */
  jitterOrderSize(originalSize: number): number {
    const pct = this.config.orderSizeJitterPct / 100;
    const jitter = (Math.random() * 2 - 1) * pct;
    const jittered = originalSize * (1 + jitter);
    // Round to 8 decimal places for crypto precision
    return Math.round(jittered * 1e8) / 1e8;
  }

  /** Get current config (for metrics) */
  getConfig(): JitterConfig {
    return { ...this.config };
  }
}
