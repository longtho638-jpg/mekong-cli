/**
 * Audit Logger
 *
 * Logs trade executions, API key usage, and detects unusual patterns
 * for compliance, debugging, and security monitoring.
 */

import { logger } from '../utils/logger';

export enum AuditEventType {
  TRADE_EXECUTED = 'TRADE_EXECUTED',
  TRADE_CANCELLED = 'TRADE_CANCELLED',
  TRADE_FAILED = 'TRADE_FAILED',
  API_KEY_USED = 'API_KEY_USED',
  API_KEY_RATE_LIMITED = 'API_KEY_RATE_LIMITED',
  UNUSUAL_PATTERN_DETECTED = 'UNUSUAL_PATTERN_DETECTED',
  CIRCUIT_BREAKER_TRIGGERED = 'CIRCUIT_BREAKER_TRIGGERED',
  MAX_ORDER_SIZE_EXCEEDED = 'MAX_ORDER_SIZE_EXCEEDED',
  DAILY_VOLUME_LIMIT_EXCEEDED = 'DAILY_VOLUME_LIMIT_EXCEEDED',
}

export enum SeverityLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export interface AuditEvent {
  id: string;
  eventType: AuditEventType;
  severity: SeverityLevel;
  timestamp: number;
  tenantId: string;
  exchangeId: string;
  symbol?: string;
  side?: 'buy' | 'sell';
  amount?: number;
  price?: number;
  orderId?: string;
  metadata?: Record<string, unknown>;
}

export interface TradeExecutionMetadata {
  strategyId?: string;
  signalId?: string;
  arbitrageRoundId?: string;
  slippagePercent?: number;
  feePercent?: number;
}

export interface UnusualPatternMetadata {
  patternType: 'VOLUME_SPIKE' | 'PRICE_DEVIATION' | 'RAPID_TRADING' | 'LARGE_ORDER';
  currentValue: number;
  baselineValue: number;
  deviationPercent: number;
  threshold: number;
}

/**
 * Audit Logger class for tracking all trading activities
 */
export class AuditLogger {
  private eventBuffer: AuditEvent[] = [];
  private readonly maxBufferSize = 1000;

  constructor(
    private tenantId: string,
    private exchangeId: string,
    private webhookUrl?: string
  ) {}

  /**
   * Log trade execution
   */
  logTradeExecution(
    order: { id: string; symbol: string; side: string; amount: number; price?: number },
    metadata?: TradeExecutionMetadata
  ): AuditEvent {
    const event: AuditEvent = {
      id: this.generateEventId(),
      eventType: AuditEventType.TRADE_EXECUTED,
      severity: SeverityLevel.INFO,
      timestamp: Date.now(),
      tenantId: this.tenantId,
      exchangeId: this.exchangeId,
      symbol: order.symbol,
      side: order.side as 'buy' | 'sell',
      amount: order.amount,
      price: order.price,
      orderId: order.id,
      metadata: metadata as Record<string, unknown>,
    };

    this.bufferEvent(event);
    this.persistEvent(event);

    return event;
  }

  /**
   * Log trade cancellation
   */
  logTradeCancellation(
    orderId: string,
    symbol: string,
    reason: string
  ): AuditEvent {
    const event: AuditEvent = {
      id: this.generateEventId(),
      eventType: AuditEventType.TRADE_CANCELLED,
      severity: SeverityLevel.INFO,
      timestamp: Date.now(),
      tenantId: this.tenantId,
      exchangeId: this.exchangeId,
      symbol,
      orderId,
      metadata: { reason },
    };

    this.bufferEvent(event);
    this.persistEvent(event);

    return event;
  }

  /**
   * Log trade failure
   */
  logTradeFailure(
    symbol: string,
    side: string,
    amount: number,
    error: string
  ): AuditEvent {
    const event: AuditEvent = {
      id: this.generateEventId(),
      eventType: AuditEventType.TRADE_FAILED,
      severity: SeverityLevel.WARNING,
      timestamp: Date.now(),
      tenantId: this.tenantId,
      exchangeId: this.exchangeId,
      symbol,
      side: side as 'buy' | 'sell',
      amount,
      metadata: { error },
    };

    this.bufferEvent(event);
    this.persistEvent(event);

    return event;
  }

  /**
   * Log API key usage
   */
  logApiKeyUsage(action: string, endpoint?: string): AuditEvent {
    const event: AuditEvent = {
      id: this.generateEventId(),
      eventType: AuditEventType.API_KEY_USED,
      severity: SeverityLevel.INFO,
      timestamp: Date.now(),
      tenantId: this.tenantId,
      exchangeId: this.exchangeId,
      metadata: { action, endpoint },
    };

    this.bufferEvent(event);
    this.persistEvent(event);

    return event;
  }

  /**
   * Alert on unusual trading patterns
   */
  alertOnUnusualPattern(
    pattern: UnusualPatternMetadata,
    additionalMetadata?: Record<string, unknown>
  ): AuditEvent {
    const event: AuditEvent = {
      id: this.generateEventId(),
      eventType: AuditEventType.UNUSUAL_PATTERN_DETECTED,
      severity: SeverityLevel.CRITICAL,
      timestamp: Date.now(),
      tenantId: this.tenantId,
      exchangeId: this.exchangeId,
      metadata: {
        pattern,
        ...additionalMetadata,
      },
    };

    this.bufferEvent(event);
    this.persistEvent(event);
    this.sendAlert(event);

    return event;
  }

  /**
   * Log circuit breaker trigger
   */
  logCircuitBreakerTriggered(
    reason: string,
    failureCount: number,
    timeoutMs: number
  ): AuditEvent {
    const event: AuditEvent = {
      id: this.generateEventId(),
      eventType: AuditEventType.CIRCUIT_BREAKER_TRIGGERED,
      severity: SeverityLevel.WARNING,
      timestamp: Date.now(),
      tenantId: this.tenantId,
      exchangeId: this.exchangeId,
      metadata: { reason, failureCount, timeoutMs },
    };

    this.bufferEvent(event);
    this.persistEvent(event);

    return event;
  }

  /**
   * Log max order size exceeded
   */
  logMaxOrderSizeExceeded(
    symbol: string,
    side: string,
    requestedAmount: number,
    maxAllowed: number
  ): AuditEvent {
    const event: AuditEvent = {
      id: this.generateEventId(),
      eventType: AuditEventType.MAX_ORDER_SIZE_EXCEEDED,
      severity: SeverityLevel.WARNING,
      timestamp: Date.now(),
      tenantId: this.tenantId,
      exchangeId: this.exchangeId,
      symbol,
      side: side as 'buy' | 'sell',
      metadata: { requestedAmount, maxAllowed },
    };

    this.bufferEvent(event);
    this.persistEvent(event);

    return event;
  }

  /**
   * Log daily volume limit exceeded
   */
  logDailyVolumeLimitExceeded(
    currentVolume: number,
    limit: number,
    period: string
  ): AuditEvent {
    const event: AuditEvent = {
      id: this.generateEventId(),
      eventType: AuditEventType.DAILY_VOLUME_LIMIT_EXCEEDED,
      severity: SeverityLevel.CRITICAL,
      timestamp: Date.now(),
      tenantId: this.tenantId,
      exchangeId: this.exchangeId,
      metadata: { currentVolume, limit, period },
    };

    this.bufferEvent(event);
    this.persistEvent(event);

    return event;
  }

  /**
   * Get recent events from buffer
   */
  getRecentEvents(limit: number = 100): AuditEvent[] {
    return this.eventBuffer.slice(-limit);
  }

  /**
   * Clear event buffer
   */
  clearBuffer(): void {
    this.eventBuffer = [];
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `audit_${this.tenantId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Buffer event in memory
   */
  private bufferEvent(event: AuditEvent): void {
    this.eventBuffer.push(event);

    // Rotate buffer if exceeds max size
    if (this.eventBuffer.length > this.maxBufferSize) {
      this.eventBuffer = this.eventBuffer.slice(-this.maxBufferSize);
    }
  }

  /**
   * Persist event to log
   */
  private persistEvent(event: AuditEvent): void {
    const logEntry = {
      level: event.severity,
      event: event.eventType,
      tenantId: event.tenantId,
      exchangeId: event.exchangeId,
      timestamp: new Date(event.timestamp).toISOString(),
      ...event.metadata,
    };

    switch (event.severity) {
      case SeverityLevel.CRITICAL:
        logger.error('[AUDIT-CRITICAL]', logEntry);
        break;
      case SeverityLevel.WARNING:
        logger.warn('[AUDIT-WARNING]', logEntry);
        break;
      default:
        logger.info('[AUDIT-INFO]', logEntry);
    }
  }

  /**
   * Send alert to webhook
   */
  private async sendAlert(event: AuditEvent): Promise<void> {
    if (!this.webhookUrl) {
      return;
    }

    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertType: 'UNUSUAL_PATTERN',
          severity: event.severity,
          tenantId: event.tenantId,
          exchangeId: event.exchangeId,
          timestamp: event.timestamp,
          ...event.metadata,
        }),
      });
    } catch (error) {
      logger.error('[AUDIT-WEBHOOK]', {
        error: error instanceof Error ? error.message : 'Unknown error',
        eventId: event.id,
      });
    }
  }
}

/**
 * Factory function to create audit logger instance
 */
export function createAuditLogger(
  tenantId: string,
  exchangeId: string,
  webhookUrl?: string
): AuditLogger {
  return new AuditLogger(tenantId, exchangeId, webhookUrl);
}
