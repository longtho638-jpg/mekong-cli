import { NextFunction, Request, Response } from 'express';
import cacheService from '../services/cache.service';
import Logger from '../utils/logger';

export const cache = (duration: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;

    try {
      const cachedResponse = await cacheService.get(key);

      if (cachedResponse) {
        Logger.info(`Cache hit for ${key}`);
        res.setHeader('X-Cache', 'HIT');
        return res.json(cachedResponse);
      }

      Logger.info(`Cache miss for ${key}`);
      res.setHeader('X-Cache', 'MISS');

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = (body: any): Response => {
        // Restore original json method
        res.json = originalJson;

        // Cache the response
        cacheService.set(key, body, duration);

        // Send the response
        return res.json(body);
      };

      next();
    } catch (error) {
      Logger.error('Cache middleware error:', error);
      next();
    }
  };
};
