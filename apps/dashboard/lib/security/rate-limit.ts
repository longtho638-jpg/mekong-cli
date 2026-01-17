/**
 * Redis-backed Rate Limiting Middleware
 * Persistent rate limiting for production environments
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import Redis from 'ioredis'

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface RateLimitConfig {
  interval: number // Time window in milliseconds
  maxRequests: number // Max requests per interval
  blockDuration?: number // How long to block after limit exceeded (ms)
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  blockedUntil?: Date
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⚙️ CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // API endpoints
  'api:default': { interval: 60_000, maxRequests: 100 },
  'api:auth': { interval: 60_000, maxRequests: 10, blockDuration: 300_000 },
  'api:billing': { interval: 60_000, maxRequests: 20 },
  'api:analytics': { interval: 60_000, maxRequests: 50 },

  // User actions
  'action:login': { interval: 300_000, maxRequests: 5, blockDuration: 900_000 },
  'action:signup': { interval: 3600_000, maxRequests: 3, blockDuration: 3600_000 },
  'action:password-reset': { interval: 3600_000, maxRequests: 3 },
  'action:invite': { interval: 3600_000, maxRequests: 10 },

  // Webhooks
  'webhook:stripe': { interval: 60_000, maxRequests: 100 },
  'webhook:payos': { interval: 60_000, maxRequests: 100 },
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔴 REDIS CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

let redisClient: Redis | null = null

function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnClusterDown: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      // Enable TLS in production
      tls: process.env.NODE_ENV === 'production' ? {} : undefined,
    })

    redisClient.on('error', error => {
      console.error('Redis connection error:', error)
    })

    redisClient.on('connect', () => {
      console.info('Redis connected successfully')
    })
  }
  return redisClient
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚦 RATE LIMITER
// ═══════════════════════════════════════════════════════════════════════════════

export class RedisRateLimiter {
  private redis: Redis

  constructor() {
    this.redis = getRedisClient()
  }

  private getKey(identifier: string, limitType: string): string {
    return `ratelimit:${limitType}:${identifier}`
  }

  private getBlockKey(identifier: string, limitType: string): string {
    return `ratelimit:block:${limitType}:${identifier}`
  }

  async check(identifier: string, limitType: string): Promise<RateLimitResult> {
    const config = RATE_LIMITS[limitType] || RATE_LIMITS['api:default']
    const key = this.getKey(identifier, limitType)
    const blockKey = this.getBlockKey(identifier, limitType)
    const now = Date.now()

    try {
      // Check if currently blocked
      const blockedUntil = await this.redis.get(blockKey)
      if (blockedUntil) {
        const blockedTime = parseInt(blockedUntil)
        if (blockedTime > now) {
          return {
            allowed: false,
            remaining: 0,
            resetAt: new Date(blockedTime),
            blockedUntil: new Date(blockedTime),
          }
        } else {
          // Block expired, remove it
          await this.redis.del(blockKey)
        }
      }

      // Use Redis pipeline for atomic operations
      const pipeline = this.redis.pipeline()

      // Get current count and set if not exists
      pipeline.incr(key)
      pipeline.expire(key, Math.ceil(config.interval / 1000))

      const results = await pipeline.exec()
      const count = (results?.[0]?.[1] as number) || 1

      // Check if limit exceeded
      if (count > config.maxRequests) {
        // Apply block if configured
        if (config.blockDuration) {
          const blockUntil = now + config.blockDuration
          await this.redis.setex(
            blockKey,
            Math.ceil(config.blockDuration / 1000),
            String(blockUntil)
          )

          return {
            allowed: false,
            remaining: 0,
            resetAt: new Date(blockUntil),
            blockedUntil: new Date(blockUntil),
          }
        }

        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(now + config.interval),
        }
      }

      return {
        allowed: true,
        remaining: Math.max(0, config.maxRequests - count),
        resetAt: new Date(now + config.interval),
      }
    } catch (error) {
      // Fail open - allow request if Redis is unavailable
      console.error('Rate limiting error, allowing request:', error)
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: new Date(now + config.interval),
      }
    }
  }

  async reset(identifier: string, limitType: string): Promise<void> {
    const key = this.getKey(identifier, limitType)
    const blockKey = this.getBlockKey(identifier, limitType)

    try {
      await this.redis.del(key, blockKey)
    } catch (error) {
      console.error('Error resetting rate limit:', error)
    }
  }

  async getStats(
    identifier: string,
    limitType: string
  ): Promise<{
    current: number
    remaining: number
    resetAt: Date
    isBlocked: boolean
    blockedUntil?: Date
  }> {
    const key = this.getKey(identifier, limitType)
    const blockKey = this.getBlockKey(identifier, limitType)
    const config = RATE_LIMITS[limitType] || RATE_LIMITS['api:default']
    const now = Date.now()

    try {
      const [count, blockedUntil] = await this.redis.mget(key, blockKey)
      const current = parseInt(count || '0')
      const blockedTime = blockedUntil ? parseInt(blockedUntil) : 0
      const isBlocked = blockedTime > now

      return {
        current,
        remaining: Math.max(0, config.maxRequests - current),
        resetAt: new Date(now + config.interval),
        isBlocked,
        blockedUntil: isBlocked ? new Date(blockedTime) : undefined,
      }
    } catch (error) {
      console.error('Error getting rate limit stats:', error)
      return {
        current: 0,
        remaining: config.maxRequests,
        resetAt: new Date(now + config.interval),
        isBlocked: false,
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔌 MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════════

const rateLimiter = new RedisRateLimiter()

export async function rateLimitMiddleware(
  request: NextRequest,
  limitType: string = 'api:default'
): Promise<NextResponse | null> {
  // Get identifier (IP or user ID)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const userId = request.headers.get('x-user-id')
  const identifier = userId || ip

  const result = await rateLimiter.check(identifier, limitType)

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
        blockedUntil: result.blockedUntil?.toISOString(),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(RATE_LIMITS[limitType]?.maxRequests || 100),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetAt.toISOString(),
          'Retry-After': String(Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)),
        },
      }
    )
  }

  return null
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 RATE LIMIT HEADERS
// ═══════════════════════════════════════════════════════════════════════════════

export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult,
  limitType: string
): NextResponse {
  const config = RATE_LIMITS[limitType] || RATE_LIMITS['api:default']

  response.headers.set('X-RateLimit-Limit', String(config.maxRequests))
  response.headers.set('X-RateLimit-Remaining', String(result.remaining))
  response.headers.set('X-RateLimit-Reset', result.resetAt.toISOString())

  return response
}

export { rateLimiter }
