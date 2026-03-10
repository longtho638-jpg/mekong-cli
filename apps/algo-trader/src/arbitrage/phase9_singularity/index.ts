/**
 * Phase 9: The Singularity Engine — barrel exports.
 *
 * Three modules:
 * 1. Quantum-Safe Vault (QSV) — Post-quantum cryptography layer
 * 2. Neural-Symbolic Strategy Synthesizer (NS3) — Genetic programming
 * 3. Omni-Macro Sentient Oracle (OMSO) — Macro signal intelligence
 *
 * All modules default to disabled + dry-run mode.
 */

// Module 1: Quantum-Safe Vault
export * from './quantumSafeVault/index';

// Module 2: Neural-Symbolic Synthesizer
export * from './neuralSymbolicSynthesizer/index';

// Module 3: Omni-Macro Oracle
export * from './omniMacroOracle/index';

/** Phase 9 unified config shape (mirrors config.phase9.json). */
export interface Phase9Config {
  quantumSafeVault: {
    enabled: boolean;
    pqcAlgorithm: string;
    useHsm: boolean;
    encryptTraffic: boolean;
  };
  neuralSymbolicSynthesizer: {
    enabled: boolean;
    populationSize: number;
    evolutionIntervalMin: number;
    promotionThreshold: number;
  };
  omniMacroOracle: {
    enabled: boolean;
    llmModel: string;
    newsSources: string[];
    updateIntervalSec: number;
  };
}

export const DEFAULT_PHASE9_CONFIG: Phase9Config = {
  quantumSafeVault: {
    enabled: false,
    pqcAlgorithm: 'Dilithium5',
    useHsm: false,
    encryptTraffic: true,
  },
  neuralSymbolicSynthesizer: {
    enabled: false,
    populationSize: 1000,
    evolutionIntervalMin: 60,
    promotionThreshold: 1.5,
  },
  omniMacroOracle: {
    enabled: false,
    llmModel: 'llama3-8b-instruct',
    newsSources: ['reuters', 'bloomberg', 'twitter'],
    updateIntervalSec: 10,
  },
};
