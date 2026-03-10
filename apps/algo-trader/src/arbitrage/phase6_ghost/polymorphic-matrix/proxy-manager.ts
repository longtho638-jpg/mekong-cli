/**
 * Proxy Manager — rotates residential proxies (BrightData/Oxylabs)
 * Mock mode uses a static pool for simulation/testing.
 */
import { ProxyInfo, ProxyManagerConfig } from '../types';

export class ProxyManager {
  private pool: ProxyInfo[] = [];
  private currentIndex = 0;
  private requestsSinceRotation = 0;
  private lastRotationTime = Date.now();
  private config: ProxyManagerConfig;

  constructor(config: ProxyManagerConfig) {
    this.config = config;
    this.pool = [...config.pool];
  }

  /** Get next proxy based on rotation policy */
  getProxy(): ProxyInfo {
    if (this.pool.length === 0) {
      throw new Error('Proxy pool is empty');
    }

    const timeSinceRotation = Date.now() - this.lastRotationTime;
    const shouldRotate =
      this.requestsSinceRotation >= this.config.rotationRequests ||
      timeSinceRotation >= this.config.rotationSec * 1000;

    if (shouldRotate) {
      this.rotate();
    }

    this.requestsSinceRotation++;
    return this.pool[this.currentIndex];
  }

  /** Force rotation to next proxy */
  rotate(): void {
    const aliveProxies = this.pool.filter((p) => p.alive);
    if (aliveProxies.length === 0) {
      throw new Error('No alive proxies in pool');
    }

    // Move to next alive proxy
    let nextIndex = (this.currentIndex + 1) % this.pool.length;
    while (!this.pool[nextIndex].alive) {
      nextIndex = (nextIndex + 1) % this.pool.length;
    }

    this.currentIndex = nextIndex;
    this.requestsSinceRotation = 0;
    this.lastRotationTime = Date.now();
  }

  /** Health check a proxy — returns latency in ms or -1 if dead */
  async healthCheck(proxy: ProxyInfo): Promise<number> {
    const start = Date.now();
    try {
      // In mock mode, simulate latency check
      const latency = proxy.latencyMs ?? Math.random() * 100;
      proxy.alive = latency < 5000;
      proxy.latencyMs = latency;
      return proxy.alive ? latency : -1;
    } catch {
      proxy.alive = false;
      return -1;
    }
  }

  /** Run health checks on entire pool */
  async healthCheckAll(): Promise<Map<string, number>> {
    const results = new Map<string, number>();
    for (const proxy of this.pool) {
      const latency = await this.healthCheck(proxy);
      results.set(`${proxy.host}:${proxy.port}`, latency);
    }
    return results;
  }

  /** Add proxy to pool */
  addProxy(proxy: ProxyInfo): void {
    this.pool.push(proxy);
  }

  /** Remove dead proxies from pool */
  pruneDeadProxies(): number {
    const before = this.pool.length;
    this.pool = this.pool.filter((p) => p.alive);
    if (this.currentIndex >= this.pool.length) {
      this.currentIndex = 0;
    }
    return before - this.pool.length;
  }

  getPoolSize(): number {
    return this.pool.length;
  }

  getAliveCount(): number {
    return this.pool.filter((p) => p.alive).length;
  }

  getCurrentProxy(): ProxyInfo | null {
    return this.pool[this.currentIndex] ?? null;
  }
}
