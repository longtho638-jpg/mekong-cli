import { db } from '../client';
import { Side, Prisma } from '@prisma/client';

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
    return db.trade.create({
      data: {
        tenantId: data.tenantId,
        strategyId: data.strategyId,
        pair: data.pair,
        side: data.side,
        price: data.price,
        amount: data.amount,
        fee: data.fee ?? 0,
        pnl: data.pnl ?? 0,
        exchange: data.exchange,
      },
    });
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
