/**
 * Tests: order-wrapper.ts — order interception and proof attachment.
 */

import { OrderWrapper } from '../../../src/arbitrage/phase8_omninets/zkExecutionRouter/order-wrapper';
import { ProofGenerator } from '../../../src/arbitrage/phase8_omninets/zkExecutionRouter/proof-generator';
import { VerifierContract } from '../../../src/arbitrage/phase8_omninets/zkExecutionRouter/verifier-contract';
import type { RawOrder } from '../../../src/arbitrage/phase8_omninets/zkExecutionRouter/order-wrapper';

const makeOrder = (overrides: Partial<RawOrder> = {}): RawOrder => ({
  id: 'order-1',
  symbol: 'BTC/USDT',
  side: 'buy',
  qty: 0.5,
  price: 50_000,
  portfolioMerkleRoot: 'testmerkleroot123',
  ...overrides,
});

describe('OrderWrapper — disabled mode (passthrough)', () => {
  it('returns order with verification.valid=true in passthrough', async () => {
    const wrapper = new OrderWrapper({ enabled: false });
    const result = await wrapper.wrap(makeOrder());
    expect(result.verification.valid).toBe(true);
    expect(result.verification.reason).toBe('zk-disabled');
  });

  it('emits order:passthrough event', async () => {
    const wrapper = new OrderWrapper({ enabled: false });
    const events: unknown[] = [];
    wrapper.on('order:passthrough', (e) => events.push(e));
    await wrapper.wrap(makeOrder());
    expect(events).toHaveLength(1);
  });

  it('stats show 0 wrapped in passthrough mode', async () => {
    const wrapper = new OrderWrapper({ enabled: false });
    await wrapper.wrap(makeOrder());
    expect(wrapper.getStats().wrapped).toBe(0);
  });
});

describe('OrderWrapper — enabled mode', () => {
  it('wraps order with valid proof', async () => {
    const wrapper = new OrderWrapper({ enabled: true });
    const result = await wrapper.wrap(makeOrder());
    expect(result.proof).toHaveProperty('proofHash');
    expect(result.verification.valid).toBe(true);
  });

  it('emits order:wrapped event', async () => {
    const wrapper = new OrderWrapper({ enabled: true });
    const events: unknown[] = [];
    wrapper.on('order:wrapped', (e) => events.push(e));
    await wrapper.wrap(makeOrder());
    expect(events).toHaveLength(1);
  });

  it('increments wrapped count', async () => {
    const wrapper = new OrderWrapper({ enabled: true });
    await wrapper.wrap(makeOrder({ id: 'order-a', portfolioMerkleRoot: 'root-aaa' }));
    await wrapper.wrap(makeOrder({ id: 'order-b', portfolioMerkleRoot: 'root-bbb' }));
    expect(wrapper.getStats().wrapped).toBe(2);
  });

  it('rejects invalid symbol and throws', async () => {
    const wrapper = new OrderWrapper({ enabled: true, rejectOnInvalidProof: true });
    await expect(wrapper.wrap(makeOrder({ symbol: 'FAKE/USDT' }))).rejects.toThrow();
  });

  it('uses injected prover and verifier', async () => {
    const prover = new ProofGenerator();
    const verifier = new VerifierContract();
    const wrapper = new OrderWrapper({ enabled: true }, prover, verifier);
    const result = await wrapper.wrap(makeOrder());
    expect(result.verification.valid).toBe(true);
  });

  it('second wrap of same order fails (replay attack)', async () => {
    const prover = new ProofGenerator();
    const verifier = new VerifierContract({ maxProofAgeMs: 60_000, replayWindowMs: 60_000 });
    const wrapper = new OrderWrapper({ enabled: true, rejectOnInvalidProof: true }, prover, verifier);
    // First wrap succeeds
    await wrapper.wrap(makeOrder());
    // Second wrap with same inputs → same proofHash → replay rejection
    await expect(wrapper.wrap(makeOrder())).rejects.toThrow('replay detected');
  });
});
