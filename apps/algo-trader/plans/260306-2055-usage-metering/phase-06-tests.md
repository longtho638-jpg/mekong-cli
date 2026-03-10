---
title: "Phase 4.6: Tests"
description: "Unit, integration, and E2E tests for usage metering"
status: pending
priority: P1
effort: 1h
parent: plan.md
---

# Phase 4.6: Tests

## Test Files

### 1. Unit Tests: `src/metering/usage-tracker.test.ts`

```typescript
/**
 * UsageTracker Unit Tests
 */

import { UsageTrackerService } from './usage-tracker';
import * as usageQueries from '../db/queries/usage-queries';

// Mock DB queries
jest.mock('../db/queries/usage-queries');

describe('UsageTrackerService', () => {
  let tracker: UsageTrackerService;

  beforeEach(() => {
    tracker = UsageTrackerService.getInstance({
      flushIntervalMs: 1000, // Fast flush for tests
      flushThreshold: 10,
    });
    tracker.reset();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await tracker.close();
    UsageTrackerService['instance'] = null; // Reset singleton
  });

  describe('recordApiCall', () => {
    it('should add event to buffer', () => {
      tracker.recordApiCall('tenant-123', '/api/test');

      expect(tracker.getBufferLength()).toBe(1);
    });

    it('should trigger flush at threshold', async () => {
      const mockBatch = jest.spyOn(usageQueries, 'batchRecordUsageEvents');
      mockBatch.mockResolvedValue();

      // Record up to threshold
      for (let i = 0; i < 10; i++) {
        tracker.recordApiCall('tenant-123', `/api/test/${i}`);
      }

      // Wait for async flush
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockBatch).toHaveBeenCalled();
    });
  });

  describe('compute timer', () => {
    it('should track compute time', async () => {
      const timer = tracker.startComputeTimer();

      // Simulate work
      await new Promise((resolve) => setTimeout(resolve, 50));

      const elapsed = timer.stop();

      expect(elapsed).toBeGreaterThanOrEqual(45); // Allow some tolerance
      expect(elapsed).toBeLessThan(100);
    });

    it('should record compute time via recordWithTimer', async () => {
      const mockBatch = jest.spyOn(usageQueries, 'batchRecordUsageEvents');
      mockBatch.mockResolvedValue();

      await tracker.recordWithTimer(
        'tenant-123',
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return 'result';
        },
        'test-model'
      );

      // Flush and verify
      await tracker.flush();

      expect(mockBatch).toHaveBeenCalled();
      const events = mockBatch.mock.calls[0][0];
      const computeEvent = events.find((e) => e.eventType === 'compute_ml');
      expect(computeEvent).toBeDefined();
      expect(computeEvent!.computeMs).toBeGreaterThanOrEqual(45);
    });
  });

  describe('flush', () => {
    it('should flush buffer to DB', async () => {
      const mockBatch = jest.spyOn(usageQueries, 'batchRecordUsageEvents');
      mockBatch.mockResolvedValue();

      tracker.recordApiCall('tenant-123', '/api/test');
      await tracker.flush();

      expect(mockBatch).toHaveBeenCalledTimes(1);
      expect(tracker.getBufferLength()).toBe(0);
    });

    it('should handle flush errors gracefully', async () => {
      const mockBatch = jest.spyOn(usageQueries, 'batchRecordUsageEvents');
      mockBatch.mockRejectedValue(new Error('DB error'));

      tracker.recordApiCall('tenant-123', '/api/test');
      await tracker.flush();

      // Should not throw, buffer should keep events
      expect(tracker.getBufferLength()).toBeGreaterThan(0);
    });
  });
});
```

### 2. Integration Tests: `tests/integration/usage-tracking-integration.test.ts`

```typescript
/**
 * Usage Tracking Integration Tests
 */

import { FastifyInstance } from 'fastify';
import { buildServer } from '../../src/api/fastify-raas-server';
import { UsageTrackerService } from '../../src/metering/usage-tracker';

describe('Usage Tracking Integration', () => {
  let server: FastifyInstance;
  let tracker: UsageTrackerService;

  beforeAll(async () => {
    server = await buildServer();
    tracker = UsageTrackerService.getInstance();
    await tracker.init();
  });

  afterAll(async () => {
    await tracker.close();
    await server.close();
  });

  describe('Internal Usage API', () => {
    const testLicenseKey = 'test-license-integration';

    it('should track API calls through middleware', async () => {
      // Make authenticated request
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/health',
        headers: {
          'x-license-key': testLicenseKey,
        },
      });

      expect(response.statusCode).toBe(200);

      // Flush and verify tracking
      await tracker.flush();

      // Query usage
      const usageResponse = await server.inject({
        method: 'GET',
        url: `/internal/usage/${testLicenseKey}`,
        headers: {
          'x-internal-api-key': process.env.INTERNAL_API_KEY || 'test',
        },
      });

      expect(usageResponse.statusCode).toBe(200);
      const usage = usageResponse.json();
      expect(usage.apiCalls).toBeGreaterThan(0);
    });

    it('should return 401 without internal API key', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/internal/usage/${testLicenseKey}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should export in Stripe format', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/internal/usage/${testLicenseKey}/export?month=2026-03&subscription_item=si_test`,
        headers: {
          'x-internal-api-key': process.env.INTERNAL_API_KEY || 'test',
        },
      });

      expect(response.statusCode).toBe(200);
      const data = response.json();
      expect(data.records).toBeDefined();
      expect(Array.isArray(data.records)).toBe(true);
    });
  });
});
```

### 3. Billing Adapter Tests: `tests/billing/usage-billing-adapter.test.ts`

```typescript
/**
 * Usage Billing Adapter Tests
 */

import { UsageBillingAdapter } from '../../src/billing/usage-billing-adapter';
import { UsageTrackerService } from '../../src/metering/usage-tracker';

jest.mock('../../src/db/queries/usage-queries');

describe('UsageBillingAdapter', () => {
  let adapter: UsageBillingAdapter;
  let tracker: UsageTrackerService;

  beforeEach(() => {
    tracker = UsageTrackerService.getInstance();
    adapter = new UsageBillingAdapter(tracker);
  });

  afterEach(() => {
    tracker.reset();
  });

  describe('generateStripeRecords', () => {
    it('should generate records in Stripe format', async () => {
      const records = await adapter.generateStripeRecords(
        'test-license',
        '2026-03',
        'si_xxx'
      );

      expect(records).toBeDefined();
      expect(Array.isArray(records)).toBe(true);

      if (records.length > 0) {
        const record = records[0];
        expect(record).toHaveProperty('subscription_item');
        expect(record).toHaveProperty('quantity');
        expect(record).toHaveProperty('timestamp');
        expect(record.subscription_item).toBe('si_xxx');
      }
    });
  });

  describe('getBillingSummary', () => {
    it('should return usage with estimated costs', async () => {
      const summary = await adapter.getBillingSummary(
        'test-license',
        '2026-03'
      );

      expect(summary).toHaveProperty('apiCalls');
      expect(summary).toHaveProperty('computeMinutes');
      expect(summary).toHaveProperty('estimatedCost');
      expect(summary.estimatedCost).toHaveProperty('total');
    });

    it('should apply tier discounts', async () => {
      // Test with different tiers
      const freeSummary = await adapter.getBillingSummary(
        'test-license-free',
        '2026-03'
      );
      const proSummary = await adapter.getBillingSummary(
        'test-license-pro',
        '2026-03'
      );

      // Pro should have discount
      expect(proSummary.estimatedCost.total).toBeLessThanOrEqual(
        freeSummary.estimatedCost.total
      );
    });
  });
});
```

## Test Commands

```bash
# Run all usage metering tests
npm test -- --testPathPattern="usage"

# Run with coverage
npm test -- --testPathPattern="usage" --coverage

# Run single test file
npm test -- src/metering/usage-tracker.test.ts
```

## Success Criteria

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Test coverage > 80% for metering modules
- [ ] No console errors or warnings
