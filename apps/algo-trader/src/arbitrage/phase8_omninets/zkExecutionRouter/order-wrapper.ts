/**
 * Order Wrapper — intercepts outgoing orders, attaches ZK proof before sending.
 * Sits between strategy layer and execution layer as middleware.
 */

import { EventEmitter } from 'events';
import { ProofGenerator, type OrderWitness, type ZkProof } from './proof-generator';
import { VerifierContract, type VerificationResult } from './verifier-contract';

export interface RawOrder {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  price: number;
  /** Caller must supply current portfolio Merkle root. */
  portfolioMerkleRoot: string;
}

export interface WrappedOrder extends RawOrder {
  proof: ZkProof;
  verification: VerificationResult;
}

export interface OrderWrapperConfig {
  /** If false, pass orders through without proof (dry-run / disabled). */
  enabled: boolean;
  /** Reject order and throw if verification fails. */
  rejectOnInvalidProof: boolean;
}

const DEFAULT_CONFIG: OrderWrapperConfig = {
  enabled: false,
  rejectOnInvalidProof: true,
};

export class OrderWrapper extends EventEmitter {
  private readonly cfg: OrderWrapperConfig;
  private readonly prover: ProofGenerator;
  private readonly verifier: VerifierContract;
  private wrappedCount = 0;
  private rejectedCount = 0;

  constructor(
    config: Partial<OrderWrapperConfig> = {},
    prover?: ProofGenerator,
    verifier?: VerifierContract,
  ) {
    super();
    this.cfg = { ...DEFAULT_CONFIG, ...config };
    this.prover = prover ?? new ProofGenerator();
    this.verifier = verifier ?? new VerifierContract();
  }

  /**
   * Intercept a raw order: generate ZK proof, verify it, emit result.
   * In dry-run (enabled=false): emits 'order:passthrough' without proof.
   */
  async wrap(order: RawOrder): Promise<WrappedOrder> {
    if (!this.cfg.enabled) {
      const passthrough: WrappedOrder = {
        ...order,
        proof: {} as ZkProof,
        verification: { valid: true, reason: 'zk-disabled', verifiedAt: Date.now() },
      };
      this.emit('order:passthrough', passthrough);
      return passthrough;
    }

    const witness: OrderWitness = {
      symbol: order.symbol,
      side: order.side,
      qty: order.qty,
      price: order.price,
      portfolioMerkleRoot: order.portfolioMerkleRoot,
    };

    const proof = await this.prover.generateProof(witness);
    const verification = this.verifier.verify(proof, witness);

    if (!verification.valid && this.cfg.rejectOnInvalidProof) {
      this.rejectedCount++;
      this.emit('order:rejected', { order, verification });
      throw new Error(`ZK proof rejected for order ${order.id}: ${verification.reason}`);
    }

    const wrapped: WrappedOrder = { ...order, proof, verification };
    this.wrappedCount++;
    this.emit('order:wrapped', wrapped);
    return wrapped;
  }

  getStats(): { wrapped: number; rejected: number } {
    return { wrapped: this.wrappedCount, rejected: this.rejectedCount };
  }
}
