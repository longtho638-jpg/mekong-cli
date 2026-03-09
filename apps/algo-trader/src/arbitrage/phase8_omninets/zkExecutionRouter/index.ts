/**
 * ZK Execution Router — barrel exports and initializer.
 * Module 1 of Phase 8 OmniNet Genesis.
 *
 * Provides privacy-preserving order execution via mock zk-SNARK proofs.
 * All components default to disabled + dry-run mode.
 */

export { ProofGenerator } from './proof-generator';
export type { OrderWitness, ZkProof, ProofGeneratorConfig } from './proof-generator';

export { VerifierContract } from './verifier-contract';
export type { VerificationResult, VerifierContractConfig } from './verifier-contract';

export { OrderWrapper } from './order-wrapper';
export type { RawOrder, WrappedOrder, OrderWrapperConfig } from './order-wrapper';

export { KeyManager } from './key-manager';
export type { KeySlot, KeyManagerConfig } from './key-manager';

export interface ZkExecutionRouterConfig {
  enabled: boolean;
  circuitPath: string;
  verifierAddress: string;
  useHsm: boolean;
}

const DEFAULT_CONFIG: ZkExecutionRouterConfig = {
  enabled: false,
  circuitPath: './circuits/order_validity.zkey',
  verifierAddress: '0x0000000000000000000000000000000000000000',
  useHsm: false,
};

/**
 * Initialize the ZK Execution Router subsystem.
 * Returns configured instances ready for use by the order pipeline.
 */
export function initZkExecutionRouter(config: Partial<ZkExecutionRouterConfig> = {}): {
  prover: import('./proof-generator').ProofGenerator;
  verifier: import('./verifier-contract').VerifierContract;
  wrapper: import('./order-wrapper').OrderWrapper;
  keyManager: import('./key-manager').KeyManager;
} {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const prover = new (require('./proof-generator').ProofGenerator)({
    circuitPath: cfg.circuitPath,
  });

  const verifier = new (require('./verifier-contract').VerifierContract)({
    verifierAddress: cfg.verifierAddress,
  });

  const wrapper = new (require('./order-wrapper').OrderWrapper)(
    { enabled: cfg.enabled, rejectOnInvalidProof: true },
    prover,
    verifier,
  );

  const keyManager = new (require('./key-manager').KeyManager)({
    useHsm: cfg.useHsm,
  });

  return { prover, verifier, wrapper, keyManager };
}
