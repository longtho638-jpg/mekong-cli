/**
 * ZK Proof Generator — mock snarkjs zk-SNARK proof for order validity.
 * Proves: symbol ∈ allowlist, side ∈ {buy,sell}, qty > 0, price > 0,
 *         AND portfolio Merkle root matches committed state.
 * In production replace mock with real snarkjs groth16.fullProve.
 */

import { createHash } from 'crypto';

export interface OrderWitness {
  symbol: string;
  side: 'buy' | 'sell';
  qty: number;
  price: number;
  portfolioMerkleRoot: string;
}

export interface ZkProof {
  pi_a: [string, string];
  pi_b: [[string, string], [string, string]];
  pi_c: [string, string];
  publicSignals: string[];
  proofHash: string;
  generatedAt: number;
}

export interface ProofGeneratorConfig {
  circuitPath: string;
  maxQty: number;
  maxPrice: number;
  allowedSymbols: string[];
}

const DEFAULT_CONFIG: ProofGeneratorConfig = {
  circuitPath: './circuits/order_validity.zkey',
  maxQty: 1_000_000,
  maxPrice: 10_000_000,
  allowedSymbols: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
};

/** Deterministic mock proof element from a seed string. */
function mockField(seed: string): string {
  return BigInt('0x' + createHash('sha256').update(seed).digest('hex'))
    .toString()
    .slice(0, 30);
}

export class ProofGenerator {
  private readonly cfg: ProofGeneratorConfig;
  private generationCount = 0;

  constructor(config: Partial<ProofGeneratorConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Validate witness constraints before generating proof.
   * Throws if any constraint is violated.
   */
  private validateWitness(w: OrderWitness): void {
    if (!this.cfg.allowedSymbols.includes(w.symbol)) {
      throw new Error(`Symbol ${w.symbol} not in allowlist`);
    }
    if (w.side !== 'buy' && w.side !== 'sell') {
      throw new Error(`Invalid side: ${w.side}`);
    }
    if (w.qty <= 0 || w.qty > this.cfg.maxQty) {
      throw new Error(`qty out of range: ${w.qty}`);
    }
    if (w.price <= 0 || w.price > this.cfg.maxPrice) {
      throw new Error(`price out of range: ${w.price}`);
    }
    if (!w.portfolioMerkleRoot || w.portfolioMerkleRoot.length === 0) {
      throw new Error('portfolioMerkleRoot must be non-empty');
    }
  }

  /**
   * Generate a mock zk-SNARK proof for the given order witness.
   * Returns deterministic fake proof elements suitable for testing.
   */
  async generateProof(witness: OrderWitness): Promise<ZkProof> {
    this.validateWitness(witness);

    const seed = `${witness.symbol}:${witness.side}:${witness.qty}:${witness.price}:${witness.portfolioMerkleRoot}`;

    const proof: ZkProof = {
      pi_a: [mockField(seed + '_a0'), mockField(seed + '_a1')],
      pi_b: [
        [mockField(seed + '_b00'), mockField(seed + '_b01')],
        [mockField(seed + '_b10'), mockField(seed + '_b11')],
      ],
      pi_c: [mockField(seed + '_c0'), mockField(seed + '_c1')],
      publicSignals: [
        mockField(witness.portfolioMerkleRoot),
        String(witness.qty),
        String(witness.price),
      ],
      proofHash: createHash('sha256').update(seed).digest('hex'),
      generatedAt: Date.now(),
    };

    this.generationCount++;
    return proof;
  }

  getGenerationCount(): number {
    return this.generationCount;
  }

  getCircuitPath(): string {
    return this.cfg.circuitPath;
  }
}
