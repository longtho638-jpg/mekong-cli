---
title: "Phase 3: KV Rate Limiter"
description: "Cloudflare KV-based rate limiting for license validation attempts"
status: pending
priority: P1
effort: 2h
---

# Phase 3: KV Rate Limiter

## Context Links

- Parent: [./plan.md](./plan.md)
- Previous: [./phase-02-fastapi-middleware.md](./phase-02-fastapi-middleware.md)
- Related: `../src/lib/raas-gate.ts` (existing in-memory rate limiting)

## Overview

**Priority:** P1 (security + DoS protection)
**Status:** pending
**Effort:** 2h

Implement Cloudflare KV-based rate limiting for license validation attempts.

## Key Insights

1. **Existing in-memory:** `LicenseService` has in-memory rate limiting (5 attempts/min)
2. **Distributed need:** KV required for multi-instance deployments
3. **Dual approach:** In-memory for local dev, KV for production

## Requirements

### Functional

- [ ] Rate limit: 5 validation attempts/minute per IP
- [ ] Block for 5 minutes on exceed
- [ ] Log all attempts to KV for audit
- [ ] Support both local (memory) and production (KV) modes

### Non-functional

- [ ] Rate limit check < 5ms
- [ ] KV writes async (non-blocking)
- [ ] Graceful degradation if KV unavailable

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  License Validation Request                                 │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────────┐                                        │
│  │ Check KV Counter│ ← Key: rate_limit:{ip}               │
│  └────────┬────────┘                                        │
│           │ (if < 5/min)                                    │
│           ▼                                                 │
│  ┌─────────────────┐                                        │
│  │ Validate License│                                        │
│  └────────┬────────┘                                        │
│           │                                                 │
│           ▼                                                 │
│  ┌─────────────────┐                                        │
│  │ Log to KV       │ ← Key: audit:license:{timestamp}     │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

## Related Code Files

### To Create

- `src/lib/kv-rate-limiter.ts` - KV-based rate limiter
- `src/lib/kv-client.ts` - KV client wrapper

### To Modify

- `src/lib/raas-gate.ts` - Use KV rate limiter in production

## Implementation Steps

### 1. Create KV Client Wrapper

```typescript
// src/lib/kv-client.ts

/**
 * Cloudflare KV binding interface
 * Available in Workers runtime
 */
export interface KVNamespace {
  get(key: string, options?: { type: 'json' }): Promise<any>;
  put(key: string, value: any, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * Get KV namespace (Workers) or fallback to in-memory (local dev)
 */
export function getKvNamespace(): KVNamespace | null {
  // @ts-ignore - Cloudflare Workers global
  if (typeof RAAS_KV !== 'undefined') {
    // @ts-ignore
    return RAAS_KV;
  }

  // Local dev: return null (use in-memory fallback)
  return null;
}

/**
 * In-memory fallback for local development
 */
export class InMemoryKV implements KVNamespace {
  private store: Map<string, { value: any; expiresAt?: number }> = new Map();

  async get(key: string, options?: { type: 'json' }): Promise<any> {
    const item = this.store.get(key);
    if (!item || (item.expiresAt && Date.now() > item.expiresAt)) {
      this.store.delete(key);
      return null;
    }
    return options?.type === 'json' ? JSON.parse(item.value) : item.value;
  }

  async put(key: string, value: any, options?: { expirationTtl?: number }): Promise<void> {
    const expiresAt = options?.expirationTtl
      ? Date.now() + options.expirationTtl * 1000
      : undefined;
    this.store.set(key, {
      value: typeof value === 'object' ? JSON.stringify(value) : value,
      expiresAt,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  // For testing
  clear(): void {
    this.store.clear();
  }
}
```

### 2. Create KV Rate Limiter

```typescript
// src/lib/kv-rate-limiter.ts
import { KVNamespace, getKvNamespace, InMemoryKV } from './kv-client';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  blockedUntil?: number;
}

export class KvRateLimiter {
  private kv: KVNamespace;
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MS = 60 * 1000; // 1 minute
  private readonly BLOCK_MS = 5 * 60 * 1000; // 5 minutes

  constructor() {
    const kv = getKvNamespace();
    this.kv = kv || new InMemoryKV();
  }

  /**
   * Check and record rate limit for IP
   */
  async checkRateLimit(ip: string): Promise<RateLimitResult> {
    const key = `rate_limit:license:${ip}`;
    const now = Date.now();

    // Get current state
    const data = await this.kv.get(key, { type: 'json' });

    // No previous attempts
    if (!data) {
      await this.kv.put(key, {
        attempts: [now],
        blockedUntil: undefined,
      }, { expirationTtl: Math.ceil(this.WINDOW_MS / 1000) + 60 });

      return {
        allowed: true,
        remaining: this.MAX_ATTEMPTS - 1,
        resetAt: now + this.WINDOW_MS,
      };
    }

    // Check if blocked
    if (data.blockedUntil && now < data.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: data.blockedUntil,
        blockedUntil: data.blockedUntil,
      };
    }

    // Clean old attempts
    const validAttempts = data.attempts.filter((ts: number) => now - ts < this.WINDOW_MS);

    // Check if over limit
    if (validAttempts.length >= this.MAX_ATTEMPTS) {
      const blockedUntil = now + this.BLOCK_MS;
      await this.kv.put(key, {
        attempts: validAttempts,
        blockedUntil,
      }, { expirationTtl: Math.ceil((this.WINDOW_MS + this.BLOCK_MS) / 1000) + 60 });

      return {
        allowed: false,
        remaining: 0,
        resetAt: blockedUntil,
        blockedUntil,
      };
    }

    // Record attempt
    validAttempts.push(now);
    await this.kv.put(key, {
      attempts: validAttempts,
      blockedUntil: undefined,
    }, { expirationTtl: Math.ceil(this.WINDOW_MS / 1000) + 60 });

    return {
      allowed: true,
      remaining: this.MAX_ATTEMPTS - validAttempts.length - 1,
      resetAt: now + this.WINDOW_MS,
    };
  }

  /**
   * Log validation attempt to audit store
   */
  async logAttempt(
    ip: string,
    success: boolean,
    tier: string,
    licenseKeyPrefix: string
  ): Promise<void> {
    const key = `audit:license:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const log = {
      timestamp: new Date().toISOString(),
      ip,
      success,
      tier,
      licenseKeyPrefix, // First 8 chars only
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    };

    // Async write (don't block)
    this.kv.put(key, log, { expirationTtl: 30 * 24 * 60 * 60 }) // 30 days
      .catch(err => console.error('[KvRateLimiter] Audit log failed:', err));
  }

  /**
   * Get current attempt count for IP (debugging)
   */
  async getAttemptCount(ip: string): Promise<number> {
    const key = `rate_limit:license:${ip}`;
    const data = await this.kv.get(key, { type: 'json' });

    if (!data) return 0;

    const now = Date.now();
    const validAttempts = data.attempts?.filter((ts: number) => now - ts < this.WINDOW_MS) || [];
    return validAttempts.length;
  }
}
```

### 3. Integrate with LicenseService

Modify `src/lib/raas-gate.ts`:

```typescript
import { KvRateLimiter } from './kv-rate-limiter';

export class LicenseService {
  private rateLimiter: KvRateLimiter;

  private constructor() {
    this.rateLimiter = new KvRateLimiter();
    // ... rest of constructor
  }

  async validate(key?: string, clientIp?: string): Promise<LicenseValidation> {
    const licenseKey = key || process.env.RAAS_LICENSE_KEY;

    // Check rate limit (KV-based)
    if (clientIp) {
      const rateLimitResult = await this.rateLimiter.checkRateLimit(clientIp);

      if (!rateLimitResult.allowed) {
        await this.rateLimiter.logAttempt(clientIp, false, 'blocked', 'N/A');

        throw new LicenseError(
          'Too many validation attempts. Please try again later.',
          LicenseTier.FREE,
          'rate_limited'
        );
      }

      // Track failed attempt if key is invalid
      if (!licenseKey || !this.isValidKey(licenseKey)) {
        await this.rateLimiter.logAttempt(
          clientIp,
          false,
          'unknown',
          licenseKey ? licenseKey.substring(0, 8) + '...' : 'N/A'
        );
      }
    }

    // ... rest of validation logic
  }
}
```

## Success Criteria

- [ ] KV rate limiter implemented
- [ ] 5 attempts/min per IP enforced
- [ ] 5-min block on exceed
- [ ] Audit logging to KV
- [ ] In-memory fallback for local dev
- [ ] Unit tests for rate limiter

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| KV unavailable | Medium | In-memory fallback |
| KV latency | Low | Async writes, cached reads |
| IP spoofing | Medium | Trust proxy headers |

## Security Considerations

- [ ] Trust X-Forwarded-For header only from trusted proxies
- [ ] Audit logs truncate license keys (first 8 chars)
- [ ] Rate limit keys expire (prevent KV bloat)

## Next Steps

1. → Phase 4: Startup validation gate
2. → Phase 5: Testing
