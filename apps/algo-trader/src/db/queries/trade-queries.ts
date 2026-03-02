import { db } from '../client';
import { Prisma, Side } from '@prisma/client';

export interface TradeCreateInput {
  tenantId: string;
  strategyId: string;
  pair: string;
  side: Side;
  price: number | Prisma.Decimal;
  amount: number | Prisma.Decimal;
  fee?: number | Prisma.Decimal;
  pnl?: number | Prisma.Decimal;
  exchange: string;
}

export const tradeQueries = {
  async create(data: TradeCreateInput) {
    return db.trade.create({ data: data as any });
  },

  async listByTenant(tenantId: string, limit = 100) {
    return db.trade.findMany({
      where: { tenantId },
      orderBy: { executedAt: 'desc' },
      take: limit,
    });
  },

  async getStats(tenantId: string) {
    const aggregates = await db.trade.aggregate({
      where: { tenantId },
      _sum: { pnl: true },
      _count: { id: true },
    });

    return {
      totalPnl: aggregates._sum.pnl,
      tradeCount: aggregates._count.id,
    };
  }
};
