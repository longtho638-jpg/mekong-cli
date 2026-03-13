/**
 * Risk Events EventEmitter — Typed event bus for risk management.
 *
 * Emits events: pnl:alert, drawdown:warning, circuit:trip, circuit:reset, limit:breached
 * Supports typed listeners and async event handling.
 */

import {
  RiskEvent,
  AlertType,
  PnLAlertEvent,
  DrawdownWarningEvent,
  CircuitTripEvent,
  CircuitResetEvent,
  LimitBreachedEvent,
} from '../risk/types';
import { logger } from '../utils/logger';

type EventHandler<T extends RiskEvent = RiskEvent> = (event: T) => void | Promise<void>;

/**
 * Typed event emitter for risk management events.
 * Provides type-safe subscription and emission of risk events.
 */
export class RiskEventEmitter {
  private static instance: RiskEventEmitter;
  private handlers = new Map<AlertType, EventHandler[]>();
  private eventLog: { event: RiskEvent; timestamp: number }[] = [];
  private readonly maxLogSize = 1000;

  /**
   * Get singleton instance
   */
  public static getInstance(): RiskEventEmitter {
    if (!RiskEventEmitter.instance) {
      RiskEventEmitter.instance = new RiskEventEmitter();
    }
    return RiskEventEmitter.instance;
  }

  /**
   * Subscribe to a specific risk event type.
   * @param type - Event type to subscribe to
   * @param handler - Async or sync event handler
   * @returns Unsubscribe function
   */
  on<T extends RiskEvent>(
    type: T['type'],
    handler: EventHandler<T>
  ): () => void {
    const handlers = this.handlers.get(type) || [];
    const wrappedHandler = handler as EventHandler;
    handlers.push(wrappedHandler);
    this.handlers.set(type, handlers);

    return () => {
      const current = this.handlers.get(type) || [];
      this.handlers.set(type, current.filter(h => h !== wrappedHandler));
    };
  }

  /**
   * Subscribe to all risk events.
   * @param handler - Global event handler
   * @returns Unsubscribe function
   */
  onAny(handler: EventHandler<RiskEvent>): () => void {
    const key = '*:any';
    const handlers = this.handlers.get(key as AlertType) || [];
    handlers.push(handler);
    this.handlers.set(key as AlertType, handlers);

    return () => {
      const current = this.handlers.get(key as AlertType) || [];
      this.handlers.set(key as AlertType, current.filter(h => h !== handler));
    };
  }

  /**
   * Emit a risk event to all matching subscribers.
   * @param event - Risk event to emit
   */
  async emit(event: RiskEvent): Promise<void> {
    const { type, timestamp } = event;

    // Log event
    this.eventLog.push({ event, timestamp: timestamp || Date.now() });
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxLogSize);
    }

    // Get handlers for this event type
    const typeHandlers = this.handlers.get(type) || [];
    const anyHandlers = this.handlers.get('*:any' as AlertType) || [];
    const allHandlers = [...typeHandlers, ...anyHandlers];

    // Execute handlers in parallel
    const promises = allHandlers.map(async (handler) => {
      try {
        await handler(event);
      } catch (err) {
        logger.error(
          `RiskEventEmitter handler error [${type}]: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    });

    await Promise.all(promises);
  }

  /**
   * Get recent event log.
   * @param type - Optional filter by event type
   * @param limit - Max events to return
   * @returns Array of logged events
   */
  getLog(type?: AlertType, limit: number = 100): { event: RiskEvent; timestamp: number }[] {
    let filtered = this.eventLog;
    if (type) {
      filtered = filtered.filter(entry => entry.event.type === type);
    }
    return filtered.slice(-limit);
  }

  /**
   * Get events by type.
   * @param type - Event type to filter
   * @returns Array of matching events
   */
  getEventsByType(type: AlertType): RiskEvent[] {
    return this.eventLog
      .filter(entry => entry.event.type === type)
      .map(entry => entry.event);
  }

  /**
   * Clear all subscribers and event log.
   */
  reset(): void {
    this.handlers.clear();
    this.eventLog = [];
  }

  /**
   * Get subscriber count for an event type.
   * @param type - Optional event type
   * @returns Number of subscribers
   */
  listenerCount(type?: AlertType): number {
    if (type) {
      return (this.handlers.get(type) || []).length;
    }

    let total = 0;
    for (const handlers of this.handlers.values()) {
      total += handlers.length;
    }
    return total;
  }
}
