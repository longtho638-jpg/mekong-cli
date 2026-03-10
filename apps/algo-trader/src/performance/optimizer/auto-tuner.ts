/**
 * Auto-Tuner — applies config mutations in controlled A/B iterations,
 * measures improvement, and commits changes that exceed threshold.
 */
import { ProfilingResult } from './profiler';
import { Bottleneck } from './bottleneck-detector';
import { ConfigMutation, TunableParam } from './config-mutator';

export interface AutoTuneConfig {
  enabled: boolean;
  improvementThreshold: number; // e.g., 0.1 = 10% improvement required
  maxIterations: number;
  dryRun: boolean;
}

export interface TuneIteration {
  iteration: number;
  mutation: ConfigMutation;
  baselineScore: number;
  tunedScore: number;
  improvementPercent: number;
  accepted: boolean;
}

export interface AutoTuneResult {
  iterations: TuneIteration[];
  acceptedChanges: ConfigMutation[];
  rejectedChanges: ConfigMutation[];
  totalImprovementPercent: number;
}

/** Scoring function — lower is better (weighted penalty score) */
export function computePerformanceScore(result: ProfilingResult): number {
  const s = result.summary;
  // Weighted penalty: each metric contributes to total "badness"
  const eventLoopPenalty = s.avgEventLoopLagMs * 2;
  const memoryPenalty = s.peakMemoryHeapMB / 100;
  const gcPenalty = s.totalGcPauseMs / 50;
  const networkPenalty = s.avgNetworkLatencyMs >= 0 ? s.avgNetworkLatencyMs : 0;
  const throughputBonus = s.avgOrderThroughput > 0 ? 1000 / s.avgOrderThroughput : 100;

  return eventLoopPenalty + memoryPenalty + gcPenalty + networkPenalty + throughputBonus;
}

/**
 * Runs auto-tuning loop. Takes a profiler function to re-profile after each change.
 * @param profilerFn - re-runs profiling with current config, returns result
 * @param applyFn - applies a mutation to the running config
 */
export async function runAutoTuner(
  config: AutoTuneConfig,
  mutations: ConfigMutation[],
  baselineResult: ProfilingResult,
  profilerFn: () => Promise<ProfilingResult>,
  applyFn: (mutation: ConfigMutation) => void
): Promise<AutoTuneResult> {
  const iterations: TuneIteration[] = [];
  const acceptedChanges: ConfigMutation[] = [];
  const rejectedChanges: ConfigMutation[] = [];

  if (!config.enabled) {
    return { iterations, acceptedChanges, rejectedChanges, totalImprovementPercent: 0 };
  }

  let currentBaseline = computePerformanceScore(baselineResult);
  const maxIter = Math.min(config.maxIterations, mutations.length);

  for (let i = 0; i < maxIter; i++) {
    const mutation = mutations[i];

    if (config.dryRun) {
      // Dry-run: simulate improvement estimate from bottleneck impact
      const estimatedImprovement = estimateImprovement(mutation);
      iterations.push({
        iteration: i + 1,
        mutation,
        baselineScore: currentBaseline,
        tunedScore: currentBaseline * (1 - estimatedImprovement),
        improvementPercent: estimatedImprovement * 100,
        accepted: estimatedImprovement >= config.improvementThreshold,
      });
      if (estimatedImprovement >= config.improvementThreshold) {
        acceptedChanges.push(mutation);
      } else {
        rejectedChanges.push(mutation);
      }
      continue;
    }

    // Apply mutation
    applyFn(mutation);

    // Re-profile
    const tunedResult = await profilerFn();
    const tunedScore = computePerformanceScore(tunedResult);
    const improvement = (currentBaseline - tunedScore) / currentBaseline;

    const accepted = improvement >= config.improvementThreshold;
    iterations.push({
      iteration: i + 1,
      mutation,
      baselineScore: currentBaseline,
      tunedScore,
      improvementPercent: improvement * 100,
      accepted,
    });

    if (accepted) {
      acceptedChanges.push(mutation);
      currentBaseline = tunedScore; // new baseline
    } else {
      rejectedChanges.push(mutation);
      // Revert would happen via caller — we just track rejection
    }
  }

  const initialScore = computePerformanceScore(baselineResult);
  const totalImprovement = initialScore > 0
    ? ((initialScore - currentBaseline) / initialScore) * 100
    : 0;

  return {
    iterations,
    acceptedChanges,
    rejectedChanges,
    totalImprovementPercent: totalImprovement,
  };
}

/** Estimates improvement from mutation params (heuristic for dry-run) */
function estimateImprovement(mutation: ConfigMutation): number {
  let totalDelta = 0;
  for (const param of mutation.params) {
    if (param.currentValue === 0) continue;
    const changePct = Math.abs(param.suggestedValue - param.currentValue) / param.currentValue;
    totalDelta += changePct * 0.3; // 30% of config change translates to perf improvement
  }
  return Math.min(totalDelta, 0.5); // cap at 50%
}
