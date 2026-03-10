/**
 * Config Mutator — suggests and applies configuration changes based on detected bottlenecks.
 * Each bottleneck maps to specific parameter adjustments with min/max bounds.
 */
import { Bottleneck } from './bottleneck-detector';

export interface TunableParam {
  path: string; // dot-notation config path
  currentValue: number;
  suggestedValue: number;
  minValue: number;
  maxValue: number;
  unit: string;
  reason: string;
}

export interface ConfigMutation {
  bottleneckId: string;
  params: TunableParam[];
}

export interface TuningBounds {
  batchSize: { min: number; max: number };
  jitterMs: { min: number; max: number };
  rlUpdateFrequency: { min: number; max: number };
  proxyRotationIntervalMs: { min: number; max: number };
  threadPoolSize: { min: number; max: number };
  cacheMaxEntries: { min: number; max: number };
  orderParallelism: { min: number; max: number };
}

const DEFAULT_BOUNDS: TuningBounds = {
  batchSize: { min: 1, max: 100 },
  jitterMs: { min: 0, max: 500 },
  rlUpdateFrequency: { min: 1, max: 50 },
  proxyRotationIntervalMs: { min: 5000, max: 120000 },
  threadPoolSize: { min: 1, max: 16 },
  cacheMaxEntries: { min: 100, max: 50000 },
  orderParallelism: { min: 1, max: 20 },
};

/**
 * Generates config mutations for each bottleneck.
 * @param currentConfig - flat key-value of current tunable params
 */
export function suggestMutations(
  bottlenecks: Bottleneck[],
  currentConfig: Record<string, number>,
  bounds: Partial<TuningBounds> = {}
): ConfigMutation[] {
  const b = { ...DEFAULT_BOUNDS, ...bounds };
  return bottlenecks.map((bn) => generateMutation(bn, currentConfig, b)).filter(Boolean) as ConfigMutation[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function generateMutation(
  bn: Bottleneck,
  cfg: Record<string, number>,
  bounds: TuningBounds
): ConfigMutation | null {
  const params: TunableParam[] = [];

  switch (bn.id) {
    case 'event-loop-lag': {
      // Reduce batch size to free event loop
      const cur = cfg['batchSize'] ?? 50;
      const suggested = clamp(cur * 0.6, bounds.batchSize.min, bounds.batchSize.max);
      if (suggested !== cur) {
        params.push({
          path: 'execution.batchSize',
          currentValue: cur, suggestedValue: suggested,
          minValue: bounds.batchSize.min, maxValue: bounds.batchSize.max,
          unit: 'items', reason: 'Reduce batch size to lower event loop blocking',
        });
      }
      // Increase jitter to spread load
      const jCur = cfg['jitterMs'] ?? 50;
      const jSuggested = clamp(jCur * 1.5, bounds.jitterMs.min, bounds.jitterMs.max);
      if (jSuggested !== jCur) {
        params.push({
          path: 'phase6.jitterMs',
          currentValue: jCur, suggestedValue: jSuggested,
          minValue: bounds.jitterMs.min, maxValue: bounds.jitterMs.max,
          unit: 'ms', reason: 'Increase jitter to spread execution load',
        });
      }
      break;
    }

    case 'memory-pressure':
    case 'memory-leak': {
      const cacheCur = cfg['cacheMaxEntries'] ?? 10000;
      const cacheSuggested = clamp(cacheCur * 0.5, bounds.cacheMaxEntries.min, bounds.cacheMaxEntries.max);
      if (cacheSuggested !== cacheCur) {
        params.push({
          path: 'cache.maxEntries',
          currentValue: cacheCur, suggestedValue: cacheSuggested,
          minValue: bounds.cacheMaxEntries.min, maxValue: bounds.cacheMaxEntries.max,
          unit: 'entries', reason: 'Reduce cache size to lower memory pressure',
        });
      }
      break;
    }

    case 'cpu-saturation': {
      const poolCur = cfg['threadPoolSize'] ?? 4;
      const poolSuggested = clamp(poolCur + 2, bounds.threadPoolSize.min, bounds.threadPoolSize.max);
      if (poolSuggested !== poolCur) {
        params.push({
          path: 'execution.threadPoolSize',
          currentValue: poolCur, suggestedValue: poolSuggested,
          minValue: bounds.threadPoolSize.min, maxValue: bounds.threadPoolSize.max,
          unit: 'threads', reason: 'Increase thread pool to distribute CPU load',
        });
      }
      // Reduce RL update frequency
      const rlCur = cfg['rlUpdateFrequency'] ?? 10;
      const rlSuggested = clamp(rlCur * 0.5, bounds.rlUpdateFrequency.min, bounds.rlUpdateFrequency.max);
      if (rlSuggested !== rlCur) {
        params.push({
          path: 'phase7.rlUpdateFrequency',
          currentValue: rlCur, suggestedValue: rlSuggested,
          minValue: bounds.rlUpdateFrequency.min, maxValue: bounds.rlUpdateFrequency.max,
          unit: 'updates/cycle', reason: 'Reduce RL update frequency to lower CPU usage',
        });
      }
      break;
    }

    case 'gc-pressure': {
      // Increase batch size (fewer allocations per cycle)
      const bCur = cfg['batchSize'] ?? 50;
      const bSuggested = clamp(bCur * 1.5, bounds.batchSize.min, bounds.batchSize.max);
      if (bSuggested !== bCur) {
        params.push({
          path: 'execution.batchSize',
          currentValue: bCur, suggestedValue: bSuggested,
          minValue: bounds.batchSize.min, maxValue: bounds.batchSize.max,
          unit: 'items', reason: 'Increase batch size to reduce allocation frequency',
        });
      }
      break;
    }

    case 'network-latency': {
      // Rotate proxy more frequently
      const proxyCur = cfg['proxyRotationIntervalMs'] ?? 30000;
      const proxySuggested = clamp(proxyCur * 0.5, bounds.proxyRotationIntervalMs.min, bounds.proxyRotationIntervalMs.max);
      if (proxySuggested !== proxyCur) {
        params.push({
          path: 'phase6.proxyRotationIntervalMs',
          currentValue: proxyCur, suggestedValue: proxySuggested,
          minValue: bounds.proxyRotationIntervalMs.min, maxValue: bounds.proxyRotationIntervalMs.max,
          unit: 'ms', reason: 'Rotate proxy more frequently to find lower-latency routes',
        });
      }
      break;
    }

    case 'low-throughput': {
      // Increase parallelism
      const parCur = cfg['orderParallelism'] ?? 5;
      const parSuggested = clamp(parCur * 2, bounds.orderParallelism.min, bounds.orderParallelism.max);
      if (parSuggested !== parCur) {
        params.push({
          path: 'execution.orderParallelism',
          currentValue: parCur, suggestedValue: parSuggested,
          minValue: bounds.orderParallelism.min, maxValue: bounds.orderParallelism.max,
          unit: 'concurrent', reason: 'Increase order parallelism to boost throughput',
        });
      }
      // Increase batch size
      const bCur2 = cfg['batchSize'] ?? 50;
      const bSuggested2 = clamp(bCur2 * 1.3, bounds.batchSize.min, bounds.batchSize.max);
      if (bSuggested2 !== bCur2) {
        params.push({
          path: 'execution.batchSize',
          currentValue: bCur2, suggestedValue: bSuggested2,
          minValue: bounds.batchSize.min, maxValue: bounds.batchSize.max,
          unit: 'items', reason: 'Increase batch size to process more orders per cycle',
        });
      }
      break;
    }

    default:
      return null;
  }

  return params.length > 0 ? { bottleneckId: bn.id, params } : null;
}

/** Applies mutations to a config object (returns new object, does not mutate) */
export function applyMutations(
  config: Record<string, unknown>,
  mutations: ConfigMutation[]
): Record<string, unknown> {
  const result = JSON.parse(JSON.stringify(config));
  for (const mutation of mutations) {
    for (const param of mutation.params) {
      setNestedValue(result, param.path, param.suggestedValue);
    }
  }
  return result;
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in current) || typeof current[keys[i]] !== 'object') {
      current[keys[i]] = {};
    }
    current = current[keys[i]] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
}
