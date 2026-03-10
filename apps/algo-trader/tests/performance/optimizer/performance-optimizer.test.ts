/**
 * Tests for Performance Optimizer module.
 * Uses mocked profiling data to verify detector, mutator, auto-tuner, and report logic.
 */
import { ProfilingResult, ProfileSample, ProfilingSummary } from '../../../src/performance/optimizer/profiler';
import { detectBottlenecks, Bottleneck } from '../../../src/performance/optimizer/bottleneck-detector';
import { suggestMutations, applyMutations, ConfigMutation } from '../../../src/performance/optimizer/config-mutator';
import { runAutoTuner, computePerformanceScore, AutoTuneConfig } from '../../../src/performance/optimizer/auto-tuner';
import { generateHtmlReport, ReportData } from '../../../src/performance/optimizer/report-generator';
import { loadTuningConfig } from '../../../src/performance/optimizer/index';
import * as fs from 'fs';
import * as path from 'path';

// --- Mock Data Factories ---

function makeSample(overrides: Partial<ProfileSample> = {}): ProfileSample {
  return {
    timestamp: Date.now(),
    eventLoopLagMs: 10,
    cpuUserUs: 50000,
    cpuSystemUs: 10000,
    memoryHeapUsedMB: 200,
    memoryRssMB: 350,
    gcPauseMs: 100,
    networkLatencyMs: 50,
    orderThroughput: 20,
    ...overrides,
  };
}

function makeSummary(overrides: Partial<ProfilingSummary> = {}): ProfilingSummary {
  return {
    avgEventLoopLagMs: 10,
    maxEventLoopLagMs: 25,
    avgCpuUserPercent: 30,
    avgMemoryHeapMB: 200,
    peakMemoryHeapMB: 300,
    totalGcPauseMs: 100,
    avgNetworkLatencyMs: 50,
    avgOrderThroughput: 20,
    ...overrides,
  };
}

function makeResult(summaryOverrides: Partial<ProfilingSummary> = {}, sampleCount = 10): ProfilingResult {
  const samples: ProfileSample[] = [];
  for (let i = 0; i < sampleCount; i++) {
    samples.push(makeSample({ timestamp: 1000 + i * 100 }));
  }
  return {
    samples,
    summary: makeSummary(summaryOverrides),
    durationMs: sampleCount * 100,
  };
}

// --- Bottleneck Detector Tests ---

describe('BottleneckDetector', () => {
  test('returns empty array when all metrics are healthy', () => {
    const result = makeResult();
    const bottlenecks = detectBottlenecks(result);
    expect(bottlenecks).toHaveLength(0);
  });

  test('detects event loop lag bottleneck', () => {
    const result = makeResult({ maxEventLoopLagMs: 120 });
    const bottlenecks = detectBottlenecks(result);
    const found = bottlenecks.find((b) => b.id === 'event-loop-lag');
    expect(found).toBeDefined();
    expect(found!.category).toBe('event-loop');
    expect(found!.severity).toBe('high');
    expect(found!.impactPercent).toBeGreaterThan(0);
  });

  test('detects critical event loop lag (>3x threshold)', () => {
    const result = makeResult({ maxEventLoopLagMs: 200 });
    const bottlenecks = detectBottlenecks(result);
    const found = bottlenecks.find((b) => b.id === 'event-loop-lag');
    expect(found!.severity).toBe('critical');
  });

  test('detects memory pressure', () => {
    const result = makeResult({ peakMemoryHeapMB: 800 });
    const bottlenecks = detectBottlenecks(result);
    const found = bottlenecks.find((b) => b.id === 'memory-pressure');
    expect(found).toBeDefined();
    expect(found!.category).toBe('memory');
  });

  test('detects CPU saturation', () => {
    const result = makeResult({ avgCpuUserPercent: 95 });
    const bottlenecks = detectBottlenecks(result);
    const found = bottlenecks.find((b) => b.id === 'cpu-saturation');
    expect(found).toBeDefined();
    expect(found!.severity).toBe('high');
  });

  test('detects critical CPU saturation (>1.5x)', () => {
    const result = makeResult({ avgCpuUserPercent: 150 });
    const bottlenecks = detectBottlenecks(result);
    const found = bottlenecks.find((b) => b.id === 'cpu-saturation');
    expect(found!.severity).toBe('critical');
  });

  test('detects GC pressure', () => {
    const result = makeResult({ totalGcPauseMs: 1200 });
    const bottlenecks = detectBottlenecks(result);
    const found = bottlenecks.find((b) => b.id === 'gc-pressure');
    expect(found).toBeDefined();
    expect(found!.category).toBe('gc');
  });

  test('detects network latency', () => {
    const result = makeResult({ avgNetworkLatencyMs: 350 });
    const bottlenecks = detectBottlenecks(result);
    const found = bottlenecks.find((b) => b.id === 'network-latency');
    expect(found).toBeDefined();
    expect(found!.category).toBe('network');
  });

  test('does not flag negative network latency (unavailable)', () => {
    const result = makeResult({ avgNetworkLatencyMs: -1 });
    const bottlenecks = detectBottlenecks(result);
    const found = bottlenecks.find((b) => b.id === 'network-latency');
    expect(found).toBeUndefined();
  });

  test('detects low throughput', () => {
    const result = makeResult({ avgOrderThroughput: 3 });
    const bottlenecks = detectBottlenecks(result);
    const found = bottlenecks.find((b) => b.id === 'low-throughput');
    expect(found).toBeDefined();
    expect(found!.category).toBe('throughput');
  });

  test('detects memory leak from rising trend', () => {
    const samples: ProfileSample[] = [];
    for (let i = 0; i < 20; i++) {
      samples.push(makeSample({
        timestamp: 1000 + i * 1000,
        memoryHeapUsedMB: 200 + i * 5, // 5MB per second = 300MB/min
      }));
    }
    const result: ProfilingResult = {
      samples,
      summary: makeSummary({ peakMemoryHeapMB: 295 }),
      durationMs: 20000,
    };
    const bottlenecks = detectBottlenecks(result);
    const found = bottlenecks.find((b) => b.id === 'memory-leak');
    expect(found).toBeDefined();
    expect(found!.category).toBe('memory');
  });

  test('returns max 5 bottlenecks sorted by impact', () => {
    const result = makeResult({
      maxEventLoopLagMs: 200,
      peakMemoryHeapMB: 1200,
      avgCpuUserPercent: 150,
      totalGcPauseMs: 2000,
      avgNetworkLatencyMs: 500,
      avgOrderThroughput: 1,
    });
    const bottlenecks = detectBottlenecks(result);
    expect(bottlenecks.length).toBeLessThanOrEqual(5);
    // Verify sorted by impactPercent descending
    for (let i = 1; i < bottlenecks.length; i++) {
      expect(bottlenecks[i - 1].impactPercent).toBeGreaterThanOrEqual(bottlenecks[i].impactPercent);
    }
  });

  test('respects custom thresholds', () => {
    const result = makeResult({ maxEventLoopLagMs: 30 });
    // Default threshold is 50, so 30 is fine
    expect(detectBottlenecks(result)).toHaveLength(0);
    // Custom threshold of 20 should flag it
    const bottlenecks = detectBottlenecks(result, { eventLoopLagThresholdMs: 20 });
    expect(bottlenecks.find((b) => b.id === 'event-loop-lag')).toBeDefined();
  });

  test('handles empty samples array', () => {
    const result: ProfilingResult = {
      samples: [],
      summary: makeSummary(),
      durationMs: 0,
    };
    const bottlenecks = detectBottlenecks(result);
    expect(Array.isArray(bottlenecks)).toBe(true);
  });
});

// --- Config Mutator Tests ---

describe('ConfigMutator', () => {
  const defaultConfig: Record<string, number> = {
    batchSize: 50,
    jitterMs: 50,
    rlUpdateFrequency: 10,
    proxyRotationIntervalMs: 30000,
    threadPoolSize: 4,
    cacheMaxEntries: 10000,
    orderParallelism: 5,
  };

  test('suggests batch size reduction for event-loop-lag', () => {
    const bottlenecks: Bottleneck[] = [{
      id: 'event-loop-lag', category: 'event-loop',
      description: '', severity: 'high', impactPercent: 30,
      metric: 'maxEventLoopLagMs', currentValue: 120, threshold: 50,
      suggestion: '',
    }];
    const mutations = suggestMutations(bottlenecks, defaultConfig);
    expect(mutations.length).toBe(1);
    const batchParam = mutations[0].params.find((p) => p.path === 'execution.batchSize');
    expect(batchParam).toBeDefined();
    expect(batchParam!.suggestedValue).toBeLessThan(50);
  });

  test('suggests jitter increase for event-loop-lag', () => {
    const bottlenecks: Bottleneck[] = [{
      id: 'event-loop-lag', category: 'event-loop',
      description: '', severity: 'high', impactPercent: 30,
      metric: 'maxEventLoopLagMs', currentValue: 120, threshold: 50,
      suggestion: '',
    }];
    const mutations = suggestMutations(bottlenecks, defaultConfig);
    const jitterParam = mutations[0].params.find((p) => p.path === 'phase6.jitterMs');
    expect(jitterParam).toBeDefined();
    expect(jitterParam!.suggestedValue).toBeGreaterThan(50);
  });

  test('suggests cache reduction for memory-pressure', () => {
    const bottlenecks: Bottleneck[] = [{
      id: 'memory-pressure', category: 'memory',
      description: '', severity: 'high', impactPercent: 25,
      metric: 'peakMemoryHeapMB', currentValue: 800, threshold: 512,
      suggestion: '',
    }];
    const mutations = suggestMutations(bottlenecks, defaultConfig);
    const cacheParam = mutations[0].params.find((p) => p.path === 'cache.maxEntries');
    expect(cacheParam).toBeDefined();
    expect(cacheParam!.suggestedValue).toBeLessThan(10000);
  });

  test('suggests thread pool increase for cpu-saturation', () => {
    const bottlenecks: Bottleneck[] = [{
      id: 'cpu-saturation', category: 'cpu',
      description: '', severity: 'high', impactPercent: 30,
      metric: 'avgCpuUserPercent', currentValue: 95, threshold: 80,
      suggestion: '',
    }];
    const mutations = suggestMutations(bottlenecks, defaultConfig);
    const poolParam = mutations[0].params.find((p) => p.path === 'execution.threadPoolSize');
    expect(poolParam).toBeDefined();
    expect(poolParam!.suggestedValue).toBeGreaterThan(4);
  });

  test('suggests batch size increase for gc-pressure', () => {
    const bottlenecks: Bottleneck[] = [{
      id: 'gc-pressure', category: 'gc',
      description: '', severity: 'high', impactPercent: 20,
      metric: 'totalGcPauseMs', currentValue: 1200, threshold: 500,
      suggestion: '',
    }];
    const mutations = suggestMutations(bottlenecks, defaultConfig);
    const batchParam = mutations[0].params.find((p) => p.path === 'execution.batchSize');
    expect(batchParam).toBeDefined();
    expect(batchParam!.suggestedValue).toBeGreaterThan(50);
  });

  test('suggests proxy rotation for network-latency', () => {
    const bottlenecks: Bottleneck[] = [{
      id: 'network-latency', category: 'network',
      description: '', severity: 'high', impactPercent: 25,
      metric: 'avgNetworkLatencyMs', currentValue: 350, threshold: 200,
      suggestion: '',
    }];
    const mutations = suggestMutations(bottlenecks, defaultConfig);
    const proxyParam = mutations[0].params.find((p) => p.path === 'phase6.proxyRotationIntervalMs');
    expect(proxyParam).toBeDefined();
    expect(proxyParam!.suggestedValue).toBeLessThan(30000);
  });

  test('suggests parallelism increase for low-throughput', () => {
    const bottlenecks: Bottleneck[] = [{
      id: 'low-throughput', category: 'throughput',
      description: '', severity: 'high', impactPercent: 25,
      metric: 'avgOrderThroughput', currentValue: 3, threshold: 10,
      suggestion: '',
    }];
    const mutations = suggestMutations(bottlenecks, defaultConfig);
    const parParam = mutations[0].params.find((p) => p.path === 'execution.orderParallelism');
    expect(parParam).toBeDefined();
    expect(parParam!.suggestedValue).toBeGreaterThan(5);
  });

  test('respects min/max bounds', () => {
    const bottlenecks: Bottleneck[] = [{
      id: 'event-loop-lag', category: 'event-loop',
      description: '', severity: 'critical', impactPercent: 40,
      metric: 'maxEventLoopLagMs', currentValue: 500, threshold: 50,
      suggestion: '',
    }];
    const config = { ...defaultConfig, batchSize: 2 }; // near min
    const mutations = suggestMutations(bottlenecks, config);
    const batchParam = mutations[0].params.find((p) => p.path === 'execution.batchSize');
    expect(batchParam!.suggestedValue).toBeGreaterThanOrEqual(1); // min bound
  });

  test('returns empty for unknown bottleneck id', () => {
    const bottlenecks: Bottleneck[] = [{
      id: 'unknown-thing' as any, category: 'cpu',
      description: '', severity: 'low', impactPercent: 5,
      metric: 'x', currentValue: 1, threshold: 1, suggestion: '',
    }];
    const mutations = suggestMutations(bottlenecks, defaultConfig);
    expect(mutations).toHaveLength(0);
  });

  test('applyMutations creates nested config correctly', () => {
    const config = { execution: { batchSize: 50 } };
    const mutations: ConfigMutation[] = [{
      bottleneckId: 'event-loop-lag',
      params: [{
        path: 'execution.batchSize', currentValue: 50, suggestedValue: 30,
        minValue: 1, maxValue: 100, unit: 'items', reason: 'test',
      }],
    }];
    const result = applyMutations(config, mutations);
    expect((result as any).execution.batchSize).toBe(30);
    // Original not mutated
    expect(config.execution.batchSize).toBe(50);
  });

  test('applyMutations creates missing nested keys', () => {
    const config = {};
    const mutations: ConfigMutation[] = [{
      bottleneckId: 'test',
      params: [{
        path: 'a.b.c', currentValue: 0, suggestedValue: 42,
        minValue: 0, maxValue: 100, unit: 'x', reason: 'test',
      }],
    }];
    const result = applyMutations(config, mutations);
    expect((result as any).a.b.c).toBe(42);
  });
});

// --- Auto-Tuner Tests ---

describe('AutoTuner', () => {
  const baseConfig: AutoTuneConfig = {
    enabled: true,
    improvementThreshold: 0.1,
    maxIterations: 5,
    dryRun: true,
  };

  test('computePerformanceScore returns positive number', () => {
    const result = makeResult();
    const score = computePerformanceScore(result);
    expect(score).toBeGreaterThan(0);
  });

  test('worse metrics produce higher score', () => {
    const good = makeResult({ avgEventLoopLagMs: 5, peakMemoryHeapMB: 100 });
    const bad = makeResult({ avgEventLoopLagMs: 100, peakMemoryHeapMB: 800 });
    expect(computePerformanceScore(bad)).toBeGreaterThan(computePerformanceScore(good));
  });

  test('dry-run mode estimates improvement without profilerFn', async () => {
    const mutations: ConfigMutation[] = [{
      bottleneckId: 'event-loop-lag',
      params: [{
        path: 'execution.batchSize', currentValue: 50, suggestedValue: 30,
        minValue: 1, maxValue: 100, unit: 'items', reason: 'test',
      }],
    }];
    const baseline = makeResult({ maxEventLoopLagMs: 120 });
    const profilerFn = jest.fn();
    const applyFn = jest.fn();

    const result = await runAutoTuner(baseConfig, mutations, baseline, profilerFn, applyFn);
    expect(result.iterations).toHaveLength(1);
    expect(profilerFn).not.toHaveBeenCalled();
    expect(applyFn).not.toHaveBeenCalled();
  });

  test('disabled auto-tuner returns empty result', async () => {
    const result = await runAutoTuner(
      { ...baseConfig, enabled: false },
      [], makeResult(),
      jest.fn(), jest.fn()
    );
    expect(result.iterations).toHaveLength(0);
    expect(result.totalImprovementPercent).toBe(0);
  });

  test('live mode calls profilerFn and applyFn', async () => {
    const liveConfig: AutoTuneConfig = { ...baseConfig, dryRun: false, maxIterations: 1 };
    const mutations: ConfigMutation[] = [{
      bottleneckId: 'event-loop-lag',
      params: [{
        path: 'execution.batchSize', currentValue: 50, suggestedValue: 30,
        minValue: 1, maxValue: 100, unit: 'items', reason: 'test',
      }],
    }];
    const baseline = makeResult({ avgEventLoopLagMs: 100, maxEventLoopLagMs: 120 });
    // Improved result
    const improved = makeResult({ avgEventLoopLagMs: 5, maxEventLoopLagMs: 10, peakMemoryHeapMB: 100 });
    const profilerFn = jest.fn().mockResolvedValue(improved);
    const applyFn = jest.fn();

    const result = await runAutoTuner(liveConfig, mutations, baseline, profilerFn, applyFn);
    expect(profilerFn).toHaveBeenCalledTimes(1);
    expect(applyFn).toHaveBeenCalledTimes(1);
    expect(result.iterations[0].accepted).toBe(true);
    expect(result.acceptedChanges).toHaveLength(1);
  });

  test('rejects changes below improvement threshold', async () => {
    const liveConfig: AutoTuneConfig = { ...baseConfig, dryRun: false, maxIterations: 1, improvementThreshold: 0.5 };
    const mutations: ConfigMutation[] = [{
      bottleneckId: 'gc-pressure',
      params: [{
        path: 'execution.batchSize', currentValue: 50, suggestedValue: 55,
        minValue: 1, maxValue: 100, unit: 'items', reason: 'test',
      }],
    }];
    const baseline = makeResult({ avgEventLoopLagMs: 20 });
    // Barely improved
    const sameish = makeResult({ avgEventLoopLagMs: 19 });
    const profilerFn = jest.fn().mockResolvedValue(sameish);

    const result = await runAutoTuner(liveConfig, mutations, baseline, profilerFn, jest.fn());
    expect(result.iterations[0].accepted).toBe(false);
    expect(result.rejectedChanges).toHaveLength(1);
  });

  test('limits iterations to maxIterations', async () => {
    const mutations: ConfigMutation[] = Array.from({ length: 10 }, (_, i) => ({
      bottleneckId: `bn-${i}`,
      params: [{
        path: `p.${i}`, currentValue: 10, suggestedValue: 5,
        minValue: 1, maxValue: 100, unit: 'x', reason: 'test',
      }],
    }));
    const result = await runAutoTuner(
      { ...baseConfig, maxIterations: 3 },
      mutations, makeResult(),
      jest.fn(), jest.fn()
    );
    expect(result.iterations).toHaveLength(3);
  });
});

// --- Report Generator Tests ---

describe('ReportGenerator', () => {
  test('generates valid HTML with all sections', () => {
    const data: ReportData = {
      timestamp: '2026-03-09T12:00:00Z',
      profilingResult: makeResult({ maxEventLoopLagMs: 120 }),
      bottlenecks: [{
        id: 'event-loop-lag', category: 'event-loop',
        description: 'High lag', severity: 'high', impactPercent: 30,
        metric: 'maxEventLoopLagMs', currentValue: 120, threshold: 50,
        suggestion: 'Reduce batch size',
      }],
      tuneResult: {
        iterations: [{
          iteration: 1,
          mutation: { bottleneckId: 'event-loop-lag', params: [] },
          baselineScore: 100, tunedScore: 80,
          improvementPercent: 20, accepted: true,
        }],
        acceptedChanges: [{ bottleneckId: 'event-loop-lag', params: [] }],
        rejectedChanges: [],
        totalImprovementPercent: 20,
      },
    };
    const html = generateHtmlReport(data);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Performance Tuning Report');
    expect(html).toContain('2026-03-09');
    expect(html).toContain('event-loop-lag');
    expect(html).toContain('ACCEPTED');
    expect(html).toContain('20.0%');
  });

  test('handles empty bottlenecks and iterations', () => {
    const data: ReportData = {
      timestamp: '2026-03-09T12:00:00Z',
      profilingResult: makeResult(),
      bottlenecks: [],
      tuneResult: {
        iterations: [], acceptedChanges: [], rejectedChanges: [],
        totalImprovementPercent: 0,
      },
    };
    const html = generateHtmlReport(data);
    expect(html).toContain('No bottlenecks detected');
    expect(html).toContain('No tuning iterations performed');
  });

  test('renders metric cards with correct values', () => {
    const data: ReportData = {
      timestamp: 'test',
      profilingResult: makeResult({
        avgEventLoopLagMs: 12.5,
        peakMemoryHeapMB: 456.7,
      }),
      bottlenecks: [],
      tuneResult: { iterations: [], acceptedChanges: [], rejectedChanges: [], totalImprovementPercent: 0 },
    };
    const html = generateHtmlReport(data);
    expect(html).toContain('12.50 ms');
    expect(html).toContain('456.7 MB');
  });

  test('renders N/A for unavailable network latency', () => {
    const data: ReportData = {
      timestamp: 'test',
      profilingResult: makeResult({ avgNetworkLatencyMs: -1 }),
      bottlenecks: [],
      tuneResult: { iterations: [], acceptedChanges: [], rejectedChanges: [], totalImprovementPercent: 0 },
    };
    const html = generateHtmlReport(data);
    expect(html).toContain('N/A');
  });
});

// --- Config Loader Tests ---

describe('loadTuningConfig', () => {
  const configPath = path.join(__dirname, 'test-tuning-config.json');

  afterAll(() => {
    try { fs.unlinkSync(configPath); } catch { /* noop */ }
  });

  test('loads config from JSON file with all fields', () => {
    fs.writeFileSync(configPath, JSON.stringify({
      profiling: { durationSec: 60, sampleIntervalMs: 200, includeClinic: true },
      autoTune: { enabled: false, improvementThreshold: 0.2, maxIterations: 3, dryRun: false },
      outputReport: 'custom_report.html',
    }));
    const config = loadTuningConfig(configPath);
    expect(config.profiling.durationSec).toBe(60);
    expect(config.profiling.sampleIntervalMs).toBe(200);
    expect(config.autoTune.enabled).toBe(false);
    expect(config.autoTune.dryRun).toBe(false);
    expect(config.outputReport).toBe('custom_report.html');
  });

  test('uses defaults for missing fields', () => {
    fs.writeFileSync(configPath, JSON.stringify({}));
    const config = loadTuningConfig(configPath);
    expect(config.profiling.durationSec).toBe(300);
    expect(config.profiling.sampleIntervalMs).toBe(100);
    expect(config.autoTune.enabled).toBe(true);
    expect(config.autoTune.dryRun).toBe(true);
    expect(config.autoTune.maxIterations).toBe(5);
    expect(config.outputReport).toBe('tuning_report.html');
  });
});

// --- Integration Tests ---

describe('Integration: Detect → Mutate → Tune pipeline', () => {
  test('full pipeline with high event loop lag produces accepted changes', async () => {
    const result = makeResult({ maxEventLoopLagMs: 150, avgEventLoopLagMs: 80 });
    const bottlenecks = detectBottlenecks(result);
    expect(bottlenecks.length).toBeGreaterThan(0);

    const mutations = suggestMutations(bottlenecks, {
      batchSize: 50, jitterMs: 50, rlUpdateFrequency: 10,
      proxyRotationIntervalMs: 30000, threadPoolSize: 4,
      cacheMaxEntries: 10000, orderParallelism: 5,
    });
    expect(mutations.length).toBeGreaterThan(0);

    const tuneResult = await runAutoTuner(
      { enabled: true, improvementThreshold: 0.05, maxIterations: 5, dryRun: true },
      mutations, result, jest.fn(), jest.fn()
    );
    expect(tuneResult.iterations.length).toBeGreaterThan(0);
  });

  test('full pipeline with healthy metrics produces no changes', async () => {
    const result = makeResult();
    const bottlenecks = detectBottlenecks(result);
    expect(bottlenecks).toHaveLength(0);

    const mutations = suggestMutations(bottlenecks, { batchSize: 50 });
    expect(mutations).toHaveLength(0);

    const tuneResult = await runAutoTuner(
      { enabled: true, improvementThreshold: 0.1, maxIterations: 5, dryRun: true },
      mutations, result, jest.fn(), jest.fn()
    );
    expect(tuneResult.iterations).toHaveLength(0);
    expect(tuneResult.totalImprovementPercent).toBe(0);
  });

  test('multi-bottleneck scenario produces multiple mutations', () => {
    const result = makeResult({
      maxEventLoopLagMs: 200,
      peakMemoryHeapMB: 900,
      avgNetworkLatencyMs: 400,
    });
    const bottlenecks = detectBottlenecks(result);
    expect(bottlenecks.length).toBeGreaterThanOrEqual(3);

    const mutations = suggestMutations(bottlenecks, {
      batchSize: 50, jitterMs: 50, cacheMaxEntries: 10000,
      proxyRotationIntervalMs: 30000, threadPoolSize: 4,
      rlUpdateFrequency: 10, orderParallelism: 5,
    });
    expect(mutations.length).toBeGreaterThanOrEqual(3);
  });
});
