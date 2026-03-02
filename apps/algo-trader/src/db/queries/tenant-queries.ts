import { db } from '../client';
import { Prisma, Tier } from '@prisma/client';

export interface TenantCreateInput {
  id: string;
  name: string;
  tier?: Tier;
  maxStrategies?: number;
  maxDailyLossUsd?: number | Prisma.Decimal;
  maxPositionUsd?: number | Prisma.Decimal;
  allowedExchanges?: string[];
}

export const tenantQueries = {
  async create(data: TenantCreateInput) {
    return db.tenant.create({ data });
  },

  async findById(id: string) {
    return db.tenant.findUnique({ where: { id } });
  },

  async update(id: string, data: Partial<TenantCreateInput>) {
    return db.tenant.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return db.tenant.delete({ where: { id } });
  },

  async list() {
    return db.tenant.findMany();
  }
};
