/**
 * Bottleneck Detector — analyzes profiling data to identify top performance bottlenecks.
 * Outputs ranked list with estimated impact percentage.
 */
import { ProfilingResult, ProfileSample } from './profiler';

export interface Bottleneck {
  id: string;
  category: 'event-loop' | 'memory' | 'cpu' | 'gc' | 'network' | 'throughput';
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  impactPercent: number; // estimated % impact on overall performance
  metric: string;
  currentValue: number;
  threshold: number;
  suggestion: string;
}

export interface DetectorConfig {
  eventLoopLagThresholdMs: number;
  memoryHeapThresholdMB: number;
  cpuThresholdPercent: number;
  gcPauseThresholdMs: number;
  networkLatencyThresholdMs: number;
  minOrderThroughput: number;
}

const DEFAULT_THRESHOLDS: DetectorConfig = {
  eventLoopLagThresholdMs: 50,
  memoryHeapThresholdMB: 512,
  cpuThresholdPercent: 80,
  gcPauseThresholdMs: 500,
  networkLatencyThresholdMs: 200,
  minOrderThroughput: 10,
};

/**
 * Detects bottlenecks from profiling result. Returns top 5 ranked by impact.
 */
export function detectBottlenecks(
  result: ProfilingResult,
  config: Partial<DetectorConfig> = {}
): Bottleneck[] {
  const cfg = { ...DEFAULT_THRESHOLDS, ...config };
  const { summary } = result;
  const bottlenecks: Bottleneck[] = [];

  // 1. Event loop lag
  if (summary.maxEventLoopLagMs > cfg.eventLoopLagThresholdMs) {
    const ratio = summary.maxEventLoopLagMs / cfg.eventLoopLagThresholdMs;
    bottlenecks.push({
      id: 'event-loop-lag',
      category: 'event-loop',
      description: 'High event loop lag detected — synchronous operations blocking the loop',
      severity: ratio > 3 ? 'critical' : ratio > 2 ? 'high' : 'medium',
      impactPercent: Math.min(ratio * 15, 40),
      metric: 'maxEventLoopLagMs',
      currentValue: summary.maxEventLoopLagMs,
      threshold: cfg.eventLoopLagThresholdMs,
      suggestion: 'Move heavy computation to worker threads or reduce batch sizes',
    });
  }

  // 2. Memory pressure
  if (summary.peakMemoryHeapMB > cfg.memoryHeapThresholdMB) {
    const ratio = summary.peakMemoryHeapMB / cfg.memoryHeapThresholdMB;
    bottlenecks.push({
      id: 'memory-pressure',
      category: 'memory',
      description: 'High heap memory usage — potential memory leak or large data structures',
      severity: ratio > 2 ? 'critical' : ratio > 1.5 ? 'high' : 'medium',
      impactPercent: Math.min(ratio * 12, 35),
      metric: 'peakMemoryHeapMB',
      currentValue: summary.peakMemoryHeapMB,
      threshold: cfg.memoryHeapThresholdMB,
      suggestion: 'Reduce in-memory cache sizes or enable streaming for large datasets',
    });
  }

  // 3. CPU saturation
  if (summary.avgCpuUserPercent > cfg.cpuThresholdPercent) {
    const ratio = summary.avgCpuUserPercent / cfg.cpuThresholdPercent;
    bottlenecks.push({
      id: 'cpu-saturation',
      category: 'cpu',
      description: 'CPU usage exceeds threshold — compute-heavy operations dominating',
      severity: ratio > 1.5 ? 'critical' : 'high',
      impactPercent: Math.min(ratio * 20, 45),
      metric: 'avgCpuUserPercent',
      currentValue: summary.avgCpuUserPercent,
      threshold: cfg.cpuThresholdPercent,
      suggestion: 'Offload crypto/JSON ops to native addons or worker threads',
    });
  }

  // 4. GC pressure
  if (summary.totalGcPauseMs > cfg.gcPauseThresholdMs) {
    const ratio = summary.totalGcPauseMs / cfg.gcPauseThresholdMs;
    bottlenecks.push({
      id: 'gc-pressure',
      category: 'gc',
      description: 'Excessive garbage collection pauses — too many short-lived allocations',
      severity: ratio > 3 ? 'critical' : ratio > 1.5 ? 'high' : 'medium',
      impactPercent: Math.min(ratio * 10, 30),
      metric: 'totalGcPauseMs',
      currentValue: summary.totalGcPauseMs,
      threshold: cfg.gcPauseThresholdMs,
      suggestion: 'Use object pooling and reduce temporary allocations in hot paths',
    });
  }

  // 5. Network latency
  if (summary.avgNetworkLatencyMs > cfg.networkLatencyThresholdMs && summary.avgNetworkLatencyMs >= 0) {
    const ratio = summary.avgNetworkLatencyMs / cfg.networkLatencyThresholdMs;
    bottlenecks.push({
      id: 'network-latency',
      category: 'network',
      description: 'High network latency to exchange endpoints',
      severity: ratio > 2 ? 'critical' : ratio > 1.5 ? 'high' : 'medium',
      impactPercent: Math.min(ratio * 18, 40),
      metric: 'avgNetworkLatencyMs',
      currentValue: summary.avgNetworkLatencyMs,
      threshold: cfg.networkLatencyThresholdMs,
      suggestion: 'Enable connection pooling, use WebSocket feeds, or colocate with exchange',
    });
  }

  // 6. Low throughput
  if (summary.avgOrderThroughput < cfg.minOrderThroughput && summary.avgOrderThroughput >= 0) {
    const ratio = cfg.minOrderThroughput / Math.max(summary.avgOrderThroughput, 0.1);
    bottlenecks.push({
      id: 'low-throughput',
      category: 'throughput',
      description: 'Order throughput below minimum target',
      severity: ratio > 5 ? 'critical' : ratio > 2 ? 'high' : 'medium',
      impactPercent: Math.min(ratio * 10, 35),
      metric: 'avgOrderThroughput',
      currentValue: summary.avgOrderThroughput,
      threshold: cfg.minOrderThroughput,
      suggestion: 'Increase batch sizes, parallelize order submission, reduce validation overhead',
    });
  }

  // 7. Memory leak detection (rising trend)
  const leakDetected = detectMemoryLeak(result.samples);
  if (leakDetected) {
    bottlenecks.push({
      id: 'memory-leak',
      category: 'memory',
      description: 'Possible memory leak — heap usage trending upward consistently',
      severity: 'high',
      impactPercent: 25,
      metric: 'memoryTrend',
      currentValue: leakDetected.slopeMBPerMin,
      threshold: 1, // 1MB/min growth
      suggestion: 'Profile with --inspect and check for retained references in caches/closures',
    });
  }

  // Sort by impact descending, return top 5
  return bottlenecks
    .sort((a, b) => b.impactPercent - a.impactPercent)
    .slice(0, 5);
}

function detectMemoryLeak(
  samples: ProfileSample[]
): { slopeMBPerMin: number } | null {
  if (samples.length < 5) return null;

  // Simple linear regression on heap usage over time
  const n = samples.length;
  const xs = samples.map((s) => s.timestamp);
  const ys = samples.map((s) => s.memoryHeapUsedMB);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;

  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (ys[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }

  if (den === 0) return null;
  const slope = num / den; // MB per ms
  const slopeMBPerMin = slope * 60000;

  // Only flag if growth > 1 MB/min
  return slopeMBPerMin > 1 ? { slopeMBPerMin } : null;
}
