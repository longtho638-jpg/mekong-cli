/**
 * Hybrid Encryptor — X25519 + Kyber768 key exchange, AES-256-GCM bulk encryption.
 * Classical X25519 provides backward compat; Kyber provides quantum resistance.
 * In production: replace X25519 mock with actual ECDH via Node crypto.
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
import { PqcKeyManager } from './pqc-key-manager';

export interface HybridEncryptorConfig {
  /** Disable all encryption for dry-run testing. Default: false. */
  dryRun: boolean;
}

export interface EncryptedPayload {
  ciphertext: string;   // hex
  iv: string;           // hex, 12B
  authTag: string;      // hex, 16B
  kyberCt: string;      // hex — Kyber ciphertext for receiver to recover session key
  sessionKeyHash: string; // sha256 of session key for audit
}

const DEFAULT_CONFIG: HybridEncryptorConfig = { dryRun: false };

/** Derive X25519-style shared secret from two 32-byte seeds (mock DH). */
function mockX25519(localPriv: Buffer, remotePub: Buffer): Buffer {
  return createHash('sha256').update(localPriv).update(remotePub).digest();
}

/** Combine classical + PQC shared secrets via HKDF-like XOR+hash. */
function combineSecrets(classical: Buffer, pqc: Buffer): Buffer {
  const combined = Buffer.alloc(32);
  for (let i = 0; i < 32; i++) {
    combined[i] = classical[i] ^ pqc[i];
  }
  return createHash('sha256').update(combined).update('hybrid-session').digest();
}

export class HybridEncryptor {
  private readonly cfg: HybridEncryptorConfig;
  private readonly kyber: PqcKeyManager;
  private sessionKey: Buffer | null = null;

  constructor(config: Partial<HybridEncryptorConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
    this.kyber = new PqcKeyManager({ algorithm: 'Kyber768', dryRun: true });
  }

  /**
   * Perform hybrid handshake given receiver's Kyber public key.
   * Stores derived session key internally.
   * Returns kyberCt to send to receiver so they can recover the session key.
   */
  handshake(receiverKyberPubKey: Buffer): { kyberCt: Buffer; sessionKeyHash: string } {
    // Classical leg: mock X25519
    const localPriv = randomBytes(32);
    const classicalSecret = mockX25519(localPriv, receiverKyberPubKey.subarray(0, 32));

    // PQC leg: Kyber encapsulation
    const { sharedSecret: kyberSecret, ciphertext: kyberCt } =
      this.kyber.encapsulate(receiverKyberPubKey);

    this.sessionKey = combineSecrets(classicalSecret, kyberSecret);
    const sessionKeyHash = createHash('sha256').update(this.sessionKey).digest('hex');

    return { kyberCt, sessionKeyHash };
  }

  /**
   * Recover session key on the receiver side using their Kyber secret key.
   * Mirrors the handshake derivation.
   */
  receiveHandshake(kyberSecretKey: Buffer, kyberCt: Buffer, localX25519Pub: Buffer): void {
    const localPriv = randomBytes(32); // mock: in prod derive from key material
    const classicalSecret = mockX25519(localPriv, localX25519Pub.subarray(0, 32));
    const kyberSecret = this.kyber.decapsulate(kyberSecretKey, kyberCt);
    this.sessionKey = combineSecrets(classicalSecret, kyberSecret);
  }

  /** Encrypt plaintext with current session key using AES-256-GCM. */
  encrypt(plaintext: Buffer): EncryptedPayload {
    const key = this.getKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      ciphertext: ct.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      kyberCt: '', // populated during handshake flow
      sessionKeyHash: createHash('sha256').update(key).digest('hex'),
    };
  }

  /** Decrypt an EncryptedPayload with current session key. */
  decrypt(payload: EncryptedPayload): Buffer {
    const key = this.getKey();
    const iv = Buffer.from(payload.iv, 'hex');
    const authTag = Buffer.from(payload.authTag, 'hex');
    const ct = Buffer.from(payload.ciphertext, 'hex');

    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ct), decipher.final()]);
  }

  /** Manually set session key (for testing or pre-shared key scenarios). */
  setSessionKey(key: Buffer): void {
    if (key.length !== 32) throw new Error('Session key must be 32 bytes');
    this.sessionKey = key;
  }

  hasSessionKey(): boolean {
    return this.sessionKey !== null;
  }

  private getKey(): Buffer {
    if (!this.sessionKey) throw new Error('No session key — call handshake() first');
    return this.sessionKey;
  }
}
