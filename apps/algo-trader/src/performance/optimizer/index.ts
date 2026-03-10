/**
 * Performance Optimizer — main entry point.
 * Orchestrates: Profile → Detect Bottlenecks → Suggest Mutations → Auto-Tune → Report.
 */
import * as fs from 'fs';
import * as path from 'path';
import { runProfiler, ProfilingConfig, ProfilingResult } from './profiler';
import { detectBottlenecks, Bottleneck, DetectorConfig } from './bottleneck-detector';
import { suggestMutations, applyMutations, ConfigMutation } from './config-mutator';
import { runAutoTuner, AutoTuneConfig, AutoTuneResult } from './auto-tuner';
import { generateHtmlReport, ReportData } from './report-generator';

export interface TuningConfig {
  profiling: ProfilingConfig;
  autoTune: AutoTuneConfig;
  outputReport: string;
  detectorThresholds?: Partial<DetectorConfig>;
  currentParams?: Record<string, number>;
}

export interface OptimizerResult {
  profilingResult: ProfilingResult;
  bottlenecks: Bottleneck[];
  mutations: ConfigMutation[];
  tuneResult: AutoTuneResult;
  reportPath: string;
}

/** Default tunable parameters if none provided */
const DEFAULT_PARAMS: Record<string, number> = {
  batchSize: 50,
  jitterMs: 50,
  rlUpdateFrequency: 10,
  proxyRotationIntervalMs: 30000,
  threadPoolSize: 4,
  cacheMaxEntries: 10000,
  orderParallelism: 5,
};

/**
 * Runs the full optimization pipeline.
 * @param config - tuning configuration (from config.tuning.json)
 * @param options - optional overrides for profiler
 */
export async function runOptimizer(
  config: TuningConfig,
  options?: { networkUrl?: string; orderCounter?: () => number }
): Promise<OptimizerResult> {
  // Step 1: Profile
  const profilingResult = await runProfiler(config.profiling, options);

  // Step 2: Detect bottlenecks
  const bottlenecks = detectBottlenecks(profilingResult, config.detectorThresholds);

  // Step 3: Suggest mutations
  const currentParams = config.currentParams ?? DEFAULT_PARAMS;
  const mutations = suggestMutations(bottlenecks, currentParams);

  // Step 4: Auto-tune (dry-run by default)
  const tuneResult = await runAutoTuner(
    config.autoTune,
    mutations,
    profilingResult,
    async () => runProfiler({ ...config.profiling, durationSec: Math.min(config.profiling.durationSec, 30) }, options),
    (_mutation) => { /* Config application handled by caller in production */ }
  );

  // Step 5: Generate report
  const reportData: ReportData = {
    timestamp: new Date().toISOString(),
    profilingResult,
    bottlenecks,
    tuneResult,
  };
  const reportHtml = generateHtmlReport(reportData);
  const reportPath = path.resolve(config.outputReport);
  fs.writeFileSync(reportPath, reportHtml, 'utf-8');

  return { profilingResult, bottlenecks, mutations, tuneResult, reportPath };
}

/** Loads tuning config from JSON file */
export function loadTuningConfig(configPath: string): TuningConfig {
  const raw = fs.readFileSync(configPath, 'utf-8');
  const parsed = JSON.parse(raw);
  return {
    profiling: {
      durationSec: parsed.profiling?.durationSec ?? 300,
      sampleIntervalMs: parsed.profiling?.sampleIntervalMs ?? 100,
      includeClinic: parsed.profiling?.includeClinic ?? false,
    },
    autoTune: {
      enabled: parsed.autoTune?.enabled ?? true,
      improvementThreshold: parsed.autoTune?.improvementThreshold ?? 0.1,
      maxIterations: parsed.autoTune?.maxIterations ?? 5,
      dryRun: parsed.autoTune?.dryRun ?? true,
    },
    outputReport: parsed.outputReport ?? 'tuning_report.html',
    detectorThresholds: parsed.detectorThresholds,
    currentParams: parsed.currentParams,
  };
}

// Re-export all submodules
export { runProfiler } from './profiler';
export type { ProfilingConfig, ProfilingResult, ProfileSample, ProfilingSummary } from './profiler';
export { detectBottlenecks } from './bottleneck-detector';
export type { Bottleneck, DetectorConfig } from './bottleneck-detector';
export { suggestMutations, applyMutations } from './config-mutator';
export type { ConfigMutation, TunableParam } from './config-mutator';
export { runAutoTuner, computePerformanceScore } from './auto-tuner';
export type { AutoTuneConfig, AutoTuneResult } from './auto-tuner';
export { generateHtmlReport } from './report-generator';
export type { ReportData } from './report-generator';
