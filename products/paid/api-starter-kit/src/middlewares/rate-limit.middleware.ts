import { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from '../config/redis';
import { AppError } from '../utils/errors';
import Logger from '../utils/logger';

// Default rate limiter using Redis
export const createRateLimiter = (
  windowMs: number = 60 * 1000, // 1 minute
  max: number = 100, // Limit each IP to 100 requests per windowMs
  message: string = 'Too many requests, please try again later.'
) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    store: new RedisStore({
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    }),
    handler: (req: Request, res: Response, next: NextFunction) => {
      Logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      next(new AppError(message, 429));
    },
    keyGenerator: (req: Request): string => {
        // Use user ID if authenticated, otherwise use IP
        // This requires auth middleware to run BEFORE rate limiter if we want per-user limits
        // For public endpoints, it falls back to IP
        return (req as any).user?.id || req.ip || 'unknown';
    }
  });
};

export const defaultLimiter = createRateLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
);

export const authLimiter = createRateLimiter(
    60 * 60 * 1000, // 1 hour
    10, // 10 login attempts per hour
    'Too many login attempts, please try again after an hour'
);
