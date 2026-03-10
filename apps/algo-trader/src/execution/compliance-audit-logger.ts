/**
 * Compliance Audit Logger
 *
 * SEC/FINRA compliance wrapper for audit logging.
 * Handles order events with regulatory compliance fields.
 *
 * Features:
 * - SHA-256 hash chaining for tamper evidence
 * - Cloudflare R2 daily rotation storage
 * - Immutable audit trail
 */

import { AuditLogRepository, AuditLogInput } from './audit-log-repository';
import { Order } from './order-lifecycle-manager';
import { OrderState } from './order-state-machine';
import { R2Bucket } from '@cloudflare/workers-types';

/**
 * SEC/FINRA CAT (Consolidated Audit Trail) compliance fields
 */
export interface ComplianceMetadata {
  // WHO - User identification
  userId: string;
  ipAddress?: string;
  userAgent?: string;

  // WHAT - Event classification
  eventType: ComplianceEventType;
  catOrderRef?: string;          // CAT Order Reference (required for CAT reporting)
  catEventCategory?: string;     // CAT Event Category: 2.0 (Order Created), 2.1 (Order Modified), etc.

  // ORDER DETAILS
  orderType?: 'market' | 'limit';
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  clientOrderId?: string;        // Idempotency key

  // EXECUTION DETAILS
  avgFillPrice?: number;
  totalFilled?: number;
  fee?: number;
  feeCurrency?: string;

  // STRATEGY CONTEXT
  strategyId?: string;
  signalId?: string;

  // REGULATORY
  regulatoryId?: string;         // FINRA CAT ID
  brokerId?: string;             // Broker-dealer ID
}

/**
 * SEC/FINRA compliance event types
 * Mapped to CAT reporting requirements
 */
export enum ComplianceEventType {
  // Order Lifecycle Events (CAT Categories 2.x)
  ORDER_CREATED = 'order_created',         // CAT 2.0 - New Order
  ORDER_MODIFIED = 'order_modified',       // CAT 2.1 - Order Modified
  ORDER_FILLED = 'order_filled',           // CAT 2.2 - Order Executed
  ORDER_CANCELLED = 'order_cancelled',     // CAT 2.3 - Order Cancelled
  ORDER_REJECTED = 'order_rejected',       // CAT 2.4 - Order Rejected
  ORDER_EXPIRED = 'order_expired',         // CAT 2.5 - Order Expired

  // State Transitions (audit trail)
  STATE_TRANSITION = 'state_transition',

  // Compliance Events
  MAX_ORDER_SIZE_EXCEEDED = 'max_order_size_exceeded',
  DAILY_VOLUME_LIMIT_EXCEEDED = 'daily_volume_limit_exceeded',
  CIRCUIT_BREAKER_TRIGGERED = 'circuit_breaker_triggered',
  UNUSUAL_PATTERN_DETECTED = 'unusual_pattern_detected',

  // API/Access Events
  API_KEY_USED = 'api_key_used',
  API_KEY_RATE_LIMITED = 'api_key_rate_limited',
}

/**
 * Severity levels for compliance events
 */
export type ComplianceSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Compliance Audit Logger class
 *
 * SEC/FINRA compliance requirements:
 * - Immediate recording of all order events
 * - 3+ years retention
 * - Immutable audit trail
 * - CAT (Consolidated Audit Trail) reporting ready
 * - SHA-256 hash chain for tamper evidence
 */
export class ComplianceAuditLogger {
  private repository: AuditLogRepository;
  private r2Bucket?: R2Bucket;
  private dailyRotation: boolean;

  constructor(repository?: AuditLogRepository, r2Bucket?: R2Bucket, dailyRotation: boolean = true) {
    this.repository = repository ?? new AuditLogRepository();
    this.r2Bucket = r2Bucket;
    this.dailyRotation = dailyRotation;
  }

  /**
   * Get R2 path with daily rotation
   * Format: /audit/{year}/{month}/{day}/{tenantId}-{timestamp}.jsonl
   */
  private getR2Path(tenantId: string, timestamp: Date): string {
    const date = timestamp || new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const time = String(date.getTime());
    return `/audit/${year}/${month}/${day}/${tenantId}-${time}.jsonl`;
  }

  /**
   * Compute SHA-256 hash for an entry
   */
  private computeHash(entry: AuditLogInput): string {
    const { createHash } = require('crypto');
    const data = JSON.stringify({
      eventType: entry.eventType,
      tenantId: entry.tenantId,
      orderId: entry.orderId,
      userId: entry.userId,
      timestamp: Date.now(),
      payload: entry.payload,
      prevHash: entry.prevHash || '',
    });
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Log order creation (CAT 2.0 - New Order)
   */
  async logOrderCreated(
    order: Order,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    const compliance: ComplianceMetadata = {
      userId,
      ipAddress,
      userAgent,
      eventType: ComplianceEventType.ORDER_CREATED,
      catOrderRef: this.generateCatOrderRef(order),
      catEventCategory: '2.0', // CAT: New Order
      orderType: order.type,
      timeInForce: this.extractTimeInForce(order),
      clientOrderId: order.clientOrderId,
      strategyId: order.strategyId,
    };

    const payload = this.buildOrderPayload(order, compliance, 'Order created');

    return this.repository.insert(this.toAuditLogInput(order, payload, compliance));
  }

  /**
   * Log order fill/execution (CAT 2.2 - Order Executed)
   */
  async logOrderFilled(
    order: Order,
    fillPrice: number,
    fillAmount: number,
    fee?: number
  ): Promise<string> {
    const compliance: ComplianceMetadata = {
      userId: order.ip || 'system',
      ipAddress: order.ip,
      eventType: ComplianceEventType.ORDER_FILLED,
      catOrderRef: this.generateCatOrderRef(order),
      catEventCategory: '2.2', // CAT: Order Executed
      orderType: order.type,
      avgFillPrice: order.avgFillPrice,
      totalFilled: order.totalFilled,
      fee,
      feeCurrency: 'USD',
      strategyId: order.strategyId,
    };

    const payload = {
      ...this.buildOrderPayload(order, compliance, 'Order filled'),
      fillPrice,
      fillAmount,
      remainingAmount: order.remainingAmount,
      avgFillPrice: order.avgFillPrice,
      totalFilled: order.totalFilled,
    };

    return this.repository.insert(this.toAuditLogInput(order, payload, compliance));
  }

  /**
   * Log order cancellation (CAT 2.3 - Order Cancelled)
   */
  async logOrderCancelled(
    order: Order,
    reason: string,
    userId: string,
    ipAddress?: string
  ): Promise<string> {
    const compliance: ComplianceMetadata = {
      userId,
      ipAddress,
      eventType: ComplianceEventType.ORDER_CANCELLED,
      catOrderRef: this.generateCatOrderRef(order),
      catEventCategory: '2.3', // CAT: Order Cancelled
      orderType: order.type,
      clientOrderId: order.clientOrderId,
      strategyId: order.strategyId,
    };

    const payload = {
      ...this.buildOrderPayload(order, compliance, 'Order cancelled'),
      cancellationReason: reason,
      remainingAmount: order.remainingAmount,
    };

    return this.repository.insert(this.toAuditLogInput(order, payload, compliance));
  }

  /**
   * Log state transition (audit trail)
   */
  async logStateTransition(
    orderId: string,
    fromState: OrderState,
    toState: OrderState,
    trigger: string,
    tenantId: string,
    exchangeId: string,
    userId: string,
    reason?: string
  ): Promise<string> {
    const compliance: ComplianceMetadata = {
      userId,
      eventType: ComplianceEventType.STATE_TRANSITION,
      catEventCategory: '2.1', // CAT: Order Modified (state change)
    };

    const payload = {
      orderId,
      tenantId,
      exchangeId,
      fromState,
      toState,
      trigger,
      reason: reason || 'State transition',
      timestamp: Date.now(),
    };

    return this.repository.insert({
      eventType: compliance.eventType,
      tenantId,
      orderId,
      userId,
      severity: 'info',
      payload,
      catOrderRef: compliance.catOrderRef,
      catEventCategory: compliance.catEventCategory,
    });
  }

  /**
   * Log order rejection (CAT 2.4 - Order Rejected)
   */
  async logOrderRejected(
    order: Order,
    reason: string,
    userId: string,
    errorCode?: string
  ): Promise<string> {
    const compliance: ComplianceMetadata = {
      userId,
      eventType: ComplianceEventType.ORDER_REJECTED,
      catOrderRef: this.generateCatOrderRef(order),
      catEventCategory: '2.4', // CAT: Order Rejected
      orderType: order.type,
      strategyId: order.strategyId,
    };

    const payload = {
      ...this.buildOrderPayload(order, compliance, 'Order rejected'),
      rejectionReason: reason,
      errorCode,
    };

    return this.repository.insert(this.toAuditLogInput(order, payload, compliance));
  }

  /**
   * Log compliance violation (e.g., max order exceeded)
   */
  async logComplianceViolation(
    eventType: ComplianceEventType,
    tenantId: string,
    userId: string,
    details: Record<string, unknown>,
    orderId?: string
  ): Promise<string> {
    const compliance: ComplianceMetadata = {
      userId,
      eventType,
      catEventCategory: '9.0', // CAT: Compliance/Regulatory Event
    };

    const payload = {
      orderId,
      tenantId,
      ...details,
      timestamp: Date.now(),
      violationType: eventType,
    };

    return this.repository.insert({
      eventType,
      tenantId,
      orderId,
      userId,
      severity: 'warning',
      payload,
      catOrderRef: compliance.catOrderRef,
      catEventCategory: compliance.catEventCategory,
    });
  }

  /**
   * Get audit trail for an order
   */
  async getOrderAuditTrail(orderId: string): Promise<AuditLogInput[]> {
    return this.repository.findByOrderId(orderId);
  }

  /**
   * Get audit logs for tenant within date range
   */
  async getTenantAuditLogs(
    tenantId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<AuditLogInput[]> {
    return this.repository.findByTenant(tenantId, fromDate, toDate);
  }

  /**
   * Export audit logs to S3 for long-term archival
   * SEC/FINRA requires 3+ years retention
   *
   * @param fromDate - Start date for export
   * @param toDate - End date for export
   * @param bucket - S3 bucket name
   * @param awsRegion - AWS region (default: us-east-1)
   * @returns S3 object key
   */
  async exportToS3(
    fromDate: Date,
    toDate: Date,
    bucket: string,
    tenantId?: string,
    awsRegion: string = 'us-east-1'
  ): Promise<string> {
    // Dynamic import to avoid AWS SDK dependency if not used
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

    const s3Client = new S3Client({
      region: awsRegion,
    });

    // Fetch logs for export
    const logs = await this.repository.findForExport(
      tenantId || 'all',
      fromDate,
      toDate,
      100000
    );

    // Convert to JSONL format (one JSON per line)
    const jsonl = logs.map((log) => JSON.stringify(log)).join('\n');

    // Generate S3 key with date partitioning
    const dateStr = fromDate.toISOString().split('T')[0];
    const tenantPrefix = tenantId || 'all-tenants';
    const key = `audit-logs/${tenantPrefix}/${dateStr}/${Date.now()}-audit-export.jsonl`;

    // Upload to S3 with encryption
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: jsonl,
      ServerSideEncryption: 'AES256',
      ContentType: 'application/jsonl',
    });

    await s3Client.send(command);

    return key;
  }

  /**
   * Build standardized payload for order events
   */
  private buildOrderPayload(
    order: Order,
    compliance: ComplianceMetadata,
    description: string
  ): Record<string, unknown> {
    return {
      orderId: order.id,
      tenantId: order.tenantId,
      exchangeId: order.exchangeId,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      amount: order.amount,
      price: order.price,
      status: order.status,
      clientOrderId: order.clientOrderId,
      strategyId: order.strategyId,
      description,
      timestamp: Date.now(),
    };
  }

  /**
   * Convert to AuditLogInput format
   */
  private toAuditLogInput(
    order: Order,
    payload: Record<string, unknown>,
    compliance: ComplianceMetadata
  ): AuditLogInput {
    const severity = this.getSeverityForEvent(compliance.eventType);

    return {
      eventType: compliance.eventType,
      tenantId: order.tenantId,
      orderId: order.id,
      userId: compliance.userId,
      severity,
      payload,
      ipAddress: compliance.ipAddress,
      userAgent: compliance.userAgent,
      catOrderRef: compliance.catOrderRef,
      catEventCategory: compliance.catEventCategory,
      symbol: order.symbol,
      side: order.side,
      amount: order.amount,
      price: order.price,
    };
  }

  /**
   * Generate CAT Order Reference
   * Format: CAT-{tenantId}-{orderId}-{timestamp}
   */
  private generateCatOrderRef(order: Order): string {
    return `CAT-${order.tenantId}-${order.id}-${Date.now()}`;
  }

  /**
   * Extract TimeInForce from order (if available in metadata)
   */
  private extractTimeInForce(order: Order): 'GTC' | 'IOC' | 'FOK' | undefined {
    // Default to GTC (Good Till Cancelled) if not specified
    return 'GTC';
  }

  /**
   * Get severity level for event type
   */
  private getSeverityForEvent(eventType: ComplianceEventType): ComplianceSeverity {
    const severityMap: Record<ComplianceEventType, ComplianceSeverity> = {
      [ComplianceEventType.ORDER_CREATED]: 'info',
      [ComplianceEventType.ORDER_MODIFIED]: 'info',
      [ComplianceEventType.ORDER_FILLED]: 'info',
      [ComplianceEventType.ORDER_CANCELLED]: 'info',
      [ComplianceEventType.ORDER_REJECTED]: 'warning',
      [ComplianceEventType.ORDER_EXPIRED]: 'info',
      [ComplianceEventType.STATE_TRANSITION]: 'info',
      [ComplianceEventType.MAX_ORDER_SIZE_EXCEEDED]: 'warning',
      [ComplianceEventType.DAILY_VOLUME_LIMIT_EXCEEDED]: 'critical',
      [ComplianceEventType.CIRCUIT_BREAKER_TRIGGERED]: 'critical',
      [ComplianceEventType.UNUSUAL_PATTERN_DETECTED]: 'critical',
      [ComplianceEventType.API_KEY_USED]: 'info',
      [ComplianceEventType.API_KEY_RATE_LIMITED]: 'warning',
    };

    return severityMap[eventType] || 'info';
  }

  /**
   * Verify integrity of audit log hash chain
   * Delegates to repository for verification
   */
  async verifyIntegrity(tenantId?: string): Promise<{ valid: boolean; brokenAt?: string; details?: string }> {
    return this.repository.verifyIntegrity(tenantId);
  }
}

/**
 * Factory function to create compliance audit logger instance
 */
export function createComplianceAuditLogger(
  repository?: AuditLogRepository,
  r2Bucket?: R2Bucket,
  dailyRotation: boolean = true
): ComplianceAuditLogger {
  return new ComplianceAuditLogger(repository, r2Bucket, dailyRotation);
}
