/**
 * DataCollector — Captures all exchange API interactions
 * Uses circular buffer for memory-efficient event storage
 * Emits events for pattern detection pipeline
 */

import { EventEmitter } from 'events';
import { ExchangeEvent } from './antibot-config-types';

/** Circular buffer for memory-efficient time-series storage */
export class CircularBuffer<T> {
  private buffer: (T | undefined)[];
  private head = 0;
  private count = 0;

  constructor(private readonly capacity: number) {
    this.buffer = new Array(capacity);
  }

  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) this.count++;
  }

  getAll(): T[] {
    const result: T[] = [];
    const start = this.count < this.capacity ? 0 : this.head;
    for (let i = 0; i < this.count; i++) {
      const idx = (start + i) % this.capacity;
      result.push(this.buffer[idx] as T);
    }
    return result;
  }

  /** Get items within a time window (assumes items have timestamp) */
  getRecent(windowMs: number, now: number = Date.now()): T[] {
    const cutoff = now - windowMs;
    return this.getAll().filter(
      (item) => (item as unknown as { timestamp: number }).timestamp >= cutoff
    );
  }

  size(): number {
    return this.count;
  }

  clear(): void {
    this.buffer = new Array(this.capacity);
    this.head = 0;
    this.count = 0;
  }
}

/**
 * DataCollector — Central event collection hub
 * Subscribes to exchange interactions and stores in per-exchange buffers
 */
export class DataCollector extends EventEmitter {
  private readonly buffers: Map<string, CircularBuffer<ExchangeEvent>>;
  private readonly bufferSize: number;
  private eventIdCounter = 0;

  constructor(
    exchanges: string[],
    bufferSize: number = 1000
  ) {
    super();
    this.bufferSize = bufferSize;
    this.buffers = new Map();
    for (const exchange of exchanges) {
      this.buffers.set(exchange, new CircularBuffer<ExchangeEvent>(bufferSize));
    }
  }

  /** Record an exchange event */
  record(event: Omit<ExchangeEvent, 'id'>): ExchangeEvent {
    const fullEvent: ExchangeEvent = {
      ...event,
      id: `evt_${++this.eventIdCounter}`,
    };

    let buffer = this.buffers.get(event.exchange);
    if (!buffer) {
      buffer = new CircularBuffer<ExchangeEvent>(this.bufferSize);
      this.buffers.set(event.exchange, buffer);
    }
    buffer.push(fullEvent);

    this.emit('event', fullEvent);
    return fullEvent;
  }

  /** Get recent events for an exchange within time window */
  getRecentEvents(exchange: string, windowMs: number): ExchangeEvent[] {
    const buffer = this.buffers.get(exchange);
    if (!buffer) return [];
    return buffer.getRecent(windowMs);
  }

  /** Get all events for an exchange */
  getAllEvents(exchange: string): ExchangeEvent[] {
    const buffer = this.buffers.get(exchange);
    if (!buffer) return [];
    return buffer.getAll();
  }

  /** Get event count per exchange */
  getEventCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const [exchange, buffer] of this.buffers) {
      counts[exchange] = buffer.size();
    }
    return counts;
  }

  /** Get all tracked exchanges */
  getExchanges(): string[] {
    return Array.from(this.buffers.keys());
  }

  /** Clear all buffers */
  clear(): void {
    for (const buffer of this.buffers.values()) {
      buffer.clear();
    }
    this.eventIdCounter = 0;
  }
}
