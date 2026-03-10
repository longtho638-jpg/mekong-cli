/**
 * PQC Key Manager — Post-quantum key pair management.
 * Mocks Dilithium (signing) and Kyber (KEM) via deterministic WASM stubs.
 * In production: replace with liboqs WASM bindings.
 */

import { createHash, randomBytes } from 'crypto';

export type PqcAlgorithm = 'Dilithium3' | 'Kyber768';

export interface PqcKeyPair {
  publicKey: Buffer;
  secretKey: Buffer;
  algorithm: PqcAlgorithm;
  createdAt: number;
}

export interface PqcKeyManagerConfig {
  algorithm: PqcAlgorithm;
  /** Dry-run: skip actual WASM calls. Default: true. */
  dryRun: boolean;
}

const DEFAULT_CONFIG: PqcKeyManagerConfig = {
  algorithm: 'Dilithium3',
  dryRun: true,
};

/** Simulated WASM call — deterministic mock of liboqs. */
function wasmMock(seed: Buffer, label: string, len: number): Buffer {
  const hash = createHash('sha512').update(seed).update(label).digest();
  // Extend to requested length via repeated hashing
  const chunks: Buffer[] = [];
  let filled = 0;
  let idx = 0;
  while (filled < len) {
    const chunk = createHash('sha256').update(hash).update(String(idx++)).digest();
    chunks.push(chunk);
    filled += chunk.length;
  }
  return Buffer.concat(chunks).subarray(0, len);
}

export class PqcKeyManager {
  private readonly cfg: PqcKeyManagerConfig;

  constructor(config: Partial<PqcKeyManagerConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /** Generate a PQC key pair. Returns mock keys in dry-run mode. */
  generateKeyPair(): PqcKeyPair {
    const seed = randomBytes(32);
    // Dilithium3: pk=1952B, sk=4000B; Kyber768: pk=1184B, sk=2400B (mocked)
    const pkLen = this.cfg.algorithm === 'Dilithium3' ? 1952 : 1184;
    const skLen = this.cfg.algorithm === 'Dilithium3' ? 4000 : 2400;

    // Embed seed as first 32 bytes of both pk and sk so sign/verify share same seed.
    const pkBody = wasmMock(seed, 'pk', pkLen - 32);
    const skBody = wasmMock(seed, 'sk', skLen - 32);
    return {
      publicKey: Buffer.concat([seed, pkBody]),
      secretKey: Buffer.concat([seed, skBody]),
      algorithm: this.cfg.algorithm,
      createdAt: Date.now(),
    };
  }

  /**
   * Sign a message with Dilithium secret key.
   * Uses seed embedded in sk[0..32] for deterministic mock signature.
   * Returns deterministic 3293-byte mock signature.
   */
  sign(secretKey: Buffer, message: Buffer): Buffer {
    if (this.cfg.algorithm !== 'Dilithium3') {
      throw new Error('sign() requires Dilithium3 algorithm');
    }
    // seed is sk[0..32]; same seed is pk[0..32] — sign/verify are consistent
    return wasmMock(Buffer.concat([secretKey.subarray(0, 32), message]), 'sig', 3293);
  }

  /** Verify a Dilithium signature. Returns true for mocked valid signatures. */
  verify(publicKey: Buffer, message: Buffer, signature: Buffer): boolean {
    if (this.cfg.algorithm !== 'Dilithium3') {
      throw new Error('verify() requires Dilithium3 algorithm');
    }
    // pk[0..32] is the same seed as sk[0..32] — re-derive expected signature
    const expected = wasmMock(
      Buffer.concat([publicKey.subarray(0, 32), message]),
      'sig',
      3293,
    );
    return signature.equals(expected);
  }

  /**
   * Kyber encapsulation: generate shared secret + ciphertext from public key.
   * Returns { sharedSecret: 32B, ciphertext: 1088B }.
   */
  encapsulate(publicKey: Buffer): { sharedSecret: Buffer; ciphertext: Buffer } {
    if (this.cfg.algorithm !== 'Kyber768') {
      throw new Error('encapsulate() requires Kyber768 algorithm');
    }
    const r = randomBytes(32);
    const sharedSecret = wasmMock(Buffer.concat([publicKey.subarray(0, 32), r]), 'ss', 32);
    const ciphertext = wasmMock(Buffer.concat([publicKey.subarray(0, 32), r]), 'ct', 1088);
    return { sharedSecret, ciphertext };
  }

  /**
   * Kyber decapsulation: recover shared secret from ciphertext + secret key.
   */
  decapsulate(secretKey: Buffer, ciphertext: Buffer): Buffer {
    if (this.cfg.algorithm !== 'Kyber768') {
      throw new Error('decapsulate() requires Kyber768 algorithm');
    }
    // Mock: shared secret deterministically derived from sk + ct
    return wasmMock(Buffer.concat([secretKey.subarray(0, 32), ciphertext.subarray(0, 32)]), 'ss-dec', 32);
  }

  getAlgorithm(): PqcAlgorithm {
    return this.cfg.algorithm;
  }

  isDryRun(): boolean {
    return this.cfg.dryRun;
  }
}
