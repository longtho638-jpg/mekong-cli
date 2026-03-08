/**
 * Dunning State Machine — Manages subscription dunning lifecycle
 *
 * State transitions:
 * - ACTIVE → payment_failed → GRACE_PERIOD (start grace timer)
 * - GRACE_PERIOD → payment_recovered → ACTIVE
 * - GRACE_PERIOD → timeout → SUSPENDED (block API access)
 * - SUSPENDED → payment_recovered → ACTIVE
 * - SUSPENDED → timeout → REVOKED (data scheduled for deletion)
 *
 * Environment variables:
 * - DUNNING_GRACE_PERIOD_DAYS: Days in grace period before suspension (default: 7)
 * - DUNNING_SUSPENSION_DAYS: Days in suspension before revocation (default: 14)
 * - DUNNING_REVOCATION_DAYS: Days after revocation before data deletion (default: 30)
 */

import { PrismaClient, DunningStatus } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface DunningConfig {
  gracePeriodDays: number;
  suspensionDays: number;
  revocationDays: number;
}

interface DunningStateResult {
  tenantId: string;
  status: DunningStatus;
  failedPayments: number;
  gracePeriodEndsAt?: Date;
  suspendedAt?: Date;
  revokedAt?: Date;
  canRecover: boolean;
}

export class DunningStateMachine {
  private static instance: DunningStateMachine;
  private config: DunningConfig;

  private constructor() {
    this.config = {
      gracePeriodDays: parseInt(process.env.DUNNING_GRACE_PERIOD_DAYS || '7', 10),
      suspensionDays: parseInt(process.env.DUNNING_SUSPENSION_DAYS || '14', 10),
      revocationDays: parseInt(process.env.DUNNING_REVOCATION_DAYS || '30', 10),
    };
  }

  static getInstance(): DunningStateMachine {
    if (!DunningStateMachine.instance) {
      DunningStateMachine.instance = new DunningStateMachine();
    }
    return DunningStateMachine.instance;
  }

  /**
   * Handle payment failure event
   * Transitions: ACTIVE → GRACE_PERIOD, or increment failed payment count
   */
  async onPaymentFailed(
    tenantId: string,
    options?: { amount?: number; currency?: string; invoiceId?: string }
  ): Promise<DunningStateResult> {
    const now = new Date();

    const state = await prisma.dunningState.upsert({
      where: { tenantId },
      create: {
        tenantId,
        status: DunningStatus.GRACE_PERIOD,
        failedPayments: 1,
        lastPaymentFailedAt: now,
      },
      update: {
        failedPayments: { increment: 1 },
        lastPaymentFailedAt: now,
        status: DunningStatus.GRACE_PERIOD,
      },
    });

    // Log dunning event
    await this.logEvent(tenantId, 'payment_failed', 'warning', {
      failedPaymentCount: state.failedPayments,
      gracePeriodDays: this.config.gracePeriodDays,
      gracePeriodEndsAt: this.calculateGracePeriodEnd(state),
      ...options,
    });

    logger.warn(`[Dunning] Payment failed for tenant ${tenantId}`, {
      status: state.status,
      failedPayments: state.failedPayments,
      gracePeriodDays: this.config.gracePeriodDays,
    });

    return this.toResult(state);
  }

  /**
   * Handle payment recovery event
   * Transitions: GRACE_PERIOD/SUSPENDED → ACTIVE
   */
  async onPaymentRecovered(
    tenantId: string,
    options?: { amount?: number; currency?: string; invoiceId?: string }
  ): Promise<DunningStateResult> {
    const state = await prisma.dunningState.update({
      where: { tenantId },
      data: {
        status: DunningStatus.ACTIVE,
        failedPayments: 0,
        lastPaymentRecoveredAt: new Date(),
        suspendedAt: null,
      },
    });

    await this.logEvent(tenantId, 'payment_recovered', 'info', {
      previousFailedPayments: state.failedPayments,
      ...options,
    });

    logger.info(`[Dunning] Payment recovered for tenant ${tenantId}`, {
      status: state.status,
    });

    return this.toResult(state);
  }

  /**
   * Check and process grace period timeouts
   * Call this periodically (e.g., daily cron job)
   * Transitions: GRACE_PERIOD → SUSPENDED
   */
  async processGracePeriodTimeouts(): Promise<{ processed: number; tenantIds: string[] }> {
    const gracePeriodEnd = this.getGracePeriodCutoff();

    const statesToUpdate = await prisma.dunningState.findMany({
      where: {
        status: DunningStatus.GRACE_PERIOD,
        lastPaymentFailedAt: {
          lt: gracePeriodEnd,
        },
      },
    });

    const tenantIds: string[] = [];

    for (const state of statesToUpdate) {
      await this.suspendAccount(state.tenantId);
      tenantIds.push(state.tenantId);
    }

    return { processed: statesToUpdate.length, tenantIds };
  }

  /**
   * Suspend account after grace period expires
   */
  async suspendAccount(tenantId: string): Promise<DunningStateResult> {
    const state = await prisma.dunningState.update({
      where: { tenantId },
      data: {
        status: DunningStatus.SUSPENDED,
        suspendedAt: new Date(),
      },
    });

    await this.logEvent(tenantId, 'suspended', 'critical', {
      failedPayments: state.failedPayments,
      gracePeriodDays: this.config.gracePeriodDays,
    });

    logger.warn(`[Dunning] Account suspended for tenant ${tenantId}`);

    return this.toResult(state);
  }

  /**
   * Revoke account after suspension period expires
   * Call this periodically (e.g., weekly cron job)
   * Transitions: SUSPENDED → REVOKED
   */
  async processSuspensionTimeouts(): Promise<{ processed: number; tenantIds: string[] }> {
    const suspensionEnd = this.getSuspensionCutoff();

    const statesToUpdate = await prisma.dunningState.findMany({
      where: {
        status: DunningStatus.SUSPENDED,
        suspendedAt: {
          lt: suspensionEnd,
        },
      },
    });

    const tenantIds: string[] = [];

    for (const state of statesToUpdate) {
      await this.revokeAccount(state.tenantId);
      tenantIds.push(state.tenantId);
    }

    return { processed: statesToUpdate.length, tenantIds };
  }

  /**
   * Revoke account (final stage before deletion)
   */
  async revokeAccount(tenantId: string): Promise<DunningStateResult> {
    const state = await prisma.dunningState.update({
      where: { tenantId },
      data: {
        status: DunningStatus.REVOKED,
        revokedAt: new Date(),
      },
    });

    await this.logEvent(tenantId, 'revoked', 'critical', {
      failedPayments: state.failedPayments,
      totalDaysInDunning: this.config.gracePeriodDays + this.config.suspensionDays,
    });

    logger.error(`[Dunning] Account revoked for tenant ${tenantId}`);

    return this.toResult(state);
  }

  /**
   * Get current dunning state for a tenant
   */
  async getStatus(tenantId: string): Promise<DunningStateResult | null> {
    const state = await prisma.dunningState.findUnique({
      where: { tenantId },
    });

    if (!state) {
      return null;
    }

    return this.toResult(state);
  }

  /**
   * Check if account is in good standing (ACTIVE status)
   */
  async isActive(tenantId: string): Promise<boolean> {
    const state = await prisma.dunningState.findUnique({
      where: { tenantId },
      select: { status: true },
    });

    return state?.status === DunningStatus.ACTIVE;
  }

  /**
   * Check if account should be blocked (SUSPENDED or REVOKED)
   */
  async isBlocked(tenantId: string): Promise<boolean> {
    const state = await prisma.dunningState.findUnique({
      where: { tenantId },
      select: { status: true },
    });

    return state?.status === DunningStatus.SUSPENDED || state?.status === DunningStatus.REVOKED;
  }

  /**
   * Get all accounts in dunning (GRACE_PERIOD or SUSPENDED)
   */
  async getAccountsInDunning(): Promise<DunningStateResult[]> {
    const states = await prisma.dunningState.findMany({
      where: {
        status: {
          in: [DunningStatus.GRACE_PERIOD, DunningStatus.SUSPENDED],
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return states.map((s) => this.toResult(s));
  }

  /**
   * Get dunning statistics for analytics
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inGracePeriod: number;
    suspended: number;
    revoked: number;
  }> {
    const counts = await prisma.dunningState.groupBy({
      by: ['status'],
      _count: true,
    });

    const stats = {
      total: 0,
      active: 0,
      inGracePeriod: 0,
      suspended: 0,
      revoked: 0,
    };

    for (const count of counts) {
      stats.total += count._count;
      switch (count.status) {
        case DunningStatus.ACTIVE:
          stats.active = count._count;
          break;
        case DunningStatus.GRACE_PERIOD:
          stats.inGracePeriod = count._count;
          break;
        case DunningStatus.SUSPENDED:
          stats.suspended = count._count;
          break;
        case DunningStatus.REVOKED:
          stats.revoked = count._count;
          break;
      }
    }

    return stats;
  }

  /**
   * Initialize dunning state for a new tenant
   */
  async initializeTenant(tenantId: string): Promise<void> {
    await prisma.dunningState.upsert({
      where: { tenantId },
      create: {
        tenantId,
        status: DunningStatus.ACTIVE,
        failedPayments: 0,
      },
      update: {},
    });
  }

  /**
   * Log a dunning event to the database
   */
  private async logEvent(
    tenantId: string,
    eventType: string,
    severity: 'info' | 'warning' | 'critical',
    metadata: Record<string, unknown>
  ): Promise<void> {
    await prisma.dunningEvent.create({
      data: {
        tenantId,
        eventType,
        severity,
        metadata,
      },
    });
  }

  /**
   * Calculate grace period end date
   */
  private calculateGracePeriodEnd(state: { createdAt: Date; lastPaymentFailedAt?: Date | null }): Date {
    const baseDate = state.lastPaymentFailedAt || state.createdAt;
    return new Date(baseDate.getTime() + this.config.gracePeriodDays * 24 * 60 * 60 * 1000);
  }

  /**
   * Get cutoff date for grace period timeout check
   */
  private getGracePeriodCutoff(): Date {
    const now = new Date();
    return new Date(now.getTime() - this.config.gracePeriodDays * 24 * 60 * 60 * 1000);
  }

  /**
   * Get cutoff date for suspension timeout check
   */
  private getSuspensionCutoff(): Date {
    const now = new Date();
    return new Date(now.getTime() - this.config.suspensionDays * 24 * 60 * 60 * 1000);
  }

  /**
   * Convert Prisma state to result type
   */
  private toResult(state: {
    tenantId: string;
    status: DunningStatus;
    failedPayments: number;
    suspendedAt?: Date | null;
    revokedAt?: Date | null;
    createdAt: Date;
    lastPaymentFailedAt?: Date | null;
  }): DunningStateResult {
    const gracePeriodEndsAt =
      state.status === DunningStatus.GRACE_PERIOD && state.lastPaymentFailedAt
        ? this.calculateGracePeriodEnd(state)
        : undefined;

    return {
      tenantId: state.tenantId,
      status: state.status,
      failedPayments: state.failedPayments,
      gracePeriodEndsAt,
      suspendedAt: state.suspendedAt ?? undefined,
      revokedAt: state.revokedAt ?? undefined,
      canRecover: state.status !== DunningStatus.REVOKED,
    };
  }

  /**
   * Reset state (for testing)
   */
  async reset(tenantId?: string): Promise<void> {
    if (tenantId) {
      await prisma.dunningState.delete({ where: { tenantId } }).catch(() => {});
    } else {
      await prisma.dunningState.deleteMany();
    }
  }

  /**
   * Close Prisma client connection
   */
  async shutdown(): Promise<void> {
    await prisma.$disconnect();
  }
}

// Export singleton instance
export const dunningStateMachine = DunningStateMachine.getInstance();
