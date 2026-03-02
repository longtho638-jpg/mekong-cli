import { db } from '../client';
import type { Prisma } from '@prisma/client';

export const backtestQueries = {
  async save(data: {
    tenantId: string;
    strategyId: string;
    pair: string;
    timeframe: string;
    days: number;
    result: Prisma.InputJsonValue;
    sharpe?: number;
    maxDd?: number;
    totalReturn?: number;
  }) {
    return db.backtestResult.create({
      data: data as Prisma.BacktestResultUncheckedCreateInput,
    });
  },

  async listByTenant(tenantId: string, limit = 50) {
    return db.backtestResult.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
};
