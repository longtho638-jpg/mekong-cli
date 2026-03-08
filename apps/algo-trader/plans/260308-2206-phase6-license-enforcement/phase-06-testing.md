---
title: "Phase 6 — Testing"
description: "Comprehensive unit and integration tests for license enforcement"
status: pending
priority: P1
effort: 1.5h
---

# Phase 6: Testing

## Overview

Comprehensive test suite covering all license enforcement scenarios.

## Test Coverage

### Unit Tests

| Test File | Coverage |
|-----------|----------|
| `trade-gate-middleware.test.ts` | Quota enforcement, tier checks |
| `backtest-limits.test.ts` | Data truncation, tier limits |
| `grace-period.test.ts` | Countdown, notifications, suspension |
| `redis-rate-limiter.test.ts` | Atomic increments, sliding window |
| `notification-scheduler.test.ts` | Event triggers, channels |

### Integration Tests

| Test File | Coverage |
|-----------|----------|
| `license-enforcement-integration.test.ts` | End-to-end flow |
| `quota-api.test.ts` | Quota status endpoints |
| `webhook-integration.test.ts` | Dashboard webhooks |

## Implementation Steps

### 6.1 Trade Gate Middleware Tests

**File:** `src/middleware/tests/trade-gate-middleware.test.ts`

```typescript
describe('TradeGateMiddleware', () => {
  it('should allow orders under daily quota', async () => {
    LicenseService.getInstance().activateLicense('test-pro', LicenseTier.PRO);
    const result = await checkTradeQuota('tenant-123');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(100);
  });

  it('should block orders when quota exceeded', async () => {
    // Set quota to 0
    await setQuotaUsed('tenant-123', 100);
    const result = await checkTradeQuota('tenant-123');
    expect(result.allowed).toBe(false);
    expect(result.error).toBe('Daily quota exceeded');
  });

  it('should reset quota at midnight UTC', async () => {
    // Mock time to 23:59:59
    const result = await checkTradeQuota('tenant-123');
    expect(result.resetsAt).toBe('2026-03-09T00:00:00Z');
  });
});
```

### 6.2 Backtest Limits Tests

**File:** `src/backtest/tests/backtest-limits.test.ts`

```typescript
describe('BacktestLimits', () => {
  it('should limit FREE tier to 30 days of data', async () => {
    LicenseService.getInstance().activateLicense('test-free', LicenseTier.FREE);
    const candles = await fetchCandlesWithLimit('BTC/USDT', '1h', 90);
    expect(candles.length).toBeLessThanOrEqual(30 * 24); // 30 days * 24 hours
    expect(candles.truncated).toBe(true);
  });

  it('should allow PRO tier 365 days of data', async () => {
    LicenseService.getInstance().activateLicense('test-pro', LicenseTier.PRO);
    const candles = await fetchCandlesWithLimit('BTC/USDT', '1h', 400);
    expect(candles.length).toBeLessThanOrEqual(365 * 24);
  });

  it('should include warning in truncated response', async () => {
    const result = await runBacktest('RSI', { days: 90 });
    expect(result.warnings).toContain(
      'Historical data limited to 30 days (FREE tier)'
    );
  });
});
```

### 6.3 Grace Period Tests

**File:** `src/jobs/tests/grace-period-scheduler.test.ts`

```typescript
describe('GracePeriodScheduler', () => {
  it('should start grace period when license expires', () => {
    const service = LicenseService.getInstance();
    service.expireLicense(); // Mock expiration
    service.startGracePeriod();

    expect(service.isInGracePeriod()).toBe(true);
    expect(service.getGracePeriodRemaining()).toBeGreaterThan(14 * 60000);
  });

  it('should send notifications at correct milestones', async () => {
    const mockSendNotification = jest.spyOn(
      billingNotificationService,
      'sendNotification'
    );

    await scheduler.sendGracePeriodNotification(15);
    expect(mockSendNotification).toHaveBeenCalledWith(
      'grace_period_started',
      expect.any(String),
      expect.any(Array),
      expect.any(Object)
    );
  });

  it('should block trading after grace period ends', () => {
    const service = LicenseService.getInstance();
    service.gracePeriod = {
      startedAt: new Date(Date.now() - 20 * 60000), // 20 min ago
      expiresAt: new Date(Date.now() - 5 * 60000),  // 5 min ago
      notificationsSent: 4,
    };

    expect(service.isInGracePeriod()).toBe(false);
    expect(service.canTrade()).toBe(false);
  });
});
```

### 6.4 Redis Rate Limiter Tests

**File:** `src/lib/tests/redis-rate-limiter.test.ts`

```typescript
describe('RedisRateLimiter', () => {
  let redisLimiter: RedisRateLimiter;
  const testKey = 'test:ratelimit';

  beforeEach(async () => {
    redisLimiter = new RedisRateLimiter(process.env.TEST_REDIS_URL!);
    await redisLimiter.redis.del(testKey);
  });

  it('should allow requests under limit', async () => {
    const result = await redisLimiter.checkLimit(testKey, 10, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it('should block requests over limit', async () => {
    // Exhaust limit
    for (let i = 0; i < 10; i++) {
      await redisLimiter.checkLimit(testKey, 10, 60000);
    }

    const result = await redisLimiter.checkLimit(testKey, 10, 60000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should use sliding window (old requests expire)', async () => {
    // Mock time or wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 61000));
    const result = await redisLimiter.checkLimit(testKey, 10, 60000);
    expect(result.allowed).toBe(true);
  });
});
```

### 6.5 Integration Tests

**File:** `tests/integration/license-enforcement-integration.test.ts`

```typescript
describe('License Enforcement Integration', () => {
  it('should block trading flow when license expired', async () => {
    // Setup: Expired license, no grace period
    LicenseService.getInstance().activateLicense('test-free', LicenseTier.FREE);
    LicenseService.getInstance().expireLicense();

    // Execute: Try to place order
    const response = await request(app)
      .post('/api/orders')
      .send({ pair: 'BTC/USDT', side: 'buy', amount: 0.001 });

    // Verify: 403 response
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('License Required');
  });

  it('should allow trading in grace period', async () => {
    // Setup: Expired license with grace period
    const service = LicenseService.getInstance();
    service.activateLicense('test-pro', LicenseTier.PRO);
    service.expireLicense();
    service.startGracePeriod();

    // Execute: Place order
    const response = await request(app)
      .post('/api/orders')
      .send({ pair: 'BTC/USDT', side: 'buy', amount: 0.001 });

    // Verify: 200 response with warning
    expect(response.status).toBe(200);
    expect(response.headers['x-grace-period-remaining']).toBeDefined();
  });

  it('should return rate limit headers on all responses', async () => {
    const response = await request(app).get('/api/license/quota');

    expect(response.headers['x-ratelimit-limit']).toBeDefined();
    expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    expect(response.headers['x-ratelimit-reset']).toBeDefined();
  });
});
```

## Files to Modify/Create

| Action | File |
|--------|------|
| Create | `src/middleware/tests/trade-gate-middleware.test.ts` |
| Create | `src/backtest/tests/backtest-limits.test.ts` |
| Create | `src/jobs/tests/grace-period-scheduler.test.ts` |
| Create | `src/lib/tests/redis-rate-limiter.test.ts` |
| Create | `tests/integration/license-enforcement-integration.test.ts` |
| Create | `tests/integration/quota-api.test.ts` |

## Success Criteria

- [ ] All unit tests pass (342+ tests)
- [ ] All integration tests pass
- [ ] 90%+ code coverage for enforcement logic
- [ ] CI/CD pipeline runs tests on every PR
- [ ] No test flakiness (consistent results)

## Test Commands

```bash
# Run all license enforcement tests
npm test -- license-enforcement

# Run with coverage
npm test -- --coverage --testPathPattern=license

# Run integration tests only
npm test -- --testPathPattern=integration
```

## Unresolved Questions

1. Should we add E2E tests with real Redis instance?
2. Should we load test the rate limiter (1000 req/s)?
