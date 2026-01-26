import redisClient from '../config/redis';
import Logger from '../utils/logger';

export class CacheService {
  private client = redisClient;

  constructor() {
    if (!this.client.isOpen) {
      this.client.connect().catch((err) => Logger.error('Redis connection failed in CacheService', err));
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      Logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), {
        EX: ttlSeconds,
      });
    } catch (error) {
      Logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      Logger.error(`Cache del error for key ${key}:`, error);
    }
  }

  async flush(): Promise<void> {
    try {
      await this.client.flushAll();
    } catch (error) {
      Logger.error('Cache flush error:', error);
    }
  }

  generateKey(prefix: string, ...args: (string | number)[]): string {
    return `${prefix}:${args.join(':')}`;
  }
}

export default new CacheService();
