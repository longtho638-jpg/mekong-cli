/**
 * ShadowConsensus — runs N parallel fork simulations with different tx orderings.
 * Outputs a probability distribution over final state roots.
 * Module 3 of Phase 10 Cosmic — default disabled/dry-run.
 */

import type { PendingTransaction } from './mempool-analyzer';
import { StateSimulator } from './state-simulator';
import type { StateSnapshot, SimulationResult } from './state-simulator';

export interface ShadowConsensusConfig {
  /** Master switch. Default: false. */
  enabled: boolean;
  /** Number of parallel fork simulations. Default: 16. */
  numSimulations: number;
  /** Initial balances forwarded to each StateSimulator fork. */
  initialBalances?: Record<string, bigint>;
}

export interface StateDistribution {
  /** stateRoot -> probability (0-1, sums to ~1). */
  probabilities: Map<string, number>;
  /** stateRoot -> SimulationResult for that fork. */
  results: Map<string, SimulationResult>;
  totalSimulations: number;
}

export interface ConsensusResult {
  mostLikelyStateRoot: string;
  probability: number;
  distribution: StateDistribution;
  /** Aggregate net price impact of most-likely fork. */
  netPriceImpact: number;
}

const DEFAULT_CONFIG: ShadowConsensusConfig = {
  enabled: false,
  numSimulations: 16,
};

/** Fisher-Yates shuffle — in-place, returns same array. */
function shuffle<T>(arr: T[], seed: number): T[] {
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class ShadowConsensus {
  private readonly cfg: ShadowConsensusConfig;

  constructor(config: Partial<ShadowConsensusConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Run N simulations with shuffled tx orderings on a shared fork snapshot.
   * Each simulation uses a different deterministic seed for ordering.
   */
  runSimulations(
    snapshot: StateSnapshot,
    pendingTxns: PendingTransaction[],
  ): StateDistribution {
    const countMap = new Map<string, number>();
    const resultsMap = new Map<string, SimulationResult>();
    const n = this.cfg.numSimulations;

    for (let i = 0; i < n; i++) {
      const ordered = shuffle([...pendingTxns], i * 2654435761 + 1);
      const sim = new StateSimulator({ initialBalances: this.cfg.initialBalances });
      // Apply base snapshot balances to simulator via forking
      const forkSnap: StateSnapshot = {
        ...snapshot,
        balances: new Map(snapshot.balances),
      };
      const result = sim.simulateTxns(forkSnap, ordered);
      const root = result.finalSnapshot.stateRoot;
      countMap.set(root, (countMap.get(root) ?? 0) + 1);
      // Keep only first result per root (representative)
      if (!resultsMap.has(root)) resultsMap.set(root, result);
    }

    const probabilities = new Map<string, number>();
    for (const [root, count] of countMap) {
      probabilities.set(root, count / n);
    }

    return { probabilities, results: resultsMap, totalSimulations: n };
  }

  getDistribution(dist: StateDistribution): Map<string, number> {
    return dist.probabilities;
  }

  getMostLikelyState(dist: StateDistribution): ConsensusResult {
    let bestRoot = '';
    let bestProb = -1;

    for (const [root, prob] of dist.probabilities) {
      if (prob > bestProb) {
        bestProb = prob;
        bestRoot = root;
      }
    }

    const bestResult = dist.results.get(bestRoot);
    let netPriceImpact = 0;
    if (bestResult) {
      for (const impact of bestResult.priceImpacts.values()) netPriceImpact += impact;
    }

    return {
      mostLikelyStateRoot: bestRoot,
      probability: bestProb,
      distribution: dist,
      netPriceImpact,
    };
  }
}
