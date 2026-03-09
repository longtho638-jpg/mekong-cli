/**
 * Verifier Contract — mock on-chain/off-chain proof verifier.
 * In production: call an Ethereum smart contract's verifyProof() function.
 * Mock: replay-attack detection + hash integrity check.
 */

import { createHash } from 'crypto';
import type { ZkProof, OrderWitness } from './proof-generator';

export interface VerificationResult {
  valid: boolean;
  reason?: string;
  verifiedAt: number;
}

export interface VerifierContractConfig {
  verifierAddress: string;
  /** Reject proofs older than this many milliseconds. */
  maxProofAgeMs: number;
  /** Track seen proofHashes to prevent replays. */
  replayWindowMs: number;
}

const DEFAULT_CONFIG: VerifierContractConfig = {
  verifierAddress: '0x0000000000000000000000000000000000000000',
  maxProofAgeMs: 30_000,
  replayWindowMs: 60_000,
};

/** Recompute expected proof hash from witness to validate integrity. */
function expectedHash(witness: OrderWitness): string {
  const seed = `${witness.symbol}:${witness.side}:${witness.qty}:${witness.price}:${witness.portfolioMerkleRoot}`;
  return createHash('sha256').update(seed).digest('hex');
}

export class VerifierContract {
  private readonly cfg: VerifierContractConfig;
  /** proofHash → expiresAt (timestamp) */
  private readonly seenProofs = new Map<string, number>();
  private verificationCount = 0;

  constructor(config: Partial<VerifierContractConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Verify a ZK proof against the original witness.
   * Checks: age limit, replay protection, hash integrity, public signals.
   */
  verify(proof: ZkProof, witness: OrderWitness): VerificationResult {
    const now = Date.now();
    this.pruneSeenProofs(now);

    // Age check
    if (now - proof.generatedAt > this.cfg.maxProofAgeMs) {
      return { valid: false, reason: 'proof expired', verifiedAt: now };
    }

    // Replay check
    if (this.seenProofs.has(proof.proofHash)) {
      return { valid: false, reason: 'replay detected', verifiedAt: now };
    }

    // Hash integrity — mock verifier: recompute and compare
    const expected = expectedHash(witness);
    if (proof.proofHash !== expected) {
      return { valid: false, reason: 'proof hash mismatch', verifiedAt: now };
    }

    // Public signals: qty and price must match witness
    if (
      proof.publicSignals[1] !== String(witness.qty) ||
      proof.publicSignals[2] !== String(witness.price)
    ) {
      return { valid: false, reason: 'public signals mismatch', verifiedAt: now };
    }

    // Record proof as seen
    this.seenProofs.set(proof.proofHash, now + this.cfg.replayWindowMs);
    this.verificationCount++;

    return { valid: true, verifiedAt: now };
  }

  private pruneSeenProofs(now: number): void {
    for (const [hash, expiresAt] of this.seenProofs) {
      if (now > expiresAt) this.seenProofs.delete(hash);
    }
  }

  getVerificationCount(): number {
    return this.verificationCount;
  }

  getVerifierAddress(): string {
    return this.cfg.verifierAddress;
  }
}
