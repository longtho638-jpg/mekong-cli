/**
 * RAAS Audit Logger — License & Usage Event Tracking
 *
 * Logs all license-related events for compliance and monitoring.
 * Outputs JSON-formatted logs for SIEM integration.
 */

export interface AuditEvent {
  eventId: string;
  eventType: 'license_check' | 'license_granted' | 'license_denied' | 'feature_access' | 'rate_limit_exceeded';
  timestamp: string;
  licenseKey?: string;
  tier?: string;
  feature?: string;
  clientId?: string;
  success: boolean;
  reason?: string;
}

export class RaasAuditLogger {
  private static instance: RaasAuditLogger;
  private logBuffer: AuditEvent[] = [];
  private readonly MAX_BUFFER_SIZE = 100;
  private readonly logStream?: NodeJS.WritableStream;

  private constructor() {
    // In production: initialize file/Winston/SIEM stream
    // For now: console.log with JSON format
  }

  static getInstance(): RaasAuditLogger {
    if (!RaasAuditLogger.instance) {
      RaasAuditLogger.instance = new RaasAuditLogger();
    }
    return RaasAuditLogger.instance;
  }

  /**
   * Log audit event
   */
  log(event: Omit<AuditEvent, 'eventId' | 'timestamp'>): void {
    const auditEvent: AuditEvent = {
      ...event,
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
    };

    // Output JSON log (SIEM-compatible)
    console.log('[RAAS-AUDIT]', JSON.stringify(auditEvent));

    // Buffer for batch export
    this.logBuffer.push(auditEvent);
    if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
      this.flush();
    }
  }

  /**
   * Log license check
   */
  logLicenseCheck(clientId: string, tier: string, success: boolean): void {
    this.log({
      eventType: 'license_check',
      clientId,
      tier,
      success,
    });
  }

  /**
   * Log license granted
   */
  logLicenseGranted(clientId: string, tier: string, features: string[]): void {
    this.log({
      eventType: 'license_granted',
      clientId,
      tier,
      success: true,
      feature: features.join(','),
    });
  }

  /**
   * Log license denied
   */
  logLicenseDenied(clientId: string, requiredTier: string, feature: string, reason: string): void {
    this.log({
      eventType: 'license_denied',
      clientId,
      tier: requiredTier,
      feature,
      success: false,
      reason,
    });
  }

  /**
   * Log feature access
   */
  logFeatureAccess(clientId: string, feature: string, tier: string, success: boolean): void {
    this.log({
      eventType: 'feature_access',
      clientId,
      feature,
      tier,
      success,
    });
  }

  /**
   * Log rate limit exceeded
   */
  logRateLimitExceeded(clientId: string, attempts: number): void {
    this.log({
      eventType: 'rate_limit_exceeded',
      clientId,
      success: false,
      reason: `Max validation attempts exceeded (${attempts})`,
    });
  }

  /**
   * Flush buffer (for batch export to S3/SIEM)
   */
  flush(): AuditEvent[] {
    const events = [...this.logBuffer];
    this.logBuffer = [];
    return events;
  }

  /**
   * Get recent events (for debugging)
   */
  getRecentEvents(limit = 10): AuditEvent[] {
    return this.logBuffer.slice(-limit);
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

// Convenience export
export const auditLogger = RaasAuditLogger.getInstance();
