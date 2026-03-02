/**
 * Exchange Health Monitor — Tracks per-exchange connection health,
 * latency, and emits events on status transitions and stale connections.
 */

import { EventEmitter } from 'events';

export type ExchangeStatus = 'connected' | 'degraded' | 'disconnected';

export interface ExchangeHealth {
  exchangeId: string;
  status: ExchangeStatus;
  lastSeen: number;
  latencyMs: number;
  errorCount: number;
  wsConnected: boolean;
  restHealthy: boolean;
}

export interface HealthChangeEvent {
  exchangeId: string;
  oldStatus: ExchangeStatus;
  newStatus: ExchangeStatus;
}

export interface HealthStaleEvent {
  exchangeId: string;
  lastSeen: number;
}

export class ExchangeHealthMonitor extends EventEmitter {
  private health = new Map<string, ExchangeHealth>();
  private checkTimer: ReturnType<typeof setInterval> | null = null;
  private latencySamples = new Map<string, number[]>();
  private readonly maxSamples = 10;

  constructor(private readonly staleThresholdMs: number = 30_000) {
    super();
  }

  initExchange(exchangeId: string): void {
    this.health.set(exchangeId, {
      exchangeId,
      status: 'disconnected',
      lastSeen: 0,
      latencyMs: 0,
      errorCount: 0,
      wsConnected: false,
      restHealthy: false,
    });
    this.latencySamples.set(exchangeId, []);
  }

  recordSuccess(exchangeId: string, latencyMs: number): void {
    const h = this.health.get(exchangeId);
    if (!h) return;
    h.lastSeen = Date.now();
    h.errorCount = 0;
    h.restHealthy = true;

    // Rolling average latency
    const samples = this.latencySamples.get(exchangeId) ?? [];
    samples.push(latencyMs);
    if (samples.length > this.maxSamples) samples.shift();
    this.latencySamples.set(exchangeId, samples);
    h.latencyMs = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);

    this.updateStatus(h);
  }

  recordError(exchangeId: string): void {
    const h = this.health.get(exchangeId);
    if (!h) return;
    h.errorCount++;
    this.updateStatus(h);
  }

  setWsStatus(exchangeId: string, connected: boolean): void {
    const h = this.health.get(exchangeId);
    if (!h) return;
    h.wsConnected = connected;
    if (connected) h.lastSeen = Date.now();
    this.updateStatus(h);
  }

  getHealth(exchangeId: string): ExchangeHealth | undefined {
    return this.health.get(exchangeId);
  }

  getAllHealth(): ExchangeHealth[] {
    return Array.from(this.health.values());
  }

  getStaleExchanges(): string[] {
    const now = Date.now();
    return Array.from(this.health.values())
      .filter(h => h.lastSeen > 0 && (now - h.lastSeen) >= this.staleThresholdMs)
      .map(h => h.exchangeId);
  }

  startChecks(intervalMs = 10_000): void {
    this.stopChecks();
    this.checkTimer = setInterval(() => this.runStaleCheck(), intervalMs);
    this.checkTimer.unref();
  }

  stopChecks(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  private runStaleCheck(): void {
    const now = Date.now();
    for (const h of this.health.values()) {
      if (h.lastSeen > 0 && (now - h.lastSeen) >= this.staleThresholdMs) {
        const oldStatus = h.status;
        h.status = 'disconnected';
        if (oldStatus !== 'disconnected') {
          this.emit('health:change', { exchangeId: h.exchangeId, oldStatus, newStatus: 'disconnected' } as HealthChangeEvent);
        }
        this.emit('health:stale', { exchangeId: h.exchangeId, lastSeen: h.lastSeen } as HealthStaleEvent);
      }
    }
  }

  private updateStatus(h: ExchangeHealth): void {
    const now = Date.now();
    const isStale = h.lastSeen > 0 && (now - h.lastSeen) >= this.staleThresholdMs;
    let newStatus: ExchangeStatus;

    if (isStale || h.lastSeen === 0) {
      newStatus = 'disconnected';
    } else if (h.errorCount > 0) {
      newStatus = 'degraded';
    } else {
      newStatus = 'connected';
    }

    if (newStatus !== h.status) {
      const oldStatus = h.status;
      h.status = newStatus;
      this.emit('health:change', { exchangeId: h.exchangeId, oldStatus, newStatus } as HealthChangeEvent);
    }
  }
}
