// Audit Logger for License Operations - Security Audit Phase 4
// Provides audit trail for license CRUD operations

import type { License, LicenseStatus, LicenseTier } from './license-types'

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  id: string
  timestamp: Date
  action: AuditAction
  entity: AuditEntity
  entityId: string
  details: AuditDetails
}

/**
 * Supported audit actions
 */
export type AuditAction =
  | 'LICENSE_CREATE'
  | 'LICENSE_READ'
  | 'LICENSE_UPDATE'
  | 'LICENSE_DELETE'
  | 'LICENSE_REVOKE'
  | 'SUBSCRIPTION_UPDATE'
  | 'USAGE_ACCESS'

/**
 * Entity types being audited
 */
export type AuditEntity = 'LICENSE' | 'SUBSCRIPTION' | 'USAGE'

/**
 * Audit log details - flexible structure for extensibility
 */
export interface AuditDetails {
  customerId?: string
  customerName?: string
  tier?: LicenseTier
  status?: LicenseStatus
  features?: string[]
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

/**
 * Audit Logger - Singleton pattern for audit trail
 * Currently logs to console, designed for future persistence
 */
class AuditLoggerClass {
  private logs: AuditLogEntry[] = []
  private enabled: boolean = true

  /**
   * Generate unique log ID
   */
  private generateLogId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  }

  /**
   * Core log method - records audit entry
   */
  log(
    action: AuditAction,
    entity: AuditEntity,
    entityId: string,
    details: AuditDetails
  ): AuditLogEntry {
    if (!this.enabled) {
      return null as unknown as AuditLogEntry
    }

    const entry: AuditLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      action,
      entity,
      entityId,
      details,
    }

    this.logs.push(entry)
    this.persist(entry)
    return entry
  }

  /**
   * Log license creation
   */
  logLicenseCreate(license: License): AuditLogEntry {
    return this.log('LICENSE_CREATE', 'LICENSE', license.id, {
      customerId: license.customerId,
      customerName: license.customerName,
      tier: license.tier,
      status: license.status,
      features: license.features,
      metadata: license.metadata,
    })
  }

  /**
   * Log license read/access
   */
  logLicenseRead(licenseId: string, customerId?: string): AuditLogEntry {
    return this.log('LICENSE_READ', 'LICENSE', licenseId, {
      customerId,
    })
  }

  /**
   * Log license update
   */
  logLicenseUpdate(
    licenseId: string,
    changes: Partial<Pick<License, 'status' | 'tier' | 'features'>>
  ): AuditLogEntry {
    return this.log('LICENSE_UPDATE', 'LICENSE', licenseId, {
      ...changes,
    })
  }

  /**
   * Log license deletion
   */
  logLicenseDelete(licenseId: string, customerId?: string): AuditLogEntry {
    return this.log('LICENSE_DELETE', 'LICENSE', licenseId, {
      customerId,
    })
  }

  /**
   * Log license revocation
   */
  logLicenseRevoke(
    licenseId: string,
    customerId?: string,
    reason?: string
  ): AuditLogEntry {
    return this.log('LICENSE_REVOKE', 'LICENSE', licenseId, {
      customerId,
      status: 'revoked',
      metadata: reason ? { reason } : {},
    })
  }

  /**
   * Log subscription update (ROIaaS Phase 3)
   */
  logSubscriptionUpdate(
    licenseId: string,
    subscriptionId: string,
    subscriptionStatus: 'active' | 'cancelled' | 'uncancelled'
  ): AuditLogEntry {
    return this.log('SUBSCRIPTION_UPDATE', 'SUBSCRIPTION', licenseId, {
      subscriptionId,
      subscriptionStatus,
    })
  }

  /**
   * Log usage access (ROIaaS Phase 4)
   */
  logUsageAccess(
    licenseId: string,
    customerId?: string,
    usageType?: string
  ): AuditLogEntry {
    return this.log('USAGE_ACCESS', 'USAGE', licenseId, {
      customerId,
      metadata: usageType ? { usageType } : {},
    })
  }

  /**
   * Persist log entry (currently console, future: database/file)
   */
  private persist(entry: AuditLogEntry): void {
    // Development: Console logging
    // Production: Write to database, file, or external audit service
    console.log('[AUDIT]', this.formatEntry(entry))
  }

  /**
   * Format log entry for output
   */
  private formatEntry(entry: AuditLogEntry): string {
    const timestamp = entry.timestamp.toISOString()
    return `[${timestamp}] ${entry.action} on ${entry.entity}(${entry.entityId}) - ${JSON.stringify(entry.details)}`
  }

  /**
   * Get all logs (for debugging/testing)
   */
  getAll(): AuditLogEntry[] {
    return [...this.logs]
  }

  /**
   * Get logs by entity ID
   */
  getByEntityId(entityId: string): AuditLogEntry[] {
    return this.logs.filter((log) => log.entityId === entityId)
  }

  /**
   * Get logs by action type
   */
  getByAction(action: AuditAction): AuditLogEntry[] {
    return this.logs.filter((log) => log.action === action)
  }

  /**
   * Clear all logs (testing only)
   */
  clear(): void {
    this.logs = []
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }
}

// Singleton instance
export const AuditLogger = new AuditLoggerClass()
