/**
 * Phase 11 Module 3: Quantum Internet Communication — barrel exports + factory.
 *
 * Components:
 * 1. QkdSimulator     — Quantum Key Distribution (BB84-style simulation)
 * 2. OtpEncryptor     — One-Time Pad XOR encryption with HMAC-SHA256 auth
 * 3. QuantumChannel   — Quantum transmission channel with eavesdropping detection
 * 4. SecureOrderRelay — End-to-end encrypted trading order relay
 *
 * All modules default to enabled: false / dryRun: true.
 */

export { QkdSimulator } from './qkd-simulator';
export type { QkdSimulatorConfig, KeyPair } from './qkd-simulator';

export { OtpEncryptor } from './otp-encryptor';
export type { OtpEncryptorConfig, EncryptResult } from './otp-encryptor';

export { QuantumChannel } from './quantum-channel';
export type { QuantumChannelConfig, TransmissionResult } from './quantum-channel';

export { SecureOrderRelay } from './secure-order-relay';
export type { SecureOrderRelayConfig, TradeOrder, RelayResult } from './secure-order-relay';

// ── Unified config ────────────────────────────────────────────────────────────

export interface QuantumCommConfig {
  /** Master switch — all components disabled when false. Default: false. */
  enabled: boolean;
  /** Key length in bits for QKD. Default: 256. */
  keyLengthBits?: number;
  /** Enable eavesdropping detection on the channel. Default: true. */
  eavesdroppingDetection?: boolean;
}

// ── Factory instances type ────────────────────────────────────────────────────

import { QkdSimulator } from './qkd-simulator';
import { OtpEncryptor } from './otp-encryptor';
import { QuantumChannel } from './quantum-channel';
import { SecureOrderRelay } from './secure-order-relay';
import type { TradeOrder } from './secure-order-relay';
import type { RelayResult } from './secure-order-relay';

export interface QuantumCommInstances {
  // Short aliases
  qkd: QkdSimulator;
  encryptor: OtpEncryptor;
  channel: QuantumChannel;
  relay: SecureOrderRelay;
  // Full names
  qkdSimulator: QkdSimulator;
  otpEncryptor: OtpEncryptor;
  quantumChannel: QuantumChannel;
  secureOrderRelay: SecureOrderRelay;
  /** Convenience: get key → encrypt → transmit → return RelayResult. */
  secureRelay: (order: TradeOrder) => RelayResult;
  config: QuantumCommConfig;
}

const DEFAULT_QC_CONFIG: QuantumCommConfig = {
  enabled: false,
  keyLengthBits: 256,
  eavesdroppingDetection: true,
};

/**
 * Factory: initialise all Quantum Comm components from a single config.
 */
export function initQuantumComm(
  config: Partial<QuantumCommConfig> = {},
): QuantumCommInstances {
  const cfg: QuantumCommConfig = { ...DEFAULT_QC_CONFIG, ...config };
  const dryRun = !cfg.enabled;

  const qkdSimulator = new QkdSimulator({
    keyLengthBits: cfg.keyLengthBits ?? 256,
    dryRun,
  });

  const otpEncryptor = new OtpEncryptor({ dryRun });

  const quantumChannel = new QuantumChannel({
    dryRun,
    eavesdroppingDetection: cfg.eavesdroppingDetection ?? true,
  });

  const secureOrderRelay = new SecureOrderRelay(
    { dryRun },
    otpEncryptor,
    quantumChannel,
  );

  /**
   * Convenience relay: generates a fresh key pair via QKD, encrypts the order,
   * and transmits it over the quantum channel in one call.
   */
  function secureRelay(order: TradeOrder): RelayResult {
    const { localKey, keyId } = qkdSimulator.generateKeyPair();
    // Key must cover the serialized order; pad if needed (OTP requirement)
    const plaintext = Buffer.from(JSON.stringify(order), 'utf8');
    const key = localKey.length >= plaintext.length
      ? localKey
      : Buffer.concat([localKey, localKey], plaintext.length); // extend by repeating
    return secureOrderRelay.relayOrder(order, key, keyId);
  }

  return {
    // Short aliases
    qkd: qkdSimulator,
    encryptor: otpEncryptor,
    channel: quantumChannel,
    relay: secureOrderRelay,
    // Full names
    qkdSimulator,
    otpEncryptor,
    quantumChannel,
    secureOrderRelay,
    secureRelay,
    config: cfg,
  };
}
