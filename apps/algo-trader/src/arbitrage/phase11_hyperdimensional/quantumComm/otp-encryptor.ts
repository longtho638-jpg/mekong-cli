/**
 * Phase 11 Module 3: OTP Encryptor — One-Time Pad encryption/decryption.
 *
 * XOR-based OTP with HMAC-SHA256 authentication tag.
 * Enforces strict OTP requirement: key.length >= plaintext.length.
 *
 * Default: dryRun = true (safe by default).
 */

import { createHmac, timingSafeEqual } from 'crypto';

export interface OtpEncryptorConfig {
  /** Dry-run mode. Default: true. */
  dryRun: boolean;
}

export interface EncryptResult {
  ciphertext: Buffer;
  /** HMAC-SHA256 of ciphertext using key. */
  authTag: Buffer;
}

const DEFAULT_CONFIG: OtpEncryptorConfig = {
  dryRun: true,
};

export class OtpEncryptor {
  private readonly cfg: OtpEncryptorConfig;

  constructor(config: Partial<OtpEncryptorConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Encrypt plaintext using XOR-based OTP.
   * @throws if key.length < plaintext.length (OTP requirement).
   */
  encrypt(plaintext: Buffer, key: Buffer): EncryptResult {
    this._validateKeyLength(plaintext, key);
    const ciphertext = this._xor(plaintext, key);
    const authTag = this._computeHmac(ciphertext, key);
    return { ciphertext, authTag };
  }

  /**
   * Decrypt ciphertext using XOR-based OTP.
   * @throws if key.length < ciphertext.length.
   */
  decrypt(ciphertext: Buffer, key: Buffer, authTag: Buffer): Buffer {
    this._validateKeyLength(ciphertext, key);
    if (!this.verify(ciphertext, key, authTag)) {
      throw new Error('OTP auth tag verification failed — message may be tampered');
    }
    return this._xor(ciphertext, key);
  }

  /**
   * Verify HMAC-SHA256 auth tag in constant time.
   * Returns true if valid, false otherwise.
   */
  verify(ciphertext: Buffer, key: Buffer, authTag: Buffer): boolean {
    try {
      const expected = this._computeHmac(ciphertext, key);
      if (expected.length !== authTag.length) return false;
      return timingSafeEqual(expected, authTag);
    } catch {
      return false;
    }
  }

  getConfig(): OtpEncryptorConfig {
    return { ...this.cfg };
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private _xor(data: Buffer, key: Buffer): Buffer {
    const out = Buffer.allocUnsafe(data.length);
    for (let i = 0; i < data.length; i++) {
      out[i] = data[i] ^ key[i];
    }
    return out;
  }

  private _computeHmac(data: Buffer, key: Buffer): Buffer {
    return createHmac('sha256', key).update(data).digest();
  }

  private _validateKeyLength(data: Buffer, key: Buffer): void {
    if (key.length < data.length) {
      throw new Error(
        `OTP key too short: key is ${key.length} bytes but data is ${data.length} bytes. ` +
          'Key must be at least as long as plaintext (OTP requirement).',
      );
    }
  }
}
