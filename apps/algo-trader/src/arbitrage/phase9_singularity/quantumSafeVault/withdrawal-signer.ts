/**
 * Withdrawal Signer — Dilithium3 post-quantum signatures for withdrawals.
 * Replaces classical ECDSA with PQC-safe Dilithium3 via PqcKeyManager.
 * All operations default to dry-run (no side effects).
 */

import { createHash } from 'crypto';
import { PqcKeyManager, PqcKeyPair } from './pqc-key-manager';

export interface WithdrawalRequest {
  id: string;
  asset: string;
  amount: number;
  destinationAddress: string;
  nonce: number;
  timestampMs: number;
}

export interface SignedWithdrawal {
  request: WithdrawalRequest;
  signature: string;       // hex-encoded Dilithium3 signature
  publicKey: string;       // hex-encoded public key for verification
  requestHash: string;     // sha256 of canonical request bytes
  signedAt: number;
}

export interface WithdrawalSignerConfig {
  /** Do not store or broadcast — only sign. Default: true. */
  dryRun: boolean;
  maxAmountPerRequest: number;
}

const DEFAULT_CONFIG: WithdrawalSignerConfig = {
  dryRun: true,
  maxAmountPerRequest: 100_000,
};

/** Canonical serialization of a withdrawal request for signing. */
function serializeRequest(req: WithdrawalRequest): Buffer {
  const payload = JSON.stringify({
    id: req.id,
    asset: req.asset,
    amount: req.amount,
    destinationAddress: req.destinationAddress,
    nonce: req.nonce,
    timestampMs: req.timestampMs,
  });
  return Buffer.from(payload, 'utf8');
}

export class WithdrawalSigner {
  private readonly cfg: WithdrawalSignerConfig;
  private readonly pqc: PqcKeyManager;
  private keyPair: PqcKeyPair | null = null;
  private signCount = 0;

  constructor(config: Partial<WithdrawalSignerConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
    this.pqc = new PqcKeyManager({ algorithm: 'Dilithium3', dryRun: true });
  }

  /** Generate (or regenerate) a Dilithium3 key pair for this signer. */
  generateKeyPair(): void {
    this.keyPair = this.pqc.generateKeyPair();
  }

  /** Load an externally provided key pair (e.g. from HSM). */
  loadKeyPair(pair: PqcKeyPair): void {
    if (pair.algorithm !== 'Dilithium3') {
      throw new Error('WithdrawalSigner requires Dilithium3 key pair');
    }
    this.keyPair = pair;
  }

  /** Sign a withdrawal request. Throws if no key pair loaded. */
  signWithdrawal(request: WithdrawalRequest): SignedWithdrawal {
    if (!this.keyPair) throw new Error('No key pair — call generateKeyPair() first');
    if (request.amount <= 0) throw new Error('Withdrawal amount must be positive');
    if (request.amount > this.cfg.maxAmountPerRequest) {
      throw new Error(`Amount ${request.amount} exceeds max ${this.cfg.maxAmountPerRequest}`);
    }
    if (!request.destinationAddress) throw new Error('destinationAddress is required');

    const msgBuf = serializeRequest(request);
    const requestHash = createHash('sha256').update(msgBuf).digest('hex');
    const signature = this.pqc.sign(this.keyPair.secretKey, msgBuf);

    this.signCount++;
    return {
      request,
      signature: signature.toString('hex'),
      publicKey: this.keyPair.publicKey.toString('hex'),
      requestHash,
      signedAt: Date.now(),
    };
  }

  /** Verify a previously signed withdrawal against a known public key. */
  verifyWithdrawal(signed: SignedWithdrawal): boolean {
    const pubKey = Buffer.from(signed.publicKey, 'hex');
    const sig = Buffer.from(signed.signature, 'hex');
    const msgBuf = serializeRequest(signed.request);

    // Recompute hash for integrity check
    const expectedHash = createHash('sha256').update(msgBuf).digest('hex');
    if (expectedHash !== signed.requestHash) return false;

    return this.pqc.verify(pubKey, msgBuf, sig);
  }

  getSignCount(): number {
    return this.signCount;
  }

  hasKeyPair(): boolean {
    return this.keyPair !== null;
  }

  isDryRun(): boolean {
    return this.cfg.dryRun;
  }
}
