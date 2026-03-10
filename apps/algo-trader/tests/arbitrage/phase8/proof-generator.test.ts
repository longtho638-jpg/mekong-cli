/**
 * Tests: proof-generator.ts — ZK proof generation and validation.
 */

import { ProofGenerator } from '../../../src/arbitrage/phase8_omninets/zkExecutionRouter/proof-generator';
import type { OrderWitness } from '../../../src/arbitrage/phase8_omninets/zkExecutionRouter/proof-generator';

const validWitness: OrderWitness = {
  symbol: 'BTC/USDT',
  side: 'buy',
  qty: 0.5,
  price: 50_000,
  portfolioMerkleRoot: 'abc123merkleroot',
};

describe('ProofGenerator', () => {
  it('generates a proof for a valid witness', async () => {
    const gen = new ProofGenerator();
    const proof = await gen.generateProof(validWitness);

    expect(proof).toHaveProperty('pi_a');
    expect(proof).toHaveProperty('pi_b');
    expect(proof).toHaveProperty('pi_c');
    expect(proof).toHaveProperty('publicSignals');
    expect(proof).toHaveProperty('proofHash');
    expect(proof.generatedAt).toBeLessThanOrEqual(Date.now());
  });

  it('proof is deterministic for the same witness', async () => {
    const gen = new ProofGenerator();
    const p1 = await gen.generateProof(validWitness);
    const p2 = await gen.generateProof(validWitness);
    expect(p1.proofHash).toBe(p2.proofHash);
  });

  it('different witnesses produce different proofs', async () => {
    const gen = new ProofGenerator();
    const p1 = await gen.generateProof(validWitness);
    const p2 = await gen.generateProof({ ...validWitness, qty: 1.0 });
    expect(p1.proofHash).not.toBe(p2.proofHash);
  });

  it('rejects symbol not in allowlist', async () => {
    const gen = new ProofGenerator();
    await expect(gen.generateProof({ ...validWitness, symbol: 'DOGE/USDT' }))
      .rejects.toThrow('not in allowlist');
  });

  it('rejects qty <= 0', async () => {
    const gen = new ProofGenerator();
    await expect(gen.generateProof({ ...validWitness, qty: 0 }))
      .rejects.toThrow('qty out of range');
  });

  it('rejects price <= 0', async () => {
    const gen = new ProofGenerator();
    await expect(gen.generateProof({ ...validWitness, price: -1 }))
      .rejects.toThrow('price out of range');
  });

  it('rejects empty portfolioMerkleRoot', async () => {
    const gen = new ProofGenerator();
    await expect(gen.generateProof({ ...validWitness, portfolioMerkleRoot: '' }))
      .rejects.toThrow('portfolioMerkleRoot');
  });

  it('publicSignals contains qty and price', async () => {
    const gen = new ProofGenerator();
    const proof = await gen.generateProof(validWitness);
    expect(proof.publicSignals[1]).toBe(String(validWitness.qty));
    expect(proof.publicSignals[2]).toBe(String(validWitness.price));
  });

  it('increments generation count', async () => {
    const gen = new ProofGenerator();
    await gen.generateProof(validWitness);
    await gen.generateProof(validWitness);
    expect(gen.getGenerationCount()).toBe(2);
  });

  it('pi_a has two string elements', async () => {
    const gen = new ProofGenerator();
    const proof = await gen.generateProof(validWitness);
    expect(proof.pi_a).toHaveLength(2);
    proof.pi_a.forEach((v) => expect(typeof v).toBe('string'));
  });
});
