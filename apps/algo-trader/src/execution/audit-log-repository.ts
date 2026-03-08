/**
 * Audit Log Repository
 *
 * PostgreSQL append-only storage for SEC/FINRA compliance audit logs.
 * IMMUTABLE: No UPDATE, No DELETE operations allowed.
 *
 * Features:
 * - SHA-256 hash chaining for tamper evidence
 * - Cloudflare R2 backup storage
 * - Daily log rotation
 * - Integrity verification
 */

import { PrismaClient, AuditLog as PrismaAuditLog } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { createHash } from 'crypto';
import { R2Bucket } from '@cloudflare/workers-types';

/**
 * Audit log entry interface matching Prisma schema
 * Enhanced with hash chain fields for tamper evidence
 */
export interface AuditLogEntry {
  id: string;                    // UUID
  eventType: string;             // order_created, order_filled, state_transition, etc.
  tenantId: string;
  orderId?: string;
  userId: string;                // Who triggered the event
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'critical';
  payload: Record<string, unknown>; // Full event data
  ipAddress?: string;
  userAgent?: string;
  // SEC/FINRA compliance fields
  catOrderRef?: string;          // CAT Order Reference
  catEventCategory?: string;     // CAT Event Category (2.0, 2.1, etc.)
  // Additional order context
  symbol?: string;
  side?: string;                 // buy/sell
  amount?: number;
  price?: number;
  // Hash chain fields for tamper evidence
  prevHash?: string;             // SHA-256 of previous log entry
  hash?: string;                 // SHA-256(id + timestamp + action + payload + prevHash)
}

/**
 * Input type for creating new audit log entries
 * Enhanced with hash chain fields
 */
export interface AuditLogInput {
  eventType: string;
  tenantId: string;
  orderId?: string;
  userId: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  payload: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  catOrderRef?: string;
  catEventCategory?: string;
  symbol?: string;
  side?: string;
  amount?: number;
  price?: number;
  // Hash chain fields (computed automatically if not provided)
  prevHash?: string;
  hash?: string;
}

/**
 * Query options for audit log retrieval
 */
export interface AuditLogQuery {
  tenantId?: string;
  orderId?: string;
  userId?: string;
  eventType?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Audit Log Repository - Append-only storage
 *
 * SEC/FINRA compliance requirements:
 * - Immutable: INSERT only, no UPDATE/DELETE
 * - Query by orderId, tenantId, date range
 * - Export capability for long-term archival
 * - SHA-256 hash chain for tamper evidence
 */
export class AuditLogRepository {
  private prisma: PrismaClient;
  private r2Bucket?: R2Bucket;
  private hashChain: Map<string, string>; // tenantId -> lastHash

  constructor(prisma?: PrismaClient, r2Bucket?: R2Bucket) {
    this.prisma = prisma ?? new PrismaClient();
    this.r2Bucket = r2Bucket;
    this.hashChain = new Map();
  }

  /**
   * Compute SHA-256 hash for an entry
   */
  private computeHash(entry: AuditLogInput & { timestamp?: number }): string {
    const data = JSON.stringify({
      eventType: entry.eventType,
      tenantId: entry.tenantId,
      orderId: entry.orderId,
      userId: entry.userId,
      timestamp: entry.timestamp || Date.now(),
      payload: entry.payload,
      prevHash: entry.prevHash || '',
    });
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Get the last hash for a tenant (for hash chain)
   */
  private async getLastHash(tenantId: string): Promise<string | undefined> {
    // Check memory cache first
    if (this.hashChain.has(tenantId)) {
      return this.hashChain.get(tenantId);
    }

    // Fetch from database
    const lastLog = await this.prisma.auditLog.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: { hash: true },
    });

    const hash = lastLog?.hash || undefined;
    if (hash) {
      this.hashChain.set(tenantId, hash);
    }
    return hash;
  }

  /**
   * Insert a new audit log entry (APPEND-ONLY)
   * Computes hash chain for tamper evidence
   * @throws Error if insert fails
   */
  async insert(entry: AuditLogInput): Promise<string> {
    try {
      // Get previous hash for chain
      const prevHash = await this.getLastHash(entry.tenantId);
      const hash = this.computeHash({ ...entry, prevHash });

      const result = await this.prisma.auditLog.create({
        data: {
          eventType: entry.eventType,
          tenantId: entry.tenantId,
          orderId: entry.orderId,
          userId: entry.userId,
          severity: entry.severity,
          payload: entry.payload as object,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          catOrderRef: entry.catOrderRef,
          catEventCategory: entry.catEventCategory,
          symbol: entry.symbol,
          side: entry.side,
          amount: entry.amount !== undefined ? new Decimal(entry.amount) : null,
          price: entry.price !== undefined ? new Decimal(entry.price) : null,
          prevHash: prevHash || null,
          hash: hash,
          createdAt: new Date(),
        },
        select: { id: true },
      });

      // Update hash chain cache
      this.hashChain.set(entry.tenantId, hash);

      // Backup to R2 (async, non-blocking)
      if (this.r2Bucket) {
        const r2Entry: AuditLogEntry = {
          id: result.id,
          eventType: entry.eventType,
          tenantId: entry.tenantId,
          orderId: entry.orderId,
          userId: entry.userId,
          severity: entry.severity,
          payload: entry.payload,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          catOrderRef: entry.catOrderRef,
          catEventCategory: entry.catEventCategory,
          symbol: entry.symbol,
          side: entry.side,
          amount: entry.amount,
          price: entry.price,
          timestamp: new Date(),
          hash,
          prevHash: prevHash || undefined,
        };
        await this.backupToR2(r2Entry, result.id);
      }

      return result.id;
    } catch (error) {
      throw new Error(
        `Failed to insert audit log: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Backup audit log to Cloudflare R2 (daily rotation)
   * Path format: /audit/{year}/{month}/{day}/{id}.jsonl
   */
  private async backupToR2(entry: AuditLogEntry, logId: string): Promise<void> {
    try {
      const now = new Date();
      const path = `/audit/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${logId}.jsonl`;

      const jsonlLine = JSON.stringify({
        id: logId,
        eventType: entry.eventType,
        tenantId: entry.tenantId,
        orderId: entry.orderId,
        userId: entry.userId,
        severity: entry.severity,
        payload: entry.payload,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        hash: entry.hash,
        prevHash: entry.prevHash,
        timestamp: now.toISOString(),
      }) + '\n';

      await this.r2Bucket!.put(path, jsonlLine, {
        httpMetadata: {
          contentType: 'application/jsonl',
        },
        customMetadata: {
          tenantId: entry.tenantId,
          eventType: entry.eventType,
        },
      });
    } catch (error) {
      // Log but don't fail the insert - R2 backup is secondary
      console.error('[AuditLogRepository] R2 backup failed:', error);
    }
  }

  /**
   * Find audit logs by order ID
   * @returns Chronologically sorted audit trail for the order
   */
  async findByOrderId(orderId: string): Promise<AuditLogEntry[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
    return this.mapToAuditLogEntry(logs);
  }

  /**
   * Find audit logs by tenant ID with date range filter
   * @returns Audit logs for the tenant within the specified date range
   */
  async findByTenant(
    tenantId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<AuditLogEntry[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return this.mapToAuditLogEntry(logs);
  }

  /**
   * Find audit logs with flexible query options
   * @returns Filtered and paginated audit logs
   */
  async find(query: AuditLogQuery): Promise<AuditLogEntry[]> {
    const where: Record<string, unknown> = {};

    if (query.tenantId) {
      where.tenantId = query.tenantId;
    }
    if (query.orderId) {
      where.orderId = query.orderId;
    }
    if (query.userId) {
      where.userId = query.userId;
    }
    if (query.eventType) {
      where.eventType = query.eventType;
    }
    if (query.fromDate || query.toDate) {
      where.createdAt = {};
      if (query.fromDate) {
        (where.createdAt as Record<string, Date>).gte = query.fromDate;
      }
      if (query.toDate) {
        (where.createdAt as Record<string, Date>).lte = query.toDate;
      }
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: query.limit ?? 1000,
      skip: query.offset ?? 0,
    });
    return this.mapToAuditLogEntry(logs);
  }

  /**
   * Get count of audit logs matching query (for pagination)
   */
  async count(query: AuditLogQuery): Promise<number> {
    const where: Record<string, unknown> = {};

    if (query.tenantId) {
      where.tenantId = query.tenantId;
    }
    if (query.orderId) {
      where.orderId = query.orderId;
    }
    if (query.userId) {
      where.userId = query.userId;
    }
    if (query.eventType) {
      where.eventType = query.eventType;
    }
    if (query.fromDate || query.toDate) {
      where.createdAt = {};
      if (query.fromDate) {
        (where.createdAt as Record<string, Date>).gte = query.fromDate;
      }
      if (query.toDate) {
        (where.createdAt as Record<string, Date>).lte = query.toDate;
      }
    }

    return this.prisma.auditLog.count({ where });
  }

  /**
   * Get audit logs for export (unlimited, for archival)
   */
  async findForExport(
    tenantId: string,
    fromDate: Date,
    toDate: Date,
    batchSize: number = 10000
  ): Promise<AuditLogEntry[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: { createdAt: 'asc' },
      take: batchSize,
    });
    return this.mapToAuditLogEntry(logs);
  }

  /**
   * Map Prisma results to AuditLogEntry interface
   */
  private mapToAuditLogEntry(logs: PrismaAuditLog[]): AuditLogEntry[] {
    return logs.map((log) => ({
      id: log.id,
      eventType: log.eventType,
      tenantId: log.tenantId,
      orderId: log.orderId ?? undefined,
      userId: log.userId,
      timestamp: log.createdAt,
      severity: log.severity as 'info' | 'warning' | 'error' | 'critical',
      payload: (log.payload as Record<string, unknown>) ?? {},
      ipAddress: log.ipAddress ?? undefined,
      userAgent: log.userAgent ?? undefined,
      catOrderRef: log.catOrderRef ?? undefined,
      catEventCategory: log.catEventCategory ?? undefined,
      symbol: log.symbol ?? undefined,
      side: log.side ?? undefined,
      amount: log.amount ? (log.amount as unknown as Decimal).toNumber() : undefined,
      price: log.price ? (log.price as unknown as Decimal).toNumber() : undefined,
    }));
  }

  /**
   * Verify integrity of audit log hash chain
   * Detects any tampering with historical logs
   * @returns Object with valid status and brokenAt if invalid
   */
  async verifyIntegrity(tenantId?: string): Promise<{ valid: boolean; brokenAt?: string; details?: string }> {
    try {
      // Fetch all logs (optionally filtered by tenant)
      const where = tenantId ? { tenantId } : {};
      const logs = await this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          tenantId: true,
          eventType: true,
          payload: true,
          createdAt: true,
          hash: true,
          prevHash: true,
        },
      });

      if (logs.length === 0) {
        return { valid: true };
      }

      // Verify hash chain
      let expectedPrevHash: string | undefined = undefined;

      for (const log of logs) {
        // Recompute hash
        const recomputedHash = createHash('sha256')
          .update(JSON.stringify({
            id: log.eventType,
            timestamp: log.createdAt.getTime(),
            eventType: log.eventType,
            tenantId: log.tenantId,
            orderId: log.id,
            userId: log.id,
            payload: log.payload,
            prevHash: log.prevHash || '',
          }))
          .digest('hex');

        // Check if hash matches
        if (log.hash !== recomputedHash) {
          return {
            valid: false,
            brokenAt: log.id,
            details: `Hash mismatch at log ${log.id}: expected ${recomputedHash}, got ${log.hash}`,
          };
        }

        // Check if prevHash matches previous entry's hash
        if (expectedPrevHash && log.prevHash !== expectedPrevHash) {
          return {
            valid: false,
            brokenAt: log.id,
            details: `Chain broken at log ${log.id}: expected prevHash ${expectedPrevHash}, got ${log.prevHash}`,
          };
        }

        expectedPrevHash = log.hash;
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        details: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Cleanup: Disconnect Prisma client
   */
  async destroy(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

/**
 * Factory function to create repository instance
 */
export function createAuditLogRepository(prisma?: PrismaClient, r2Bucket?: R2Bucket): AuditLogRepository {
  return new AuditLogRepository(prisma, r2Bucket);
}
