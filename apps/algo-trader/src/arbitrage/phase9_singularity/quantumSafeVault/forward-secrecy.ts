/**
 * Forward Secrecy Ratchet — Signal-protocol-style Double Ratchet (mock).
 * Each ratchet step derives a new message key; old keys are discarded.
 * In production: replace with libsignal-client bindings.
 */

import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto';

export interface RatchetState {
  rootKey: Buffer;       // 32B — current root key
  chainKey: Buffer;      // 32B — current chain key
  messageIndex: number;
}

export interface RatchetSession {
  sessionId: string;
  localState: RatchetState;
  createdAt: number;
}

export interface ForwardSecrecyConfig {
  /** Disable ratcheting (use static key). Default: false. */
  dryRun: boolean;
  maxMessagesPerChain: number;
}

const DEFAULT_CONFIG: ForwardSecrecyConfig = {
  dryRun: false,
  maxMessagesPerChain: 1000,
};

/** HKDF-like KDF using HMAC-SHA256. */
function kdf(key: Buffer, input: Buffer, info: string): Buffer {
  return createHmac('sha256', key).update(input).update(info).digest();
}

/** Derive message key + next chain key from current chain key. */
function deriveMessageKey(chainKey: Buffer): { messageKey: Buffer; nextChainKey: Buffer } {
  const messageKey = kdf(chainKey, Buffer.from('01', 'hex'), 'message-key');
  const nextChainKey = kdf(chainKey, Buffer.from('02', 'hex'), 'chain-key');
  return { messageKey, nextChainKey };
}

export class ForwardSecrecyRatchet {
  private readonly cfg: ForwardSecrecyConfig;
  private sessions = new Map<string, RatchetSession>();

  constructor(config: Partial<ForwardSecrecyConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize a new ratchet session from a shared secret.
   * Returns session ID.
   */
  initSession(sharedSecret: Buffer): string {
    const sessionId = randomBytes(8).toString('hex');
    const rootKey = kdf(sharedSecret, randomBytes(32), 'root-key-init');
    const chainKey = kdf(rootKey, randomBytes(32), 'chain-key-init');

    const session: RatchetSession = {
      sessionId,
      localState: { rootKey, chainKey, messageIndex: 0 },
      createdAt: Date.now(),
    };
    this.sessions.set(sessionId, session);
    return sessionId;
  }

  /**
   * Perform a Diffie-Hellman ratchet step — advances root key.
   * Call when a new DH ratchet key is received from peer.
   */
  ratchetStep(sessionId: string, dhOutput: Buffer): void {
    const session = this.getSession(sessionId);
    const { rootKey } = session.localState;
    const newRootKey = kdf(rootKey, dhOutput, 'ratchet-root');
    const newChainKey = kdf(newRootKey, dhOutput, 'ratchet-chain');
    session.localState = { rootKey: newRootKey, chainKey: newChainKey, messageIndex: 0 };
  }

  /**
   * Encrypt plaintext using the next message key from the chain.
   * Advances the chain key (forward secrecy: old key is discarded).
   */
  encrypt(sessionId: string, plaintext: Buffer): { ciphertext: string; iv: string; authTag: string; index: number } {
    const session = this.getSession(sessionId);
    this.checkChainLimit(session);

    const { messageKey, nextChainKey } = deriveMessageKey(session.localState.chainKey);
    session.localState.chainKey = nextChainKey;
    const index = session.localState.messageIndex++;

    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', messageKey, iv);
    const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      ciphertext: ct.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      index,
    };
  }

  /**
   * Decrypt using the message key derived at the given chain index.
   * Note: for simplicity this re-derives from current chain key.
   * In production use a skipped-message-key store.
   */
  decrypt(
    sessionId: string,
    payload: { ciphertext: string; iv: string; authTag: string },
    messageKey: Buffer,
  ): Buffer {
    const iv = Buffer.from(payload.iv, 'hex');
    const authTag = Buffer.from(payload.authTag, 'hex');
    const ct = Buffer.from(payload.ciphertext, 'hex');

    const decipher = createDecipheriv('aes-256-gcm', messageKey, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ct), decipher.final()]);
  }

  getSession(sessionId: string): RatchetSession {
    const s = this.sessions.get(sessionId);
    if (!s) throw new Error(`Ratchet session ${sessionId} not found`);
    return s;
  }

  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  private checkChainLimit(session: RatchetSession): void {
    if (session.localState.messageIndex >= this.cfg.maxMessagesPerChain) {
      throw new Error('Chain message limit reached — perform ratchet step');
    }
  }
}
