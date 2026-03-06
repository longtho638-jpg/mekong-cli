/**
 * Usage Tracker Service — License Usage Metering & Aggregation
 *
 * High-performance usage tracking with buffered writes:
 * - Singleton pattern for global state
 * - In-memory buffer for performance (batch writes)
 * - Auto-flush every 30s OR 100 events
 * - Graceful shutdown hook to flush on exit
 * - Per-license, per-month aggregation
 *
 * Usage:
 * ```typescript
 * const tracker = UsageTrackerService.getInstance();
 * await tracker.track('lic_abc123', 'api_call', 1, { endpoint: '/v1/scan' });
 * await tracker.flush(); // Force flush
 * const usage = await tracker.getUsage('lic_abc123', '2026-03');
 * ```
 */

import { PolarAuditLogger } from '../billing/polar-audit-logger';

/**
 * Usage event structure
 */
export interface UsageEvent {
  licenseKey: string;
  eventType: string;
  units: number;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Aggregated usage for a license in a given month
 */
export interface AggregatedUsage {
  licenseKey: string;
  month: string; // YYYY-MM format
  totalUnits: number;
  byEventType: Record<string, number>;
  events: UsageEvent[];
}

/**
 * Buffer entry with metadata
 */
interface BufferEntry {
  event: UsageEvent;
  addedAt: number; // epoch ms
}

export class UsageTrackerService {
  private static instance: UsageTrackerService;
  private static shutdownHooksRegistered = false;
  private auditLogger: PolarAuditLogger;

  // In-memory buffer for performance
  private buffer: BufferEntry[] = [];
  private readonly FLUSH_THRESHOLD = 100; // events
  private readonly AUTO_FLUSH_INTERVAL_MS = 30000; // 30s
  private autoFlushTimer: NodeJS.Timeout | null = null;
  private isFlushing = false;
  private isShuttingDown = false;

  // Persisted usage (in production, this would be a database)
  private usageStore = new Map<string, UsageEvent[]>();

  private constructor() {
    this.auditLogger = PolarAuditLogger.getInstance();
    this.startAutoFlush();
    this.registerShutdownHookOnce();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): UsageTrackerService {
    if (!UsageTrackerService.instance) {
      UsageTrackerService.instance = new UsageTrackerService();
    }
    return UsageTrackerService.instance;
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    if (UsageTrackerService.instance?.autoFlushTimer) {
      clearInterval(UsageTrackerService.instance.autoFlushTimer);
    }
    UsageTrackerService.instance = new UsageTrackerService();
    UsageTrackerService.shutdownHooksRegistered = false;
  }

  /**
   * Start auto-flush timer
   */
  private startAutoFlush(): void {
    this.autoFlushTimer = setInterval(() => {
      if (this.buffer.length > 0 && !this.isFlushing) {
        this.flush().catch((err) => {
          console.error('[UsageTracker] Auto-flush error:', err);
        });
      }
    }, this.AUTO_FLUSH_INTERVAL_MS);
    // Allow process to exit without waiting for timer
    this.autoFlushTimer.unref();
  }

  /**
   * Register shutdown hook once (singleton-wide)
   */
  private registerShutdownHookOnce(): void {
    if (UsageTrackerService.shutdownHooksRegistered) {
      return;
    }
    UsageTrackerService.shutdownHooksRegistered = true;

    const flushOnExit = async () => {
      const instance = UsageTrackerService.instance;
      if (!instance || instance.isShuttingDown) return;
      instance.isShuttingDown = true;

      try {
        await instance.flush();
      } catch (error) {
        console.error('[UsageTracker] Shutdown flush error:', error);
      }
    };

    // Use once() to avoid MaxListenersExceededWarning
    process.once('SIGINT', flushOnExit);
    process.once('SIGTERM', flushOnExit);
    process.once('beforeExit', flushOnExit);
    process.once('exit', flushOnExit);
  }

  /**
   * Track usage event — adds to buffer
   *
   * @param licenseKey - License identifier
   * @param eventType - Event type (e.g., 'api_call', 'backtest_run', 'live_trade')
   * @param units - Number of units consumed (default: 1)
   * @param metadata - Optional metadata for the event
   */
  async track(
    licenseKey: string,
    eventType: string,
    units: number = 1,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    const event: UsageEvent = {
      licenseKey,
      eventType,
      units,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
    };

    const entry: BufferEntry = {
      event,
      addedAt: Date.now(),
    };

    this.buffer.push(entry);

    // Auto-flush if threshold reached
    if (this.buffer.length >= this.FLUSH_THRESHOLD && !this.isFlushing) {
      await this.flush();
    }
  }

  /**
   * Flush buffered events to storage
   *
   * Writes all buffered events to the usage store and clears the buffer.
   * Returns number of events flushed.
   */
  async flush(): Promise<number> {
    if (this.isFlushing || this.buffer.length === 0) {
      return 0;
    }

    this.isFlushing = true;

    try {
      const eventsToFlush = [...this.buffer];
      this.buffer = [];

      for (const entry of eventsToFlush) {
        const { event } = entry;
        const key = `${event.licenseKey}:${this.getMonthKey(event.timestamp)}`;

        const existingEvents = this.usageStore.get(key) || [];
        existingEvents.push(event);
        this.usageStore.set(key, existingEvents);
      }

      return eventsToFlush.length;
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Get aggregated usage for a license in a given month
   *
   * @param licenseKey - License identifier
   * @param month - Month in YYYY-MM format (e.g., '2026-03')
   * @returns Aggregated usage data
   */
  async getUsage(licenseKey: string, month: string): Promise<AggregatedUsage> {
    // Ensure any pending events are flushed first
    if (this.buffer.length > 0 && !this.isFlushing) {
      await this.flush();
    }

    const key = `${licenseKey}:${month}`;
    const events = this.usageStore.get(key) || [];

    const byEventType: Record<string, number> = {};
    let totalUnits = 0;

    for (const event of events) {
      totalUnits += event.units;
      byEventType[event.eventType] = (byEventType[event.eventType] || 0) + event.units;
    }

    return {
      licenseKey,
      month,
      totalUnits,
      byEventType,
      events,
    };
  }

  /**
   * Get usage for current month (convenience method)
   */
  async getCurrentMonthUsage(licenseKey: string): Promise<AggregatedUsage> {
    const month = this.getMonthKey(new Date().toISOString());
    return this.getUsage(licenseKey, month);
  }

  /**
   * Get all usage records for a license (all months)
   */
  async getAllUsage(licenseKey: string): Promise<AggregatedUsage[]> {
    // Ensure any pending events are flushed first
    if (this.buffer.length > 0 && !this.isFlushing) {
      await this.flush();
    }

    const results: AggregatedUsage[] = [];
    const monthMap = new Map<string, UsageEvent[]>();

    for (const [key, events] of this.usageStore.entries()) {
      const [keyLicense] = key.split(':');
      if (keyLicense === licenseKey) {
        const [, month] = key.split(':');
        monthMap.set(month, events);
      }
    }

    for (const [month, events] of monthMap.entries()) {
      const byEventType: Record<string, number> = {};
      let totalUnits = 0;

      for (const event of events) {
        totalUnits += event.units;
        byEventType[event.eventType] = (byEventType[event.eventType] || 0) + event.units;
      }

      results.push({
        licenseKey,
        month,
        totalUnits,
        byEventType,
        events,
      });
    }

    return results;
  }

  /**
   * Get buffer size (for monitoring)
   */
  getBufferSize(): number {
    return this.buffer.length;
  }

  /**
   * Get total stored events count (for monitoring)
   */
  getTotalStoredEvents(): number {
    let count = 0;
    for (const events of this.usageStore.values()) {
      count += events.length;
    }
    return count;
  }

  /**
   * Clear all stored usage (testing only)
   */
  clear(): void {
    this.buffer = [];
    this.usageStore.clear();
  }

  /**
   * Get month key from timestamp
   */
  private getMonthKey(timestamp: string): string {
    const date = new Date(timestamp);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}
