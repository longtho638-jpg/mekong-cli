/**
 * HSM Simulator — in-memory encrypted key storage simulating a Hardware Security Module.
 * Keys are AES-256-GCM encrypted at rest. Slot access requires master key.
 * In production: replace with AWS CloudHSM / Azure Dedicated HSM SDK.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export interface HsmSlot {
  slotId: string;
  label: string;
  algorithm: string;
  createdAt: number;
  /** AES-256-GCM encrypted key material (hex). */
  encryptedKey: string;
  iv: string;
  authTag: string;
}

export interface HsmSimulatorConfig {
  /** 32-byte hex master encryption key. Default: all-zero dev key. */
  masterKeyHex: string;
  maxSlots: number;
  /** Log slot operations to console. Default: false. */
  verbose: boolean;
}

const DEFAULT_MASTER_KEY = '0'.repeat(64);

const DEFAULT_CONFIG: HsmSimulatorConfig = {
  masterKeyHex: DEFAULT_MASTER_KEY,
  maxSlots: 32,
  verbose: false,
};

export class HsmSimulator {
  private readonly cfg: HsmSimulatorConfig;
  private readonly slots = new Map<string, HsmSlot>();

  constructor(config: Partial<HsmSimulatorConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Store key material in a new slot.
   * Returns the slotId — never returns raw key material.
   */
  storeKey(label: string, keyMaterial: Buffer, algorithm = 'unknown'): string {
    if (this.slots.size >= this.cfg.maxSlots) {
      throw new Error(`HSM slot capacity reached (max ${this.cfg.maxSlots})`);
    }

    const masterKey = Buffer.from(this.cfg.masterKeyHex, 'hex');
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', masterKey, iv);
    const encrypted = Buffer.concat([cipher.update(keyMaterial), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const slotId = randomBytes(8).toString('hex');
    const slot: HsmSlot = {
      slotId,
      label,
      algorithm,
      createdAt: Date.now(),
      encryptedKey: encrypted.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };

    this.slots.set(slotId, slot);
    if (this.cfg.verbose) process.stdout.write(`[HSM] stored slot ${slotId} (${label})\n`);
    return slotId;
  }

  /**
   * Retrieve and decrypt key material from a slot.
   * Returns the raw key Buffer.
   */
  retrieveKey(slotId: string): Buffer {
    const slot = this.slots.get(slotId);
    if (!slot) throw new Error(`HSM slot ${slotId} not found`);

    const masterKey = Buffer.from(this.cfg.masterKeyHex, 'hex');
    const iv = Buffer.from(slot.iv, 'hex');
    const authTag = Buffer.from(slot.authTag, 'hex');
    const encrypted = Buffer.from(slot.encryptedKey, 'hex');

    const decipher = createDecipheriv('aes-256-gcm', masterKey, iv);
    decipher.setAuthTag(authTag);
    const key = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    if (this.cfg.verbose) process.stdout.write(`[HSM] retrieved slot ${slotId}\n`);
    return key;
  }

  /** Permanently delete a slot. Returns true if slot existed. */
  deleteKey(slotId: string): boolean {
    const existed = this.slots.has(slotId);
    this.slots.delete(slotId);
    if (this.cfg.verbose && existed) {
      process.stdout.write(`[HSM] deleted slot ${slotId}\n`);
    }
    return existed;
  }

  /** List all slot metadata — never exposes key material. */
  listSlots(): Omit<HsmSlot, 'encryptedKey' | 'iv' | 'authTag'>[] {
    return Array.from(this.slots.values()).map(
      ({ slotId, label, algorithm, createdAt }) => ({ slotId, label, algorithm, createdAt }),
    );
  }

  getSlotCount(): number {
    return this.slots.size;
  }

  hasSlot(slotId: string): boolean {
    return this.slots.has(slotId);
  }
}
