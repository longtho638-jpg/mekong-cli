/**
 * SignalMesh (MarketEventBus) — High-performance multi-tenant event bus for trading signals.
 * Core transport layer for the Signal Mesh RaaS AGI.
 * Renamed to SignalMesh for compatibility with existing codebase.
 */

import { EventEmitter } from 'events';
import { MarketEvent, MarketEventType } from '../interfaces/IMarketEvent';
import { logger } from '../utils/logger';

export type MarketEventHandler<T extends MarketEvent> = (event: T) => void | Promise<void>;

export class SignalMesh {
  private static instance: SignalMesh;
  private bus: EventEmitter;
  private totalEvents: number = 0;
  private tenantSubscribers: Map<string, number> = new Map();

  constructor() {
    this.bus = new EventEmitter();
    // Increase limit for high-frequency trading scale
    this.bus.setMaxListeners(1000);
  }

  public static getInstance(): SignalMesh {
    if (!SignalMesh.instance) {
      SignalMesh.instance = new SignalMesh();
    }
    return SignalMesh.instance;
  }

  /**
   * Emit a market event with multi-tenant routing.
   * Events are emitted to:
   * 1. Global stream: '*'
   * 2. Type-specific stream: 'type:{type}'
   * 3. Tenant-specific stream: 'tenant:{tenantId}'
   * 4. Type-Tenant specific stream: '{type}:{tenantId}'
   */
  public emit(event: MarketEvent): void {
    try {
      this.totalEvents++;
      const { type, tenantId } = event;

      // 1. Global
      this.bus.emit('*', event);

      // 2. Type Global
      this.bus.emit(`type:${type}`, event);

      // 3. Tenant Global
      this.bus.emit(`tenant:${tenantId}`, event);

      // 4. Specific Route
      this.bus.emit(`${type}:${tenantId}`, event);

    } catch (error) {
      logger.error(`SignalMesh emit error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Publish method for backward compatibility
   */
  public publish(type: string, payload: Record<string, unknown> & { symbol?: string }, senderId: string = 'system', tenantId: string = 'default'): void {
    const event = {
      type,
      tenantId,
      symbol: payload.symbol ?? 'N/A',
      timestamp: Date.now(),
      source: senderId,
      ...payload
    } as unknown as MarketEvent;
    this.emit(event);
  }

  /** Subscribe to all events */
  public onAny(handler: MarketEventHandler<MarketEvent>): () => void {
    this.bus.on('*', handler);
    return () => this.bus.off('*', handler);
  }

  /** Subscribe to events for a specific tenant */
  public onTenant(tenantId: string, handler: MarketEventHandler<MarketEvent>): () => void {
    const route = `tenant:${tenantId}`;
    this.bus.on(route, handler);
    this.tenantSubscribers.set(tenantId, (this.tenantSubscribers.get(tenantId) || 0) + 1);

    return () => {
      this.bus.off(route, handler);
      const count = this.tenantSubscribers.get(tenantId) || 0;
      if (count <= 1) this.tenantSubscribers.delete(tenantId);
      else this.tenantSubscribers.set(tenantId, count - 1);
    };
  }

  /** Subscribe to a specific event type for a specific tenant */
  public onType<T extends MarketEvent>(
    type: MarketEventType,
    tenantId: string,
    handler: MarketEventHandler<T>
  ): () => void {
    const route = `${type}:${tenantId}`;
    // EventEmitter requires generic type for proper handler typing
    this.bus.on(route, handler as (...args: unknown[]) => void);
    return () => this.bus.off(route, handler as (...args: unknown[]) => void);
  }

  /** Subscribe to a specific event type globally */
  public onTypeGlobal<T extends MarketEvent>(
    type: MarketEventType,
    handler: MarketEventHandler<T>
  ): () => void {
    const route = `type:${type}`;
    // EventEmitter requires generic type for proper handler typing
    this.bus.on(route, handler as (...args: unknown[]) => void);
    return () => this.bus.off(route, handler as (...args: unknown[]) => void);
  }

  /**
   * Subscribe method for backward compatibility
   */
  public subscribe(type: string, callback: (signal: Record<string, unknown>) => void): () => void {
    const handler = (event: MarketEvent) => {
      if (event.type === type || type === '*') {
        callback({
          type: event.type,
          payload: event,
          timestamp: event.timestamp,
          senderId: event.source
        });
      }
    };
    this.bus.on('*', handler);
    return () => this.bus.off('*', handler);
  }

  public getMetrics() {
    return {
      totalEvents: this.totalEvents,
      activeTenants: this.tenantSubscribers.size,
      listenerCount: this.bus.eventNames().length,
    };
  }

  public reset(): void {
    this.bus.removeAllListeners();
    this.totalEvents = 0;
    this.tenantSubscribers.clear();
  }
}
