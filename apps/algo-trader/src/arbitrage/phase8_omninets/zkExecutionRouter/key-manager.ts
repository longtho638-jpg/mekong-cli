/**
 * Key Manager — simulated HSM key management with encrypted storage.
 * In production: delegate to AWS CloudHSM / Azure Dedicated HSM.
 * Mock: AES-256-GCM in-memory encryption with simulated key slots.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export interface KeySlot {
  id: string;
  label: string;
  algorithm: 'Ed25519' | 'secp256k1';
  createdAt: number;
  /** Encrypted key material (hex). */
  encryptedKey: string;
  iv: string;
  authTag: string;
}

export interface KeyManagerConfig {
  useHsm: boolean;
  /** Master encryption key (32-byte hex). In prod: sourced from HSM. */
  masterKeyHex: string;
  maxSlots: number;
}

const DEFAULT_MASTER_KEY = '0'.repeat(64); // all-zero dev key

const DEFAULT_CONFIG: KeyManagerConfig = {
  useHsm: false,
  masterKeyHex: DEFAULT_MASTER_KEY,
  maxSlots: 16,
};

export class KeyManager {
  private readonly cfg: KeyManagerConfig;
  private readonly slots = new Map<string, KeySlot>();

  constructor(config: Partial<KeyManagerConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate a new key and store it in an HSM slot.
   * Returns the slot ID (never the raw key material).
   */
  generateKey(label: string, algorithm: KeySlot['algorithm'] = 'Ed25519'): string {
    if (this.slots.size >= this.cfg.maxSlots) {
      throw new Error(`HSM slot limit reached (max ${this.cfg.maxSlots})`);
    }

    const rawKey = randomBytes(32); // mock 256-bit private key
    const iv = randomBytes(12);
    const masterKey = Buffer.from(this.cfg.masterKeyHex, 'hex');

    const cipher = createCipheriv('aes-256-gcm', masterKey, iv);
    const encrypted = Buffer.concat([cipher.update(rawKey), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const id = randomBytes(8).toString('hex');
    const slot: KeySlot = {
      id,
      label,
      algorithm,
      createdAt: Date.now(),
      encryptedKey: encrypted.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };

    this.slots.set(id, slot);
    return id;
  }

  /**
   * Sign a payload with the key in the given slot.
   * Returns hex-encoded mock signature.
   */
  sign(slotId: string, payload: Buffer): string {
    const slot = this.slots.get(slotId);
    if (!slot) throw new Error(`Slot ${slotId} not found`);

    const rawKey = this.decryptSlot(slot);
    // Mock ECDSA: deterministic XOR-based signature for testing
    const sig = Buffer.alloc(64);
    for (let i = 0; i < 64; i++) {
      sig[i] = rawKey[i % 32] ^ payload[i % payload.length];
    }
    return sig.toString('hex');
  }

  /** List all slot metadata (never exposes key material). */
  listSlots(): Omit<KeySlot, 'encryptedKey' | 'iv' | 'authTag'>[] {
    return Array.from(this.slots.values()).map(({ id, label, algorithm, createdAt }) => ({
      id,
      label,
      algorithm,
      createdAt,
    }));
  }

  /** Delete a key slot permanently. */
  destroyKey(slotId: string): boolean {
    return this.slots.delete(slotId);
  }

  private decryptSlot(slot: KeySlot): Buffer {
    const masterKey = Buffer.from(this.cfg.masterKeyHex, 'hex');
    const iv = Buffer.from(slot.iv, 'hex');
    const authTag = Buffer.from(slot.authTag, 'hex');
    const encrypted = Buffer.from(slot.encryptedKey, 'hex');

    const decipher = createDecipheriv('aes-256-gcm', masterKey, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }

  getSlotCount(): number {
    return this.slots.size;
  }

  isHsmMode(): boolean {
    return this.cfg.useHsm;
  }
}
