/**
 * Performance Profiler — collects runtime metrics using Node.js built-in APIs.
 * Tracks: event loop lag, GC stats, CPU usage, network latency, order throughput.
 */
import { performance, PerformanceObserver, monitorEventLoopDelay } from 'perf_hooks';

export interface ProfileSample {
  timestamp: number;
  eventLoopLagMs: number;
  cpuUserUs: number;
  cpuSystemUs: number;
  memoryHeapUsedMB: number;
  memoryRssMB: number;
  gcPauseMs: number;
  networkLatencyMs: number;
  orderThroughput: number; // orders/sec
}

export interface ProfilingConfig {
  durationSec: number;
  sampleIntervalMs: number;
  includeClinic: boolean;
}

export interface ProfilingResult {
  samples: ProfileSample[];
  summary: ProfilingSummary;
  durationMs: number;
}

export interface ProfilingSummary {
  avgEventLoopLagMs: number;
  maxEventLoopLagMs: number;
  avgCpuUserPercent: number;
  avgMemoryHeapMB: number;
  peakMemoryHeapMB: number;
  totalGcPauseMs: number;
  avgNetworkLatencyMs: number;
  avgOrderThroughput: number;
}

/** Measures network latency via a simple HTTP HEAD request */
async function measureNetworkLatency(url: string): Promise<number> {
  const { default: http } = await import('http');
  const start = performance.now();
  return new Promise<number>((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(performance.now() - start);
    });
    req.on('error', () => resolve(-1));
    req.setTimeout(2000, () => { req.destroy(); resolve(-1); });
  });
}

/** Collects profiling data over configured duration */
export async function runProfiler(
  config: ProfilingConfig,
  options?: { networkUrl?: string; orderCounter?: () => number }
): Promise<ProfilingResult> {
  const samples: ProfileSample[] = [];
  const networkUrl = options?.networkUrl ?? 'http://localhost:3000/health';
  const getOrderCount = options?.orderCounter ?? (() => 0);

  // GC tracking via PerformanceObserver
  let totalGcPause = 0;
  let gcObserver: PerformanceObserver | null = null;
  try {
    gcObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        totalGcPause += entry.duration;
      }
    });
    gcObserver.observe({ entryTypes: ['gc'] });
  } catch {
    // GC observation not available in all environments
  }

  // Event loop delay histogram
  let histogram: ReturnType<typeof monitorEventLoopDelay> | null = null;
  try {
    histogram = monitorEventLoopDelay({ resolution: 20 });
    histogram.enable();
  } catch {
    // Fallback if monitorEventLoopDelay unavailable
  }

  const startTime = performance.now();
  const endTime = startTime + config.durationSec * 1000;
  let prevCpu = process.cpuUsage();
  let prevOrderCount = getOrderCount();
  let prevSampleTime = startTime;

  return new Promise<ProfilingResult>((resolve) => {
    const interval = setInterval(async () => {
      const now = performance.now();
      if (now >= endTime) {
        clearInterval(interval);
        histogram?.disable();
        gcObserver?.disconnect();
        resolve({
          samples,
          summary: computeSummary(samples, totalGcPause),
          durationMs: now - startTime,
        });
        return;
      }

      const cpu = process.cpuUsage(prevCpu);
      const mem = process.memoryUsage();
      const elapsed = (now - prevSampleTime) * 1000; // microseconds
      const currentOrderCount = getOrderCount();
      const elapsedSec = (now - prevSampleTime) / 1000;

      const eventLoopLag = histogram
        ? histogram.mean / 1e6 // nanoseconds to ms
        : 0;

      let netLatency = -1;
      try {
        netLatency = await measureNetworkLatency(networkUrl);
      } catch {
        // skip on error
      }

      samples.push({
        timestamp: now,
        eventLoopLagMs: eventLoopLag,
        cpuUserUs: cpu.user,
        cpuSystemUs: cpu.system,
        memoryHeapUsedMB: mem.heapUsed / 1024 / 1024,
        memoryRssMB: mem.rss / 1024 / 1024,
        gcPauseMs: totalGcPause,
        networkLatencyMs: netLatency,
        orderThroughput: elapsedSec > 0
          ? (currentOrderCount - prevOrderCount) / elapsedSec
          : 0,
      });

      prevCpu = process.cpuUsage();
      prevOrderCount = currentOrderCount;
      prevSampleTime = now;
    }, config.sampleIntervalMs);
  });
}

function computeSummary(
  samples: ProfileSample[],
  totalGcPause: number
): ProfilingSummary {
  if (samples.length === 0) {
    return {
      avgEventLoopLagMs: 0, maxEventLoopLagMs: 0,
      avgCpuUserPercent: 0, avgMemoryHeapMB: 0,
      peakMemoryHeapMB: 0, totalGcPauseMs: 0,
      avgNetworkLatencyMs: 0, avgOrderThroughput: 0,
    };
  }

  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const avg = (arr: number[]) => sum(arr) / arr.length;

  const lags = samples.map((s) => s.eventLoopLagMs);
  const heaps = samples.map((s) => s.memoryHeapUsedMB);
  const nets = samples.filter((s) => s.networkLatencyMs >= 0).map((s) => s.networkLatencyMs);

  return {
    avgEventLoopLagMs: avg(lags),
    maxEventLoopLagMs: Math.max(...lags),
    avgCpuUserPercent: avg(samples.map((s) => s.cpuUserUs)) / 10000,
    avgMemoryHeapMB: avg(heaps),
    peakMemoryHeapMB: Math.max(...heaps),
    totalGcPauseMs: totalGcPause,
    avgNetworkLatencyMs: nets.length > 0 ? avg(nets) : -1,
    avgOrderThroughput: avg(samples.map((s) => s.orderThroughput)),
  };
}
