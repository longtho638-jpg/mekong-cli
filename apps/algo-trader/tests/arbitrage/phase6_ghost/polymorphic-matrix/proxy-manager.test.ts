import { ProxyManager } from '../../../../src/arbitrage/phase6_ghost/polymorphic-matrix/proxy-manager';
import { ProxyInfo, ProxyManagerConfig } from '../../../../src/arbitrage/phase6_ghost/types';

function createMockPool(count = 3): ProxyInfo[] {
  return Array.from({ length: count }, (_, i) => ({
    host: `proxy-${i}.test`,
    port: 8000 + i,
    protocol: 'http' as const,
    alive: true,
    latencyMs: 20 + i * 10,
  }));
}

function createConfig(overrides: Partial<ProxyManagerConfig> = {}): ProxyManagerConfig {
  return {
    provider: 'mock',
    rotationRequests: 3,
    rotationSec: 60,
    pool: createMockPool(),
    ...overrides,
  };
}

describe('ProxyManager', () => {
  it('should return proxy from pool', () => {
    const pm = new ProxyManager(createConfig());
    const proxy = pm.getProxy();
    expect(proxy).toBeDefined();
    expect(proxy.host).toContain('proxy-');
    expect(proxy.alive).toBe(true);
  });

  it('should throw on empty pool', () => {
    expect(() => new ProxyManager(createConfig({ pool: [] })).getProxy()).toThrow('Proxy pool is empty');
  });

  it('should rotate after N requests', () => {
    const pm = new ProxyManager(createConfig({ rotationRequests: 2 }));
    const first = pm.getProxy();
    pm.getProxy(); // 2nd request triggers rotation
    const third = pm.getProxy(); // should be from rotated proxy
    expect(third.host).not.toBe(first.host);
  });

  it('should rotate after time threshold', () => {
    const pm = new ProxyManager(createConfig({ rotationSec: 0 })); // 0 sec = always rotate
    const first = pm.getProxy();
    const second = pm.getProxy();
    expect(second.host).not.toBe(first.host);
  });

  it('should force rotate', () => {
    const pm = new ProxyManager(createConfig());
    const before = pm.getCurrentProxy();
    pm.rotate();
    const after = pm.getCurrentProxy();
    expect(after!.host).not.toBe(before!.host);
  });

  it('should skip dead proxies during rotation', () => {
    const pool = createMockPool(3);
    pool[1].alive = false; // Mark middle proxy as dead
    const pm = new ProxyManager(createConfig({ pool }));
    pm.rotate(); // Should skip dead proxy-1
    const current = pm.getCurrentProxy();
    expect(current!.host).not.toBe('proxy-1.test');
  });

  it('should throw when all proxies are dead', () => {
    const pool = createMockPool(2);
    pool[0].alive = false;
    pool[1].alive = false;
    const pm = new ProxyManager(createConfig({ pool }));
    expect(() => pm.rotate()).toThrow('No alive proxies');
  });

  it('should health check a proxy', async () => {
    const pm = new ProxyManager(createConfig());
    const proxy = pm.getProxy();
    const latency = await pm.healthCheck(proxy);
    expect(latency).toBeGreaterThanOrEqual(0);
    expect(proxy.alive).toBe(true);
  });

  it('should health check all proxies', async () => {
    const pm = new ProxyManager(createConfig());
    const results = await pm.healthCheckAll();
    expect(results.size).toBe(3);
    for (const [, latency] of results) {
      expect(latency).toBeGreaterThanOrEqual(0);
    }
  });

  it('should add proxy to pool', () => {
    const pm = new ProxyManager(createConfig());
    expect(pm.getPoolSize()).toBe(3);
    pm.addProxy({ host: 'new.test', port: 9000, protocol: 'socks5', alive: true });
    expect(pm.getPoolSize()).toBe(4);
  });

  it('should prune dead proxies', () => {
    const pool = createMockPool(4);
    pool[1].alive = false;
    pool[3].alive = false;
    const pm = new ProxyManager(createConfig({ pool }));
    const removed = pm.pruneDeadProxies();
    expect(removed).toBe(2);
    expect(pm.getPoolSize()).toBe(2);
    expect(pm.getAliveCount()).toBe(2);
  });

  it('should reset currentIndex after pruning if out of bounds', () => {
    const pool = createMockPool(2);
    const pm = new ProxyManager(createConfig({ pool, rotationRequests: 1 }));
    pm.getProxy(); // index 0, triggers rotation
    pm.getProxy(); // index 1
    pool[0].alive = false;
    pool[1].alive = false;
    pm.pruneDeadProxies();
    expect(pm.getPoolSize()).toBe(0);
  });

  it('should report alive count', () => {
    const pool = createMockPool(5);
    pool[2].alive = false;
    const pm = new ProxyManager(createConfig({ pool }));
    expect(pm.getAliveCount()).toBe(4);
  });

  it('should return null for current proxy when pool empty after prune', () => {
    const pool = createMockPool(1);
    pool[0].alive = false;
    const pm = new ProxyManager(createConfig({ pool }));
    pm.pruneDeadProxies();
    expect(pm.getCurrentProxy()).toBeNull();
  });
});
