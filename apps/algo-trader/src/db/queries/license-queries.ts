/**
 * License CRUD queries for RaaS License Management
 */
import { db } from '../client';
import { Prisma } from '@prisma/client';

export interface LicenseCreateInput {
  key: string;
  tier: 'FREE' | 'PRO' | 'ENTERPRISE';
  tenantId?: string;
  expiresAt?: Date;
  metadata?: Prisma.InputJsonValue;
  domain?: string;              // NEW: Associated domain
  overageUnits?: number;        // NEW: Overage units consumed
  overageAllowed?: boolean;     // NEW: Whether overage is allowed
}

export interface LicenseAuditInput {
  licenseId: string;
  event: string;
  tier?: string;
  ip?: string;
  metadata?: Prisma.InputJsonValue;
}

export const licenseQueries = {
  async create(data: LicenseCreateInput) {
    return db.license.create({ data });
  },

  async findByKey(key: string) {
    return db.license.findUnique({ where: { key } });
  },

  async findById(id: string) {
    return db.license.findUnique({ where: { id } });
  },

  async list(options?: {
    take?: number;
    skip?: number;
    status?: string;
    tier?: string;
  }) {
    const { take = 100, skip = 0, status, tier } = options || {};
    const where: Prisma.LicenseWhereInput = {};
    if (status) where.status = status;
    if (tier) where.tier = tier as any;
    return db.license.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
    });
  },

  async update(id: string, data: Partial<LicenseCreateInput>) {
    return db.license.update({
      where: { id },
      data,
    });
  },

  async revoke(id: string, revokedBy: string) {
    return db.license.update({
      where: { id },
      data: {
        status: 'revoked',
        revokedAt: new Date(),
        revokedBy,
      },
    });
  },

  async delete(id: string) {
    return db.license.delete({ where: { id } });
  },

  async logAudit(data: LicenseAuditInput) {
    return db.licenseAuditLog.create({ data });
  },

  async getAuditLogs(licenseId: string, take = 50) {
    return db.licenseAuditLog.findMany({
      where: { licenseId },
      take,
      orderBy: { createdAt: 'desc' },
    });
  },

  async getAnalytics() {
    const licenses = await db.license.findMany({
      select: {
        id: true,
        tier: true,
        status: true,
      },
    });

    const byTier = {
      free: licenses.filter((l) => l.tier === 'FREE').length,
      pro: licenses.filter((l) => l.tier === 'PRO').length,
      enterprise: licenses.filter((l) => l.tier === 'ENTERPRISE').length,
    };

    const byStatus = {
      active: licenses.filter((l) => l.status === 'active').length,
      revoked: licenses.filter((l) => l.status === 'revoked').length,
    };

    return { total: licenses.length, byTier, byStatus };
  },

  async getRecentActivity(take = 10) {
    return db.licenseAuditLog.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        licenseId: true,
        event: true,
        createdAt: true,
      },
    });
  },
};
