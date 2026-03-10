/**
 * Usage Event Queries for RaaS Usage Tracking
 * Records and aggregates usage events for billing and analytics
 */
import { db } from '../client';
import { Prisma } from '@prisma/client';

export interface UsageEventInput {
  licenseKey: string;
  eventType: string; // api_call, compute_minute, ml_inference
  units: number;
  tenantId?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface UsageFilters {
  startDate?: Date;
  endDate?: Date;
  eventType?: string;
}

export const usageQueries = {
  /**
   * Record a usage event
   */
  async recordUsage(data: UsageEventInput) {
    return db.usageEvent.create({ data });
  },

  /**
   * Get all usage events for a license within date range
   */
  async getUsageByLicense(
    licenseKey: string,
    filters?: UsageFilters
  ) {
    const { startDate, endDate, eventType } = filters || {};

    const where: Prisma.UsageEventWhereInput = {
      licenseKey,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    if (eventType) {
      where.eventType = eventType;
    }

    return db.usageEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Get aggregated usage by event type for a specific month (YYYY-MM)
   */
  async getAggregatedUsage(licenseKey: string, month: string) {
    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new Error('Invalid month format. Use YYYY-MM');
    }

    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

    const events = await db.usageEvent.groupBy({
      by: ['eventType'],
      where: {
        licenseKey,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        units: true,
      },
      _count: {
        id: true,
      },
    });

    return events.map((e) => ({
      eventType: e.eventType,
      totalUnits: e._sum.units ?? 0,
      eventCount: e._count.id,
      month,
    }));
  },

  /**
   * Delete usage events older than specified date (cleanup)
   */
  async deleteOldUsage(beforeDate: Date) {
    const result = await db.usageEvent.deleteMany({
      where: {
        createdAt: {
          lt: beforeDate,
        },
      },
    });
    return result.count;
  },

  /**
   * Get usage summary for a license (total events, units by type)
   */
  async getUsageSummary(licenseKey: string) {
    const events = await db.usageEvent.groupBy({
      by: ['eventType'],
      where: { licenseKey },
      _sum: {
        units: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      totalEvents: events.reduce((sum, e) => sum + e._count.id, 0),
      byEventType: events.map((e) => ({
        eventType: e.eventType,
        totalUnits: e._sum.units ?? 0,
        eventCount: e._count.id,
      })),
    };
  },

  /**
   * Get recent usage events across all licenses (for monitoring)
   */
  async getRecentUsage(take = 50) {
    return db.usageEvent.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        licenseKey: true,
        tenantId: true,
        eventType: true,
        units: true,
        createdAt: true,
      },
    });
  },
};
