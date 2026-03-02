import { db } from '../client';
import { createHash } from 'crypto';

export const apiKeyQueries = {
  async create(tenantId: string, key: string, scopes: string[] = []) {
    const keyHash = this.hashKey(key);
    const keyPrefix = key.substring(0, 8);

    return db.apiKey.create({
      data: {
        tenantId,
        keyHash,
        keyPrefix,
        scopes,
      },
    });
  },

  async findByHash(key: string) {
    const keyHash = this.hashKey(key);
    return db.apiKey.findUnique({
      where: { keyHash },
      include: { tenant: true },
    });
  },

  async updateLastUsed(id: string) {
    return db.apiKey.update({
      where: { id },
      data: { lastUsed: new Date() },
    });
  },

  async deactivate(id: string) {
    return db.apiKey.update({
      where: { id },
      data: { isActive: false },
    });
  },

  hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }
};
