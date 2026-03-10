/**
 * Measures simulated hardware vs software latency.
 * Returns benchmark results with no real timing overhead.
 */

import { EventEmitter } from 'events';

export interface BenchmarkResult {
  mode: 'hardware' | 'software';
  samples: number;
  meanLatencyUs: number;
  p99LatencyUs: number;
  minLatencyUs: number;
  maxLatencyUs: number;
}

/** Generates deterministic mock latency samples in microseconds. */
function generateSamples(mode: 'hardware' | 'software', count: number): number[] {
  const base = mode === 'hardware' ? 5 : 50;
  const jitter = mode === 'hardware' ? 2 : 20;
  return Array.from({ length: count }, (_, i) => {
    const noise = Math.abs(Math.sin(i * 7 + base)) * jitter;
    return base + noise;
  });
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export class LatencyBenchmark extends EventEmitter {
  private lastResults: BenchmarkResult[] = [];

  constructor() {
    super();
  }

  /** Run benchmark for a given mode with N samples. */
  async run(mode: 'hardware' | 'software', samples = 1000): Promise<BenchmarkResult> {
    await Promise.resolve();
    const raw = generateSamples(mode, samples);
    const sorted = [...raw].sort((a, b) => a - b);
    const mean = raw.reduce((s, v) => s + v, 0) / raw.length;

    const result: BenchmarkResult = {
      mode,
      samples,
      meanLatencyUs: parseFloat(mean.toFixed(2)),
      p99LatencyUs: parseFloat(percentile(sorted, 99).toFixed(2)),
      minLatencyUs: parseFloat(sorted[0].toFixed(2)),
      maxLatencyUs: parseFloat(sorted[sorted.length - 1].toFixed(2)),
    };

    this.lastResults.push(result);
    this.emit('benchmark-complete', result);
    return result;
  }

  /** Run both hw and sw benchmarks and return comparison. */
  async compare(samples = 1000): Promise<{ hw: BenchmarkResult; sw: BenchmarkResult; improvementFactor: number }> {
    const hw = await this.run('hardware', samples);
    const sw = await this.run('software', samples);
    const improvementFactor = parseFloat((sw.meanLatencyUs / hw.meanLatencyUs).toFixed(2));
    const comparison = { hw, sw, improvementFactor };
    this.emit('comparison-complete', comparison);
    return comparison;
  }

  getLastResults(): BenchmarkResult[] {
    return [...this.lastResults];
  }
}
