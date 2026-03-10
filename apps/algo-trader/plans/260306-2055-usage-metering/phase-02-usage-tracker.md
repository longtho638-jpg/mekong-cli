---
title: "Phase 4.2: UsageTracker Core Service"
description: "Implement in-memory buffered usage tracking service"
status: pending
priority: P0
effort: 2h
parent: plan.md
---

# Phase 4.2: UsageTracker Core Service

## Overview

UsageTracker is the core service that:
- Buffers usage events in-memory for batch writes
- Tracks compute time for ML inference
- Auto-flushes to DB every 30s or 100 events
- Provides non-blocking API for middleware

## File: `src/metering/usage-tracker.ts`

```typescript
/**
 * Usage Tracker Service
 *
 * Tracks API calls and compute time with buffered batch writes.
 * Designed for high-throughput, non-blocking operation.
 */

import {
  recordUsageEvent,
  batchRecordUsageEvents,
  getUsageByPeriod,
  UsageEventInput,
} from '../db/queries/usage-queries';
import { logger } from '../utils/logger';

export interface UsageTrackerConfig {
  flushIntervalMs?: number;     // Default: 30000 (30s)
  flushThreshold?: number;        // Default: 100 events
  enableComputeTracking?: boolean; // Default: true
}

export interface UsageSummary {
  tenantId: string;
  period: string;
  apiCalls: number;
  computeMinutes: number;
}

/**
 * Compute timer handle
 */
export interface ComputeTimer {
  stop: () => number; // Returns elapsed ms
}

/**
 * UsageTracker Singleton
 */
export class UsageTrackerService {
  private static instance: UsageTrackerService;

  private buffer: UsageEventInput[] = [];
  private flushIntervalMs: number;
  private flushThreshold: number;
  private flushTimer: NodeJS.Timeout | null = null;
  private isFlushing = false;

  private constructor(private config: UsageTrackerConfig = {}) {
    this.flushIntervalMs = config.flushIntervalMs ?? 30000;
    this.flushThreshold = config.flushThreshold ?? 100;
  }

  static getInstance(config: UsageTrackerConfig = {}): UsageTrackerService {
    if (!UsageTrackerService.instance) {
      UsageTrackerService.instance = new UsageTrackerService(config);
    }
    return UsageTrackerService.instance;
  }

  /**
   * Initialize the tracker (start flush timer)
   */
  async init(): Promise<void> {
    logger.info('[UsageTracker] Initializing...');

    // Start auto-flush timer
    this.flushTimer = setInterval(() => {
      this.flush().catch((err) => {
        logger.error('[UsageTracker] Flush error', err);
      });
    }, this.flushIntervalMs);

    logger.info('[UsageTracker] Initialized', {
      flushIntervalMs: this.flushIntervalMs,
      flushThreshold: this.flushThreshold,
    });
  }

  /**
   * Record an API call event
   */
  recordApiCall(tenantId: string, endpoint: string, licenseKey?: string): void {
    this.addToBuffer({
      tenantId,
      licenseKey: licenseKey || tenantId,
      eventType: 'api_call',
      endpoint,
      computeMs: 0,
      metadata: { endpoint },
    });
  }

  /**
   * Start a compute timer (for ML inference tracking)
   * Returns a stop function that returns elapsed ms
   */
  startComputeTimer(): ComputeTimer {
    const startTime = Date.now();
    return {
      stop: () => Date.now() - startTime,
    };
  }

  /**
   * Record compute time directly
   */
  recordComputeTime(
    tenantId: string,
    computeMs: number,
    model?: string,
    licenseKey?: string
  ): void {
    this.addToBuffer({
      tenantId,
      licenseKey: licenseKey || tenantId,
      eventType: 'compute_ml',
      endpoint: model ? `ml/${model}` : undefined,
      computeMs,
      metadata: { model: model || 'unknown' },
    });
  }

  /**
   * Record usage with compute timer wrapper
   */
  async recordWithTimer<T>(
    tenantId: string,
    operation: () => Promise<T>,
    model?: string,
    licenseKey?: string
  ): Promise<T> {
    const timer = this.startComputeTimer();

    try {
      return await operation();
    } finally {
      const elapsedMs = timer.stop();
      this.recordComputeTime(tenantId, elapsedMs, model, licenseKey);
    }
  }

  /**
   * Flush buffer to database
   */
  async flush(): Promise<void> {
    if (this.isFlushing || this.buffer.length === 0) {
      return;
    }

    this.isFlushing = true;

    try {
      const eventsToFlush = [...this.buffer];
      this.buffer = [];

      await batchRecordUsageEvents(eventsToFlush);
      logger.debug('[UsageTracker] Flushed events', {
        count: eventsToFlush.length,
      });
    } catch (error) {
      logger.error('[UsageTracker] Flush failed', error);
      // Keep events in buffer for retry on next flush
      // In production, could add to dead letter queue
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Get usage summary for a tenant
   */
  async getUsage(
    tenantId: string,
    period: string
  ): Promise<UsageSummary> {
    // Flush pending events first for accurate count
    await this.flush();

    const dbSummary = await getUsageByPeriod(tenantId, period);

    return {
      tenantId,
      period: dbSummary.period,
      apiCalls: dbSummary.apiCalls,
      computeMinutes: dbSummary.computeMinutes,
    };
  }

  /**
   * Get current buffer length (for monitoring)
   */
  getBufferLength(): number {
    return this.buffer.length;
  }

  /**
   * Close the tracker (stop timer, flush remaining)
   */
  async close(): Promise<void> {
    logger.info('[UsageTracker] Closing...');

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Final flush
    await this.flush();

    logger.info('[UsageTracker] Closed');
  }

  /**
   * Reset for testing
   */
  reset(): void {
    this.buffer = [];
    this.isFlushing = false;
  }

  /**
   * Add event to buffer, trigger flush if threshold reached
   */
  private addToBuffer(event: UsageEventInput): void {
    this.buffer.push(event);

    // Trigger immediate flush if threshold reached
    if (this.buffer.length >= this.flushThreshold && !this.isFlushing) {
      this.flush().catch((err) => {
        logger.error('[UsageTracker] Threshold flush error', err);
      });
    }
  }
}

/**
 * Middleware helper for tracking compute time
 */
export async function trackCompute<T>(
  tracker: UsageTrackerService,
  tenantId: string,
  operation: () => Promise<T>,
  model?: string,
  licenseKey?: string
): Promise<T> {
  return tracker.recordWithTimer(tenantId, operation, model, licenseKey);
}

// Export singleton helper
export const UsageTracker = UsageTrackerService.getInstance();
