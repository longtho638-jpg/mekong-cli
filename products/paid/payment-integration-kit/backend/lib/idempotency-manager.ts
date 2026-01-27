/**
 * Idempotency Manager for Payment Webhooks
 *
 * Prevents duplicate processing of webhook events by tracking event IDs.
 * Critical for ensuring:
 * - No double-charging customers
 * - No duplicate subscription activations
 * - Compliance with payment processing best practices
 */

interface ProcessedEvent {
  eventId: string;
  eventType: string;
  processedAt: Date;
  status: 'processed' | 'failed';
  metadata?: Record<string, any>;
}

/**
 * In-memory storage for processed events.
 *
 * PRODUCTION NOTE: Replace with persistent storage (Redis, Database)
 * to ensure idempotency across server restarts and load-balanced instances.
 */
class IdempotencyStore {
  private store: Map<string, ProcessedEvent> = new Map();
  private maxAge: number = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

  /**
   * Check if event has been processed
   */
  async hasBeenProcessed(eventId: string): Promise<boolean> {
    const event = this.store.get(eventId);

    if (!event) return false;

    // Check if event is expired
    const age = Date.now() - event.processedAt.getTime();
    if (age > this.maxAge) {
      this.store.delete(eventId);
      return false;
    }

    return true;
  }

  /**
   * Get processed event details
   */
  async getEvent(eventId: string): Promise<ProcessedEvent | null> {
    return this.store.get(eventId) || null;
  }

  /**
   * Mark event as processed
   */
  async markProcessed(
    eventId: string,
    eventType: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    this.store.set(eventId, {
      eventId,
      eventType,
      processedAt: new Date(),
      status: 'processed',
      metadata
    });

    // Cleanup old entries periodically
    this.cleanup();
  }

  /**
   * Mark event as failed
   */
  async markFailed(
    eventId: string,
    eventType: string,
    error: any
  ): Promise<void> {
    this.store.set(eventId, {
      eventId,
      eventType,
      processedAt: new Date(),
      status: 'failed',
      metadata: {
        error: error.message || String(error)
      }
    });
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, event] of this.store.entries()) {
      const age = now - event.processedAt.getTime();
      if (age > this.maxAge) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.store.delete(key));
  }

  /**
   * Get store statistics
   */
  getStats() {
    return {
      totalEvents: this.store.size,
      processed: Array.from(this.store.values()).filter(e => e.status === 'processed').length,
      failed: Array.from(this.store.values()).filter(e => e.status === 'failed').length
    };
  }
}

// Singleton instance
const idempotencyStore = new IdempotencyStore();

/**
 * Idempotency wrapper for webhook handlers
 *
 * Usage:
 * ```typescript
 * await withIdempotency(event.id, event.type, async () => {
 *   // Your handler logic here
 *   await processPayment(payment);
 * });
 * ```
 */
export async function withIdempotency<T>(
  eventId: string,
  eventType: string,
  handler: () => Promise<T>
): Promise<T | null> {
  // Check if already processed
  const alreadyProcessed = await idempotencyStore.hasBeenProcessed(eventId);

  if (alreadyProcessed) {
    const event = await idempotencyStore.getEvent(eventId);
    console.log(`⚠️  Event ${eventId} (${eventType}) already processed at ${event?.processedAt}`);

    // Return null or cached result to indicate duplicate
    return null;
  }

  try {
    // Execute handler
    const result = await handler();

    // Mark as processed
    await idempotencyStore.markProcessed(eventId, eventType, {
      result: typeof result === 'object' ? 'object' : result
    });

    console.log(`✅ Event ${eventId} (${eventType}) processed successfully`);
    return result;
  } catch (error) {
    // Mark as failed
    await idempotencyStore.markFailed(eventId, eventType, error);
    console.error(`❌ Event ${eventId} (${eventType}) processing failed:`, error);
    throw error;
  }
}

/**
 * Get idempotency store stats (for monitoring)
 */
export function getIdempotencyStats() {
  return idempotencyStore.getStats();
}
