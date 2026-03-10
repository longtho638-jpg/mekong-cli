/**
 * StateSimulator — executes pending txns on a forked EVM state (mock).
 * No external deps; state is a simple token-balance map.
 * Module 3 of Phase 10 Cosmic — default disabled/dry-run.
 */

import type { PendingTransaction } from './mempool-analyzer';

export interface StateSimulatorConfig {
  /** Master switch. Default: false. */
  enabled: boolean;
  /** Initial token balances: address → amount (wei-like). */
  initialBalances?: Record<string, bigint>;
  /** Base gas fee per unit. Default: 1_000_000_000n. */
  baseFeeWei: bigint;
}

export interface StateSnapshot {
  /** Block number of this snapshot. */
  blockNumber: number;
  /** Address -> balance map at snapshot time. */
  balances: Map<string, bigint>;
  /** Keccak-like 32-byte mock state root. */
  stateRoot: string;
  timestamp: number;
}

export interface SimulationResult {
  appliedTxns: string[];
  rejectedTxns: string[];
  finalSnapshot: StateSnapshot;
  /** Total gas consumed. */
  gasUsed: bigint;
  priceImpacts: Map<string, number>;
}

const DEFAULT_CONFIG: StateSimulatorConfig = {
  enabled: false,
  baseFeeWei: 1_000_000_000n,
};

/** Deterministic mock state root from balances. */
function deriveStateRoot(balances: Map<string, bigint>, block: number): string {
  let acc = block;
  for (const [addr, bal] of balances) {
    for (let i = 0; i < addr.length; i++) acc = (acc * 31 + addr.charCodeAt(i)) & 0xffffffff;
    acc = (acc ^ Number(bal & 0xffffffffn)) & 0xffffffff;
  }
  return '0x' + acc.toString(16).padStart(64, '0');
}

export class StateSimulator {
  private readonly cfg: StateSimulatorConfig;
  private baseBalances: Map<string, bigint>;
  private currentBlock = 0;

  constructor(config: Partial<StateSimulatorConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
    this.baseBalances = new Map(
      Object.entries(this.cfg.initialBalances ?? {}).map(([k, v]) => [k, v]),
    );
  }

  /** Fork current state — returns a deep copy of balances. */
  forkState(): StateSnapshot {
    const balances = new Map(this.baseBalances);
    return {
      blockNumber: this.currentBlock,
      balances,
      stateRoot: deriveStateRoot(balances, this.currentBlock),
      timestamp: Date.now(),
    };
  }

  /** Apply an ordered list of txns to a forked snapshot. Returns SimulationResult. */
  simulateTxns(snapshot: StateSnapshot, txns: PendingTransaction[]): SimulationResult {
    const balances = new Map(snapshot.balances);
    const applied: string[] = [];
    const rejected: string[] = [];
    const priceImpacts = new Map<string, number>();
    let gasUsed = 0n;

    for (const tx of txns) {
      const gasCost = tx.gasPrice * 21_000n;
      const fromBal = balances.get(tx.from) ?? 0n;
      if (fromBal < tx.value + gasCost) {
        rejected.push(tx.hash);
        continue;
      }
      balances.set(tx.from, fromBal - tx.value - gasCost);
      const toBal = balances.get(tx.to) ?? 0n;
      balances.set(tx.to, toBal + tx.value);
      gasUsed += 21_000n;
      applied.push(tx.hash);

      // Mock price impact: swap txns shift price proportionally to value
      if (tx.data === '0xswap') {
        const impact = Math.min(Number(tx.value) / 1e18 * 0.003, 0.05);
        priceImpacts.set(tx.hash, impact);
      }
    }

    this.currentBlock++;
    const finalSnapshot: StateSnapshot = {
      blockNumber: this.currentBlock,
      balances,
      stateRoot: deriveStateRoot(balances, this.currentBlock),
      timestamp: Date.now(),
    };

    return { appliedTxns: applied, rejectedTxns: rejected, finalSnapshot, gasUsed, priceImpacts };
  }

  /** State root of the base (un-forked) state. */
  getStateRoot(): string {
    return deriveStateRoot(this.baseBalances, this.currentBlock);
  }

  /**
   * Aggregate price impact across all swap txns in a SimulationResult.
   * Returns signed net impact (positive = price up).
   */
  getPriceImpact(result: SimulationResult): number {
    let total = 0;
    for (const impact of result.priceImpacts.values()) total += impact;
    return total;
  }

  getCurrentBlock(): number {
    return this.currentBlock;
  }
}
