/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse
 */

import { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface RateLimitConfig {
    interval: number;      // Time window in milliseconds
    maxRequests: number;   // Max requests per interval
    blockDuration?: number; // How long to block after limit exceeded (ms)
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: Date;
    blockedUntil?: Date;
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
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🗄️ IN-MEMORY STORE (Use Redis in production)
// ═══════════════════════════════════════════════════════════════════════════════

interface RateLimitEntry {
    count: number;
    firstRequest: number;
    blockedUntil?: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of store.entries()) {
            const maxAge = 3600_000; // 1 hour
            if (now - entry.firstRequest > maxAge) {
                store.delete(key);
            }
        }
    }, 60_000); // Every minute
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚦 RATE LIMITER
// ═══════════════════════════════════════════════════════════════════════════════

export class RateLimiter {
    private getKey(identifier: string, limitType: string): string {
        return `ratelimit:${limitType}:${identifier}`;
    }

    async check(identifier: string, limitType: string): Promise<RateLimitResult> {
        const config = RATE_LIMITS[limitType] || RATE_LIMITS['api:default'];
        const key = this.getKey(identifier, limitType);
        const now = Date.now();

        let entry = store.get(key);

        // Check if currently blocked
        if (entry?.blockedUntil && entry.blockedUntil > now) {
            return {
                allowed: false,
                remaining: 0,
                resetAt: new Date(entry.blockedUntil),
                blockedUntil: new Date(entry.blockedUntil),
            };
        }

        // Check if window expired
        if (!entry || (now - entry.firstRequest) > config.interval) {
            entry = { count: 0, firstRequest: now };
        }

        // Increment count
        entry.count++;

        // Check limit
        if (entry.count > config.maxRequests) {
            // Apply block if configured
            if (config.blockDuration) {
                entry.blockedUntil = now + config.blockDuration;
            }

            store.set(key, entry);

            return {
                allowed: false,
                remaining: 0,
                resetAt: new Date(entry.firstRequest + config.interval),
                blockedUntil: entry.blockedUntil ? new Date(entry.blockedUntil) : undefined,
            };
        }

        store.set(key, entry);

        return {
            allowed: true,
            remaining: config.maxRequests - entry.count,
            resetAt: new Date(entry.firstRequest + config.interval),
        };
    }

    async reset(identifier: string, limitType: string): Promise<void> {
        const key = this.getKey(identifier, limitType);
        store.delete(key);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔌 MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════════

const rateLimiter = new RateLimiter();

export async function rateLimitMiddleware(
    request: NextRequest,
    limitType: string = 'api:default'
): Promise<NextResponse | null> {
    // Get identifier (IP or user ID)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]
        || request.headers.get('x-real-ip')
        || 'unknown';

    const userId = request.headers.get('x-user-id');
    const identifier = userId || ip;

    const result = await rateLimiter.check(identifier, limitType);

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
        );
    }

    return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 RATE LIMIT HEADERS
// ═══════════════════════════════════════════════════════════════════════════════

export function addRateLimitHeaders(
    response: NextResponse,
    result: RateLimitResult,
    limitType: string
): NextResponse {
    const config = RATE_LIMITS[limitType] || RATE_LIMITS['api:default'];

    response.headers.set('X-RateLimit-Limit', String(config.maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', result.resetAt.toISOString());

    return response;
}

export { rateLimiter };
