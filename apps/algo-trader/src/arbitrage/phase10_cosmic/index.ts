/**
 * Phase 10: The Cosmic Horizon — barrel exports.
 *
 * Three modules:
 * 1. Temporal Warp Execution (temporalWarp) — Sub-nanosecond network injection
 * 2. Decentralized Auto-DAO Governance (daoGovernance) — On-chain autonomous DAO
 * 3. Multiverse State Shadowing (stateShadowing) — Consensus prediction engine
 *
 * All modules default to disabled + dry-run mode.
 */

// Module 1: Temporal Warp
export * from './temporalWarp/index';

// Module 2: DAO Governance
export * from './daoGovernance/index';

// Module 3: State Shadowing
export * from './stateShadowing/index';

/** Phase 10 unified config shape (mirrors config.phase10.json). */
export interface Phase10Config {
  temporalWarp: {
    enabled: boolean;
    ebpfProgram: string;
    fpgaDevice: string;
    interface: string;
  };
  daoGovernance: {
    enabled: boolean;
    tokenName: string;
    tokenSymbol: string;
    darkPoolEnabled: boolean;
    votingPeriodSec: number;
  };
  stateShadowing: {
    enabled: boolean;
    chains: string[];
    numSimulations: number;
    probabilityThreshold: number;
    maxPreemptiveSizeUsd: number;
  };
}

export const DEFAULT_PHASE10_CONFIG: Phase10Config = {
  temporalWarp: {
    enabled: false,
    ebpfProgram: './xdp_kernel.o',
    fpgaDevice: '/dev/fpga0',
    interface: 'eth0',
  },
  daoGovernance: {
    enabled: false,
    tokenName: 'AGI Gov Token',
    tokenSymbol: 'AGI',
    darkPoolEnabled: true,
    votingPeriodSec: 86400,
  },
  stateShadowing: {
    enabled: false,
    chains: ['ethereum', 'solana'],
    numSimulations: 1000,
    probabilityThreshold: 0.95,
    maxPreemptiveSizeUsd: 1000,
  },
};
