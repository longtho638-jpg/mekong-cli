/**
 * Phase 11 Module 3: QKD Simulator — Quantum Key Distribution simulation.
 *
 * Simulates successful BB84-style QKD exchange.
 * Both local/remote keys are identical (perfect channel assumption).
 * Uses Node.js crypto.randomBytes for CSPRNG key generation.
 *
 * Default: dryRun = true (safe by default).
 */

import { randomBytes, createHash } from 'crypto';

export interface QkdSimulatorConfig {
  /** Key length in bits. Must be multiple of 8. Default: 256. */
  keyLengthBits: number;
  /** Dry-run mode — no side-effects. Default: true. */
  dryRun: boolean;
  /** Optional seed string for deterministic keyId generation (not for key bytes). */
  seed?: string;
}

export interface KeyPair {
  localKey: Buffer;
  remoteKey: Buffer;
  keyId: string;
}

const DEFAULT_CONFIG: QkdSimulatorConfig = {
  keyLengthBits: 256,
  dryRun: true,
};

export class QkdSimulator {
  private readonly cfg: QkdSimulatorConfig;
  private activeKeyId: string | null = null;
  private keyCount = 0;

  constructor(config: Partial<QkdSimulatorConfig> = {}) {
    if (config.keyLengthBits !== undefined && config.keyLengthBits % 8 !== 0) {
      throw new Error('keyLengthBits must be a multiple of 8');
    }
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate a symmetric key pair simulating a successful QKD exchange.
   * Both keys are identical (perfect channel — no eavesdropping, no loss).
   */
  generateKeyPair(): KeyPair {
    const byteLength = this.cfg.keyLengthBits / 8;
    const keyBytes = randomBytes(byteLength);

    // Clone so local and remote are independent Buffer instances
    const localKey = Buffer.from(keyBytes);
    const remoteKey = Buffer.from(keyBytes);

    // Derive keyId from key material + counter for uniqueness
    const keyId = this._deriveKeyId(keyBytes, this.keyCount);
    this.keyCount += 1;
    this.activeKeyId = keyId;

    return { localKey, remoteKey, keyId };
  }

  /**
   * Rotate active key — invalidates previous keyId, generates a new pair.
   * Returns the new key pair.
   */
  rotateKey(): KeyPair {
    this.activeKeyId = null;
    return this.generateKeyPair();
  }

  /** Returns the keyId of the most recently generated key pair, or null if none. */
  getActiveKeyId(): string | null {
    return this.activeKeyId;
  }

  /** Total number of key pairs generated since instantiation. */
  getKeyCount(): number {
    return this.keyCount;
  }

  getConfig(): QkdSimulatorConfig {
    return { ...this.cfg };
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private _deriveKeyId(keyBytes: Buffer, counter: number): string {
    const seedSuffix = this.cfg.seed ?? '';
    const input = `${keyBytes.toString('hex')}:${counter}:${seedSuffix}`;
    return createHash('sha256').update(input).digest('hex').slice(0, 32);
  }
}
