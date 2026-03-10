/**
 * Phase 9 Module 1: Quantum-Safe Vault (QSV) — barrel exports.
 *
 * Components:
 * 1. PqcKeyManager     — Dilithium3 / Kyber768 key pair management (WASM mock)
 * 2. HybridEncryptor   — X25519 + Kyber hybrid key exchange + AES-256-GCM
 * 3. WithdrawalSigner  — Dilithium3 signatures for withdrawal requests
 * 4. HsmSimulator      — In-memory AES-256-GCM encrypted key storage
 * 5. ForwardSecrecyRatchet — Signal-style Double Ratchet (mock)
 *
 * All modules default to disabled / dry-run mode.
 */

export { PqcKeyManager } from './pqc-key-manager';
export type { PqcKeyPair, PqcAlgorithm, PqcKeyManagerConfig } from './pqc-key-manager';

export { HybridEncryptor } from './hybrid-encryptor';
export type { HybridEncryptorConfig, EncryptedPayload } from './hybrid-encryptor';

export { WithdrawalSigner } from './withdrawal-signer';
export type {
  WithdrawalRequest,
  SignedWithdrawal,
  WithdrawalSignerConfig,
} from './withdrawal-signer';

export { HsmSimulator } from './hsm-simulator';
export type { HsmSlot, HsmSimulatorConfig } from './hsm-simulator';

export { ForwardSecrecyRatchet } from './forward-secrecy';
export type {
  RatchetState,
  RatchetSession,
  ForwardSecrecyConfig,
} from './forward-secrecy';

// ── Vault config ────────────────────────────────────────────────────────────

export interface QuantumSafeVaultConfig {
  /** Master switch — all components disabled when false. Default: false. */
  enabled: boolean;
  pqcAlgorithm: 'Dilithium3' | 'Kyber768';
  /** Route key storage through HsmSimulator. Default: false. */
  useHsm: boolean;
  /** Encrypt all inter-service traffic with HybridEncryptor. Default: false. */
  encryptTraffic: boolean;
}

export interface QuantumSafeVaultInstances {
  keyManager: PqcKeyManager;
  encryptor: HybridEncryptor;
  withdrawalSigner: WithdrawalSigner;
  hsm: HsmSimulator;
  ratchet: ForwardSecrecyRatchet;
  config: QuantumSafeVaultConfig;
}

const DEFAULT_VAULT_CONFIG: QuantumSafeVaultConfig = {
  enabled: false,
  pqcAlgorithm: 'Dilithium3',
  useHsm: false,
  encryptTraffic: false,
};

// Need to import concrete classes for initQuantumSafeVault
import { PqcKeyManager } from './pqc-key-manager';
import { HybridEncryptor } from './hybrid-encryptor';
import { WithdrawalSigner } from './withdrawal-signer';
import { HsmSimulator } from './hsm-simulator';
import { ForwardSecrecyRatchet } from './forward-secrecy';

/**
 * Factory: initialise all QSV components with a single config object.
 * Returns typed instances ready for use or dependency injection.
 */
export function initQuantumSafeVault(
  config: Partial<QuantumSafeVaultConfig> = {},
): QuantumSafeVaultInstances {
  const cfg: QuantumSafeVaultConfig = { ...DEFAULT_VAULT_CONFIG, ...config };

  const keyManager = new PqcKeyManager({
    algorithm: cfg.pqcAlgorithm,
    dryRun: !cfg.enabled,
  });

  const encryptor = new HybridEncryptor({ dryRun: !cfg.encryptTraffic });

  const withdrawalSigner = new WithdrawalSigner({ dryRun: !cfg.enabled });

  const hsm = new HsmSimulator({ verbose: false });

  const ratchet = new ForwardSecrecyRatchet({ dryRun: !cfg.encryptTraffic });

  return { keyManager, encryptor, withdrawalSigner, hsm, ratchet, config: cfg };
}
