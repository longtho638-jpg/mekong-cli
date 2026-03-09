import { CrossChainRwaHub } from '../../../src/expansion/cross-chain-rwa';
import type { CrossChainRwaConfig } from '../../../src/expansion/expansion-config-types';

const config: CrossChainRwaConfig = {
  enabled: true,
  chains: ['ethereum', 'solana', 'bsc'],
  minArbProfitBps: 5,
  rwaAssets: ['TSLA', 'AAPL', 'GOLD'],
};

describe('CrossChainRwaHub', () => {
  it('initialize connects all chains', async () => {
    const hub = new CrossChainRwaHub(config);
    const events: unknown[] = [];
    hub.on('chains-connected', (s) => events.push(s));
    await hub.initialize();
    expect(events).toHaveLength(1);
  });

  it('getConnectedChains returns connected chains after init', async () => {
    const hub = new CrossChainRwaHub(config);
    await hub.initialize();
    expect(hub.getConnectedChains()).toEqual(
      expect.arrayContaining(['ethereum', 'solana', 'bsc']),
    );
  });

  it('runArbCycle returns array of arb paths', async () => {
    const hub = new CrossChainRwaHub(config);
    await hub.initialize();
    const paths = await hub.runArbCycle();
    expect(Array.isArray(paths)).toBe(true);
  });

  it('emits arb-cycle-complete event', async () => {
    const hub = new CrossChainRwaHub(config);
    await hub.initialize();
    const events: unknown[] = [];
    hub.on('arb-cycle-complete', (p) => events.push(p));
    await hub.runArbCycle();
    expect(events).toHaveLength(1);
  });

  it('runArbCycle can be called without prior initialize', async () => {
    const hub = new CrossChainRwaHub(config);
    await expect(hub.runArbCycle()).resolves.toBeDefined();
  });
});
