export interface LatencyMonitorOptions {
  maxLatencyMs: number; // e.g., 1000 for 1 second
  warningThresholdMs?: number; // e.g., 500 for warning
}

export class LatencyMonitor {
  private options: LatencyMonitorOptions;
  private recentLatencies: number[] = [];
  private maxWindowSize: number = 100;

  constructor(options: LatencyMonitorOptions) {
    this.options = options;
  }

  /**
   * Record a latency measurement
   */
  record(latencyMs: number): void {
    this.recentLatencies.push(latencyMs);

    // Keep only recent window
    if (this.recentLatencies.length > this.maxWindowSize) {
      this.recentLatencies.shift();
    }
  }

  /**
   * Check if latency is within acceptable range
   * Returns true if OK, false if exceeded
   */
  check(): { ok: boolean; currentLatency: number; warning?: string } {
    if (this.recentLatencies.length === 0) {
      return { ok: true, currentLatency: 0 };
    }

    const p95Latency = this.getP95Latency();

    // Check P95 against max
    if (p95Latency >= this.options.maxLatencyMs) {
      return {
        ok: false,
        currentLatency: p95Latency,
      };
    }

    // Check warning threshold
    const warningThreshold = this.options.warningThresholdMs || this.options.maxLatencyMs * 0.5;
    if (p95Latency >= warningThreshold) {
      return {
        ok: true,
        currentLatency: p95Latency,
        warning: `P95 latency ${(p95Latency).toFixed(0)}ms approaching limit`,
      };
    }

    return {
      ok: true,
      currentLatency: p95Latency,
    };
  }

  /**
   * Get average latency
   */
  getAverageLatency(): number {
    if (this.recentLatencies.length === 0) return 0;
    const sum = this.recentLatencies.reduce((a, b) => a + b, 0);
    return sum / this.recentLatencies.length;
  }

  /**
   * Get P95 latency
   */
  getP95Latency(): number {
    if (this.recentLatencies.length === 0) return 0;
    const sorted = [...this.recentLatencies].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[Math.min(index, sorted.length - 1)];
  }

  /**
   * Get status
   */
  getStatus(): {
    average: number;
    p95: number;
    max: number;
    sampleCount: number;
  } {
    if (this.recentLatencies.length === 0) {
      return { average: 0, p95: 0, max: 0, sampleCount: 0 };
    }
    return {
      average: this.getAverageLatency(),
      p95: this.getP95Latency(),
      max: Math.max(...this.recentLatencies),
      sampleCount: this.recentLatencies.length,
    };
  }

  /**
   * Clear history
   */
  clear(): void {
    this.recentLatencies = [];
  }
}
