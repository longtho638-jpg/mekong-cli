/**
 * Phase 10 Module 3: Multiverse State Prediction & Consensus Shadowing.
 *
 * Components:
 * 1. MempoolAnalyzer      — polls mock mempool, builds tx graph
 * 2. ValidatorBehaviorModel — online ML for inclusion probability
 * 3. StateSimulator       — fork + apply txns on mock EVM state
 * 4. ShadowConsensus      — N parallel fork simulations → distribution
 * 5. PreemptiveExecutor   — fires trades above probability threshold
 *
 * All modules default to disabled / dry-run mode.
 */

// MempoolAnalyzer
export { MempoolAnalyzer } from './mempool-analyzer';
export type {
  MempoolAnalyzerConfig,
  PendingTransaction,
  TxGraph,
} from './mempool-analyzer';

// ValidatorBehaviorModel
export { ValidatorBehaviorModel } from './validator-behavior-model';
export type {
  ValidatorBehaviorModelConfig,
  ValidatorPrediction,
} from './validator-behavior-model';

// StateSimulator
export { StateSimulator } from './state-simulator';
export type {
  StateSimulatorConfig,
  SimulationResult,
  StateSnapshot,
} from './state-simulator';

// ShadowConsensus
export { ShadowConsensus } from './shadow-consensus';
export type {
  ShadowConsensusConfig,
  StateDistribution,
  ConsensusResult,
} from './shadow-consensus';

// PreemptiveExecutor
export { PreemptiveExecutor } from './preemptive-executor';
export type {
  PreemptiveExecutorConfig,
  PreemptiveTrade,
  ExecutionLog,
} from './preemptive-executor';

// ── Module config & factory ───────────────────────────────────────────────────

export interface StateShadowingConfig {
  /** Master switch for the entire module. Default: false. */
  enabled: boolean;
  /** Chain IDs to monitor. Default: [1]. */
  chains: number[];
  /** Parallel fork simulations per consensus round. Default: 16. */
  numSimulations: number;
  /** Minimum probability to preemptively execute. Default: 0.7. */
  probabilityThreshold: number;
  /** Max preemptive trade size in USD. Default: 10_000. */
  maxPreemptiveSizeUsd: number;
}

export interface StateShadowingInstances {
  mempoolAnalyzer: MempoolAnalyzer;
  validatorModel: ValidatorBehaviorModel;
  stateSimulator: StateSimulator;
  shadowConsensus: ShadowConsensus;
  preemptiveExecutor: PreemptiveExecutor;
  config: StateShadowingConfig;
}

// Need concrete imports for factory function
import { MempoolAnalyzer } from './mempool-analyzer';
import { ValidatorBehaviorModel } from './validator-behavior-model';
import { StateSimulator } from './state-simulator';
import { ShadowConsensus } from './shadow-consensus';
import { PreemptiveExecutor } from './preemptive-executor';

const DEFAULT_CONFIG: StateShadowingConfig = {
  enabled: false,
  chains: [1],
  numSimulations: 16,
  probabilityThreshold: 0.7,
  maxPreemptiveSizeUsd: 10_000,
};

/**
 * Factory: wire all Module 3 components from a single config object.
 * Does NOT call start() — caller controls lifecycle.
 */
export function initStateShadowing(
  config: Partial<StateShadowingConfig> = {},
): StateShadowingInstances {
  const cfg: StateShadowingConfig = { ...DEFAULT_CONFIG, ...config };

  const mempoolAnalyzer = new MempoolAnalyzer({ enabled: cfg.enabled });
  const validatorModel = new ValidatorBehaviorModel({ enabled: cfg.enabled });
  const stateSimulator = new StateSimulator({ enabled: cfg.enabled });
  const shadowConsensus = new ShadowConsensus({
    enabled: cfg.enabled,
    numSimulations: cfg.numSimulations,
  });
  const preemptiveExecutor = new PreemptiveExecutor({
    enabled: cfg.enabled,
    dryRun: true, // always dry-run unless caller explicitly overrides
    probabilityThreshold: cfg.probabilityThreshold,
    maxSizeUsd: cfg.maxPreemptiveSizeUsd,
  });

  return {
    mempoolAnalyzer,
    validatorModel,
    stateSimulator,
    shadowConsensus,
    preemptiveExecutor,
    config: cfg,
  };
}
