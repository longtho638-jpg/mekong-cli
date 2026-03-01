/**
 * A2UI Agent Event Bus — Typed pub/sub for agent-to-UI communication.
 * Core transport layer between trading engine and UI surfaces.
 * Supports multi-tenant routing for RaaS AGI.
 */

import { AgentEvent, AgentEventType } from './types';
import { logger } from '../utils/logger';

type EventHandler = (event: AgentEvent) => void | Promise<void>;
type TypedHandler<T extends AgentEvent> = (event: T) => void | Promise<void>;

export class AgentEventBus {
  private static instance: AgentEventBus;
  private handlers = new Map<string, EventHandler[]>();
  private globalHandlers: EventHandler[] = [];
  private eventLog: { event: AgentEvent; timestamp: number }[] = [];
  private maxLogSize: number;

  constructor(maxLogSize = 1000) {
    this.maxLogSize = maxLogSize;
  }

  public static getInstance(): AgentEventBus {
    if (!AgentEventBus.instance) {
      AgentEventBus.instance = new AgentEventBus();
    }
    return AgentEventBus.instance;
  }

  /**
   * Subscribe to a specific event type for a specific tenant.
   * If tenantId is omitted, subscribes to all events of that type.
   */
  on<T extends AgentEvent>(
    type: T['type'],
    handler: TypedHandler<T>,
    tenantId?: string
  ): () => void {
    const route = tenantId ? `${type}:${tenantId}` : `type:${type}`;
    const handlers = this.handlers.get(route) || [];
    const wrappedHandler = handler as EventHandler;
    handlers.push(wrappedHandler);
    this.handlers.set(route, handlers);

    return () => {
      const current = this.handlers.get(route) || [];
      this.handlers.set(route, current.filter(h => h !== wrappedHandler));
    };
  }

  /** Subscribe to all events for a specific tenant */
  onTenant(tenantId: string, handler: EventHandler): () => void {
    const route = `tenant:${tenantId}`;
    const handlers = this.handlers.get(route) || [];
    handlers.push(handler);
    this.handlers.set(route, handlers);

    return () => {
      const current = this.handlers.get(route) || [];
      this.handlers.set(route, current.filter(h => h !== handler));
    };
  }

  /** Subscribe to ALL events globally */
  onAny(handler: EventHandler): () => void {
    this.globalHandlers.push(handler);
    return () => {
      this.globalHandlers = this.globalHandlers.filter(h => h !== handler);
    };
  }

  /** Emit an event to all matching subscribers */
  async emit(event: AgentEvent): Promise<void> {
    const { type, tenantId, timestamp } = event;

    // Log event
    this.eventLog.push({ event, timestamp: timestamp || Date.now() });
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxLogSize);
    }

    // Determine target routes
    const routes = [
      '*', // Global
      `type:${type}`, // All of this type
      `tenant:${tenantId}`, // All for this tenant
      `${type}:${tenantId}` // Specific type for specific tenant
    ];

    const targetHandlers: EventHandler[] = [...this.globalHandlers];

    for (const route of routes) {
      if (route === '*') continue;
      const handlers = this.handlers.get(route);
      if (handlers) {
        targetHandlers.push(...handlers);
      }
    }

    // Execute handlers
    const promises = targetHandlers.map(async (handler) => {
      try {
        await handler(event);
      } catch (err) {
        logger.error(`AgentEventBus handler error [${type}]: ${err instanceof Error ? err.message : String(err)}`);
      }
    });

    await Promise.all(promises);
  }

  /** Get recent event log for a tenant */
  getLog(tenantId?: string, limit?: number): { event: AgentEvent; timestamp: number }[] {
    let filtered = this.eventLog;
    if (tenantId) {
      filtered = filtered.filter(entry => entry.event.tenantId === tenantId);
    }
    const count = limit ?? filtered.length;
    return filtered.slice(-count);
  }

  /** Get events of a specific type for a tenant */
  getEventsByType(type: AgentEventType, tenantId?: string): AgentEvent[] {
    return this.eventLog
      .filter(entry => {
        const typeMatch = entry.event.type === type;
        const tenantMatch = tenantId ? entry.event.tenantId === tenantId : true;
        return typeMatch && tenantMatch;
      })
      .map(entry => entry.event);
  }

  /** Clear all subscribers and log */
  reset(): void {
    this.handlers.clear();
    this.globalHandlers = [];
    this.eventLog = [];
  }

  /** Get subscriber count */
  listenerCount(type?: AgentEventType, tenantId?: string): number {
    if (type && tenantId) {
      return (this.handlers.get(`${type}:${tenantId}`) || []).length;
    }
    if (type) {
      return (this.handlers.get(`type:${type}`) || []).length;
    }
    if (tenantId) {
      return (this.handlers.get(`tenant:${tenantId}`) || []).length;
    }

    let total = this.globalHandlers.length;
    for (const handlers of this.handlers.values()) {
      total += handlers.length;
    }
    return total;
  }
}
