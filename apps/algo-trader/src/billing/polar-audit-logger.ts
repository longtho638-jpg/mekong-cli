/**
 * Polar Audit Logger - Records webhook events for compliance and debugging
 */

export interface AuditLogEntry {
  eventId: string;
  eventType: string;
  tenantId: string | null;
  timestamp: string;
  action: 'activated' | 'updated' | 'deactivated' | 'ignored' | 'refunded';
  success: boolean;
  error?: string;
  idempotencyKey?: string;
}

export class PolarAuditLogger {
  private static instance: PolarAuditLogger;
  private logs: AuditLogEntry[] = [];
  private processedEvents = new Set<string>(); // Idempotency tracking

  static getInstance(): PolarAuditLogger {
    if (!PolarAuditLogger.instance) {
      PolarAuditLogger.instance = new PolarAuditLogger();
    }
    return PolarAuditLogger.instance;
  }

  /**
   * Log webhook event
   */
  log(event: AuditLogEntry): void {
    this.logs.push(event);

    // Console log for dev
    console.log('[Polar Audit]', JSON.stringify({
      event: event.eventType,
      tenantId: event.tenantId,
      action: event.action,
      success: event.success,
      timestamp: event.timestamp,
    }));
  }

  /**
   * Check if event already processed (idempotency)
   */
  isProcessed(eventId: string): boolean {
    return this.processedEvents.has(eventId);
  }

  /**
   * Mark event as processed
   */
  markProcessed(eventId: string): void {
    this.processedEvents.add(eventId);
  }

  /**
   * Log refund alert (special handling)
   */
  logRefund(tenantId: string, subscriptionId: string, amount: number): void {
    this.log({
      eventId: `refund_${subscriptionId}_${Date.now()}`,
      eventType: 'refund.created',
      tenantId,
      timestamp: new Date().toISOString(),
      action: 'refunded',
      success: true,
      idempotencyKey: `refund_${subscriptionId}`,
    });

    console.warn('[Polar Audit] REFUND ALERT', JSON.stringify({
      tenantId,
      subscriptionId,
      amount,
      timestamp: new Date().toISOString(),
    }));
  }

  /**
   * Log order created (one-time purchase)
   */
  logOrder(tenantId: string, orderId: string, productId: string): void {
    this.log({
      eventId: `order_${orderId}`,
      eventType: 'order.created',
      tenantId,
      timestamp: new Date().toISOString(),
      action: 'activated',
      success: true,
      idempotencyKey: `order_${orderId}`,
    });
  }

  /**
   * Get recent logs (for debugging)
   */
  getRecentLogs(limit: number = 50): AuditLogEntry[] {
    return this.logs.slice(-limit);
  }

  /**
   * Reset logs (testing only)
   */
  reset(): void {
    this.logs = [];
    this.processedEvents.clear();
  }
}
