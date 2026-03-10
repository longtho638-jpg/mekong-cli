---
title: "Phase 5: Testing"
description: "Unit tests + integration tests for license gate"
status: pending
priority: P1
effort: 1h
---

# Phase 5: Testing

## Context Links

- Parent: [./plan.md](./plan.md)
- Previous: [./phase-04-startup-validation.md](./phase-04-startup-validation.md)
- Related: `../src/lib/raas-gate.test.ts`

## Overview

**Priority:** P1 (quality assurance)
**Status:** pending
**Effort:** 1h

Comprehensive unit and integration tests for license validation gate.

## Requirements

### Unit Tests

- [ ] License validator core tests
- [ ] KV rate limiter tests
- [ ] Middleware tests
- [ ] Startup validation tests

### Integration Tests

- [ ] End-to-end license flow
- [ ] Rate limiting behavior
- [ ] Middleware + route protection

## Test Plan

### 1. Remote Validator Tests

```typescript
// src/lib/raas-remote-validator.test.ts
import { RaasRemoteValidator } from './raas-remote-validator';

describe('RaasRemoteValidator', () => {
  let validator: RaasRemoteValidator;

  beforeEach(() => {
    validator = new RaasRemoteValidator('https://mock-raas-gateway');
  });

  test('should validate JWT token', async () => {
    // Mock fetch response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        valid: true,
        tier: 'pro',
        features: ['ml_models', 'premium_data'],
      }),
    });

    const result = await validator.validateLicense('eyJhbGc...');
    expect(result.valid).toBe(true);
    expect(result.tier).toBe('pro');
  });

  test('should validate API key', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        valid: true,
        tier: 'enterprise',
      }),
    });

    const result = await validator.validateLicense('mk_abc123');
    expect(result.valid).toBe(true);
  });

  test('should cache validation result', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ valid: true, tier: 'pro' }),
    });
    global.fetch = mockFetch;

    await validator.validateLicense('test-key');
    await validator.validateLicense('test-key');

    // Should only call once (cached)
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test('should handle gateway error gracefully', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network error'));

    await expect(validator.validateLicense('test-key'))
      .rejects.toThrow('Gateway validation failed');
  });
});
```

### 2. KV Rate Limiter Tests

```typescript
// src/lib/kv-rate-limiter.test.ts
import { KvRateLimiter } from './kv-rate-limiter';
import { InMemoryKV } from './kv-client';

describe('KvRateLimiter', () => {
  let rateLimiter: KvRateLimiter;
  let mockKV: InMemoryKV;

  beforeEach(() => {
    mockKV = new InMemoryKV();
    rateLimiter = new KvRateLimiter();
    // Inject mock KV
    (rateLimiter as any).kv = mockKV;
  });

  test('should allow first 5 attempts', async () => {
    for (let i = 0; i < 5; i++) {
      const result = await rateLimiter.checkRateLimit('192.168.1.1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4 - i);
    }
  });

  test('should block on 6th attempt', async () => {
    // Exhaust attempts
    for (let i = 0; i < 5; i++) {
      await rateLimiter.checkRateLimit('192.168.1.1');
    }

    const result = await rateLimiter.checkRateLimit('192.168.1.1');
    expect(result.allowed).toBe(false);
    expect(result.blockedUntil).toBeDefined();
  });

  test('should unblock after 5 minutes', async () => {
    // Block the IP
    for (let i = 0; i < 6; i++) {
      await rateLimiter.checkRateLimit('192.168.1.1');
    }

    // Fast-forward time
    jest.useFakeTimers();
    jest.advanceTimersByTime(5 * 60 * 1000 + 1000); // 5 min + 1s

    const result = await rateLimiter.checkRateLimit('192.168.1.1');
    expect(result.allowed).toBe(true);

    jest.useRealTimers();
  });

  test('should log audit entries', async () => {
    await rateLimiter.logAttempt('192.168.1.1', true, 'pro', 'abc123..');

    // Audit log should be written (async, so wait briefly)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check KV for audit entry
    const keys = Array.from((mockKV as any).store.keys());
    expect(keys.some(k => k.startsWith('audit:license:'))).toBe(true);
  });
});
```

### 3. Middleware Tests

```typescript
// src/api/middleware/license-middleware.test.ts
import { createLicenseMiddleware } from './license-middleware';
import { LicenseService } from '../../lib/raas-gate';

describe('License Middleware', () => {
  let mockRequest: any;
  let mockReply: any;
  let licenseService: LicenseService;

  beforeEach(() => {
    licenseService = LicenseService.getInstance();
    licenseService.reset();

    mockRequest = {
      url: '/api/v1/tenants',
      log: { error: jest.fn() },
    };

    mockReply = {
      code: jest.fn().mockReturnValue(mockReply),
      send: jest.fn(),
    };
  });

  test('should allow request with valid license', async () => {
    // Setup PRO license
    await licenseService.validate('raas-pro-test');

    const middleware = createLicenseMiddleware();
    await middleware(mockRequest, mockReply);

    expect(mockReply.code).not.toHaveBeenCalled();
    expect(mockReply.send).not.toHaveBeenCalled();
  });

  test('should return 403 for missing license', async () => {
    // No license set
    const middleware = createLicenseMiddleware({ requiredTier: 'pro' });
    await middleware(mockRequest, mockReply);

    expect(mockReply.code).toHaveBeenCalledWith(403);
    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'license_required',
      })
    );
  });

  test('should exclude health routes', async () => {
    mockRequest.url = '/health';

    const middleware = createLicenseMiddleware({
      excludeRoutes: ['/health'],
    });

    await middleware(mockRequest, mockReply);

    expect(mockReply.code).not.toHaveBeenCalled();
    expect(mockReply.send).not.toHaveBeenCalled();
  });
});
```

### 4. Integration Tests

```typescript
// tests/integration/license-gate-integration.test.ts
import { startRaasServer, stopRaasServer } from '../../src/api/fastify-raas-server';
import { LicenseService } from '../../src/lib/raas-gate';

describe('License Gate Integration', () => {
  let serverPort: number;

  afterEach(async () => {
    await stopRaasServer();
    LicenseService.getInstance().reset();
  });

  test('should reject requests without license', async () => {
    // Start server without license
    process.env.RAAS_LICENSE_KEY = '';

    serverPort = await startRaasServer({ skipAuth: true });

    const response = await fetch(`http://localhost:${serverPort}/api/v1/tenants`);

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('license_required');
  });

  test('should allow requests with valid license', async () => {
    // Start server with PRO license
    process.env.RAAS_LICENSE_KEY = 'raas-pro-test';

    serverPort = await startRaasServer({ skipAuth: true });

    const response = await fetch(`http://localhost:${serverPort}/api/v1/tenants`);

    expect(response.status).toBe(200);
  });

  test('should rate limit validation attempts', async () => {
    process.env.RAAS_LICENSE_KEY = '';

    serverPort = await startRaasServer({ skipAuth: true });

    // Make 6 rapid requests
    for (let i = 0; i < 6; i++) {
      const response = await fetch(
        `http://localhost:${serverPort}/api/v1/license/validate`,
        { method: 'POST' }
      );

      if (i < 5) {
        expect(response.status).not.toBe(429);
      } else {
        expect(response.status).toBe(429);
      }
    }
  });
});
```

## Success Criteria

- [ ] 90%+ code coverage
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Rate limiting tests verify 5/min limit
- [ ] Middleware tests verify 403 responses

## Test Commands

```bash
# Run license gate tests
npm test -- raas-gate

# Run middleware tests
npm test -- license-middleware

# Run integration tests
npm test -- integration

# Run with coverage
npm test -- --coverage --testPathPattern=license
```

## Unresolved Questions

1. Mock Cloudflare KV in CI/CD environment?
2. Integration tests: start real server or mock?
