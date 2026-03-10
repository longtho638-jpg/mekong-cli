/**
 * Unified Webhook Audit Logger - Records Stripe + Polar webhook events for compliance and debugging
 *
 * Features:
 * - Unified audit logging for multiple payment providers
 * - Idempotency store (in-memory Map)
 * - Error tracking with alert threshold
 * - Structured logging for compliance
 */

export type WebhookProvider = 'stripe' | 'polar';
export type WebhookStatus = 'success' | 'error' | 'ignored' | 'pending';

export interface WebhookAuditLogEntry {
  eventId: string;
  provider: WebhookProvider;
  eventType: string;
  tenantId: string | null;
  timestamp: string;
  status: WebhookStatus;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface WebhookAuditConfig {
  /** Alert threshold for error count (default: 10) */
  errorAlertThreshold?: number;
  /** Max logs to keep in memory (default: 1000) */
  maxLogs?: number;
}

export class WebhookAuditLogger {
  private static instance: WebhookAuditLogger;
  private logs: WebhookAuditLogEntry[] = [];
  private idempotencyStore = new Map<string, WebhookAuditLogEntry>();
  private errorCount = 0;
  private config: Required<WebhookAuditConfig>;

  private constructor(config?: WebhookAuditConfig) {
    this.config = {
      errorAlertThreshold: config?.errorAlertThreshold ?? 10,
      maxLogs: config?.maxLogs ?? 1000,
    };
  }

  static getInstance(config?: WebhookAuditConfig): WebhookAuditLogger {
    if (!WebhookAuditLogger.instance) {
      WebhookAuditLogger.instance = new WebhookAuditLogger(config);
    }
    return WebhookAuditLogger.instance;
  }

  /**
   * Log webhook event with unified format
   */
  logEvent(
    eventId: string,
    type: string,
    status: WebhookStatus,
    metadata: {
      provider: WebhookProvider;
      tenantId?: string | null;
      success?: boolean;
      error?: string;
      idempotencyKey?: string;
      extra?: Record<string, unknown>;
    },
  ): void {
    const entry: WebhookAuditLogEntry = {
      eventId,
      provider: metadata.provider,
      eventType: type,
      tenantId: metadata.tenantId ?? null,
      timestamp: new Date().toISOString(),
      status,
      success: metadata.success ?? (status === 'success'),
      error: metadata.error,
      idempotencyKey: metadata.idempotencyKey || eventId,
      metadata: metadata.extra,
    };

    // Store in idempotency store
    if (entry.idempotencyKey) {
      this.idempotencyStore.set(entry.idempotencyKey, entry);
    }

    // Track errors
    if (!entry.success || status === 'error') {
      this.errorCount++;
    }

    // Add to logs array with size limit
    this.logs.push(entry);
    if (this.logs.length > this.config.maxLogs) {
      this.logs.shift(); // Remove oldest
    }

    // Console log for dev/debugging
    console.log('[WebhookAudit]', JSON.stringify({
      provider: entry.provider,
      event: entry.eventType,
      tenantId: entry.tenantId,
      status: entry.status,
      success: entry.success,
      timestamp: entry.timestamp,
    }));
  }

  /**
   * Check if event already processed (idempotency check)
   */
  isDuplicate(eventId: string): boolean {
    return this.idempotencyStore.has(eventId);
  }

  /**
   * Get entry from idempotency store
   */
  getEntry(eventId: string): WebhookAuditLogEntry | undefined {
    return this.idempotencyStore.get(eventId);
  }

  /**
   * Get total error count
   */
  getErrorCount(): number {
    return this.errorCount;
  }

  /**
   * Check if should alert based on error threshold
   */
  shouldAlert(): boolean {
    return this.errorCount >= this.config.errorAlertThreshold;
  }

  /**
   * Get recent logs (for debugging)
   */
  getRecentLogs(limit: number = 50): WebhookAuditLogEntry[] {
    return this.logs.slice(-limit);
  }

  /**
   * Get logs by provider
   */
  getLogsByProvider(provider: WebhookProvider, limit: number = 50): WebhookAuditLogEntry[] {
    return this.logs
      .filter(log => log.provider === provider)
      .slice(-limit);
  }

  /**
   * Get error logs
   */
  getErrorLogs(limit: number = 50): WebhookAuditLogEntry[] {
    return this.logs
      .filter(log => !log.success || log.status === 'error')
      .slice(-limit);
  }

  /**
   * Reset error count (after alert handled)
   */
  resetErrorCount(): void {
    this.errorCount = 0;
  }

  /**
   * Reset all logs (testing only)
   */
  reset(): void {
    this.logs = [];
    this.idempotencyStore.clear();
    this.errorCount = 0;
  }

  /**
   * Get stats summary
   */
  getStats(): {
    totalLogs: number;
    errorCount: number;
    idempotencyStoreSize: number;
    shouldAlert: boolean;
    providerCounts: Record<WebhookProvider, number>;
  } {
    const providerCounts = {
      stripe: this.logs.filter(log => log.provider === 'stripe').length,
      polar: this.logs.filter(log => log.provider === 'polar').length,
    };

    return {
      totalLogs: this.logs.length,
      errorCount: this.errorCount,
      idempotencyStoreSize: this.idempotencyStore.size,
      shouldAlert: this.shouldAlert(),
      providerCounts,
    };
  }
}
