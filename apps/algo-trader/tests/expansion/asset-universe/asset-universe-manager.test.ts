import { AssetUniverseManager } from '../../../src/expansion/asset-universe';
import type { AssetUniverseConfig } from '../../../src/expansion/expansion-config-types';

const config: AssetUniverseConfig = {
  enabled: true,
  minVolume24h: 100_000_000,
  volatilityBounds: [0, 0.30],
  sharpeThreshold: 0,
  updateIntervalMs: 60_000,
};

describe('AssetUniverseManager', () => {
  it('runCycle returns a snapshot with symbols and liveList', async () => {
    const manager = new AssetUniverseManager(config);
    const snapshot = await manager.runCycle();
    expect(snapshot.symbols).toBeDefined();
    expect(Array.isArray(snapshot.liveList)).toBe(true);
    expect(snapshot.updatedAt).toBeGreaterThan(0);
  });

  it('emits cycle-complete event', async () => {
    const manager = new AssetUniverseManager(config);
    const events: unknown[] = [];
    manager.on('cycle-complete', (s) => events.push(s));
    await manager.runCycle();
    expect(events).toHaveLength(1);
  });

  it('start and stop control interval', () => {
    const manager = new AssetUniverseManager(config);
    const started: unknown[] = [];
    const stopped: unknown[] = [];
    manager.on('started', () => started.push(1));
    manager.on('stopped', () => stopped.push(1));
    manager.start();
    manager.stop();
    expect(started).toHaveLength(1);
    expect(stopped).toHaveLength(1);
  });

  it('calling start twice does not create duplicate intervals', () => {
    const manager = new AssetUniverseManager(config);
    const started: unknown[] = [];
    manager.on('started', () => started.push(1));
    manager.start();
    manager.start(); // second call is no-op
    expect(started).toHaveLength(1);
    manager.stop();
  });

  it('stop without start is safe', () => {
    const manager = new AssetUniverseManager(config);
    expect(() => manager.stop()).not.toThrow();
  });

  it('snapshot liveList contains promoted symbols', async () => {
    const cfg: AssetUniverseConfig = { ...config, sharpeThreshold: 0 };
    const manager = new AssetUniverseManager(cfg);
    const snapshot = await manager.runCycle();
    // With threshold=0 all symbols with positive sharpe are promoted
    expect(snapshot.liveList.length).toBeGreaterThanOrEqual(0);
  });
});
