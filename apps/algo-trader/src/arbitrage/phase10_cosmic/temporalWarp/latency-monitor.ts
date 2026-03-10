/**
 * Latency Monitor — tracks injection latency statistics over time.
 * Collects nanosecond-precision samples from InjectionEngine results.
 * Emits alerts when latency exceeds configurable thresholds.
 * Module 1 of Phase 10 Cosmic — default disabled/dry-run.
 */

export interface LatencyMonitorConfig {
  /** Max samples to retain in circular buffer. Default: 10000. */
  maxSamples: number;
  /** Alert threshold in nanoseconds. Default: 10000 (10μs). */
  alertThresholdNs: number;
  /** Window size for moving average calculation. Default: 100. */
  windowSize: number;
  /** Human-readable label. Default: 'default'. */
  label: string;
  /** P99 warning threshold in nanoseconds. Default: 10000. */
  p99WarningThresholdNs: number;
}

export interface LatencyStats {
  count: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  movingAvg: number;
  alertCount: number;
  /** Alias: sampleCount = count */
  sampleCount: number;
  /** Alias: minNs = min */
  minNs: number;
  /** Alias: maxNs = max */
  maxNs: number;
  /** Alias: avgNs = avg */
  avgNs: number;
  /** Alias: p50Ns = p50 */
  p50Ns: number;
  /** Alias: p99Ns = p99 */
  p99Ns: number;
  /** True when p99 exceeds p99WarningThresholdNs. */
  p99Warning: boolean;
  /** Label from config. */
  label: string;
  /** Timestamp when stats were computed. */
  snapshotAt: number;
}

export interface LatencyAlert {
  sampleIndex: number;
  latencyNs: number;
  threshold: number;
  timestamp: number;
}

type AlertHandler = (alert: LatencyAlert) => void;

const DEFAULT_CONFIG: LatencyMonitorConfig = {
  maxSamples: 10_000,
  alertThresholdNs: 10_000,
  windowSize: 100,
  label: 'default',
  p99WarningThresholdNs: 10_000,
};

export class LatencyMonitor {
  private readonly cfg: LatencyMonitorConfig;
  private samples: number[] = [];
  private alerts: LatencyAlert[] = [];
  private totalSamples = 0;
  private handlers: AlertHandler[] = [];

  constructor(config: Partial<LatencyMonitorConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /** Record a latency sample in nanoseconds. Must be >= 0. */
  record(latencyNs: number): void {
    if (latencyNs < 0) throw new Error('latencyNs must be >= 0');
    this.samples.push(latencyNs);
    this.totalSamples++;

    if (this.samples.length > this.cfg.maxSamples) {
      this.samples = this.samples.slice(-this.cfg.maxSamples);
    }

    if (latencyNs > this.cfg.alertThresholdNs) {
      const alert: LatencyAlert = {
        sampleIndex: this.totalSamples - 1,
        latencyNs,
        threshold: this.cfg.alertThresholdNs,
        timestamp: Date.now(),
      };
      this.alerts.push(alert);
      for (const handler of this.handlers) {
        try { handler(alert); } catch { /* swallow */ }
      }
    }
  }

  /** Alias for record(). */
  recordSample(latencyNs: number): void {
    this.record(latencyNs);
  }

  /** Get median (50th percentile). */
  getP50(): number {
    if (this.samples.length === 0) return 0;
    const sorted = [...this.samples].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.5)];
  }

  /** Get 99th percentile. */
  getP99(): number {
    if (this.samples.length === 0) return 0;
    const sorted = [...this.samples].sort((a, b) => a - b);
    return sorted[Math.min(Math.floor(sorted.length * 0.99), sorted.length - 1)];
  }

  /** Compute aggregate latency statistics. */
  getStats(): LatencyStats {
    const now = Date.now();
    if (this.samples.length === 0) {
      return {
        count: 0, min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0,
        movingAvg: 0, alertCount: 0,
        sampleCount: 0, minNs: 0, maxNs: 0, avgNs: 0, p50Ns: 0, p99Ns: 0,
        p99Warning: false, label: this.cfg.label, snapshotAt: now,
      };
    }

    const sorted = [...this.samples].sort((a, b) => a - b);
    const n = sorted.length;
    const sum = sorted.reduce((s, v) => s + v, 0);
    const windowSlice = this.samples.slice(-this.cfg.windowSize);
    const windowSum = windowSlice.reduce((s, v) => s + v, 0);
    const p50 = sorted[Math.floor(n * 0.5)];
    const p95 = sorted[Math.floor(n * 0.95)];
    const p99 = sorted[Math.min(Math.floor(n * 0.99), n - 1)];
    const avg = sum / n;

    return {
      count: n, min: sorted[0], max: sorted[n - 1], avg, p50, p95, p99,
      movingAvg: windowSlice.length > 0 ? windowSum / windowSlice.length : 0,
      alertCount: this.alerts.length,
      sampleCount: n, minNs: sorted[0], maxNs: sorted[n - 1], avgNs: avg,
      p50Ns: p50, p99Ns: p99,
      p99Warning: p99 > this.cfg.p99WarningThresholdNs,
      label: this.cfg.label, snapshotAt: now,
    };
  }

  /** Register an alert handler. Returns unsubscribe function. */
  onAlert(handler: AlertHandler): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter(h => h !== handler);
    };
  }

  getAlerts(): LatencyAlert[] { return [...this.alerts]; }
  getSampleCount(): number { return this.samples.length; }
  getTotalSamples(): number { return this.totalSamples; }
  getLabel(): string { return this.cfg.label; }

  /** Reset all samples, alerts, and counters. */
  reset(): void {
    this.samples = [];
    this.alerts = [];
    this.totalSamples = 0;
  }

  getConfig(): LatencyMonitorConfig { return { ...this.cfg }; }
}
