/**
 * Stripe Usage Sync Job Tests
 *
 * Tests for the background job that syncs usage from RaaS Gateway KV to Stripe.
 */

// Mock Prisma before any imports
const mockLicenseFindFirst = jest.fn();
const mockTenantFindMany = jest.fn();
const mockPrisma = {
  license: {
    findFirst: mockLicenseFindFirst,
  },
  tenant: {
    findMany: mockTenantFindMany,
  },
  $disconnect: jest.fn(),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Mock Stripe SDK
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    subscriptionItems: {
      createUsageRecord: jest.fn(),
    },
  }));
});

// Mock StripeInvoiceService
jest.mock('../../src/billing/stripe-invoice-service', () => ({
  StripeInvoiceService: {
    getInstance: jest.fn(() => ({
      createOverageInvoice: jest.fn(),
    })),
  },
}));

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Now import the actual modules
import { StripeUsageSyncJob, createStripeUsageSyncJob } from '../../src/jobs/stripe-usage-sync-job';
import { StripeUsageSyncService, DefaultRaasGatewayClient, KVUsageMetrics } from '../../src/billing/stripe-usage-sync';

// Mock Stripe
const mockCreateUsageRecord = jest.fn();
const mockStripe = {
  subscriptionItems: {
    createUsageRecord: mockCreateUsageRecord,
  },
};

describe('StripeUsageSyncJob', () => {
  let job: StripeUsageSyncJob;
  let originalStripeKey: string | undefined;

  beforeAll(() => {
    // Save and clear Stripe env var to prevent real API calls
    originalStripeKey = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock_for_tests';
  });

  afterAll(() => {
    process.env.STRIPE_SECRET_KEY = originalStripeKey;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateUsageRecord.mockReset();
    mockLicenseFindFirst.mockReset();
    mockTenantFindMany.mockReset();

    // Reset singleton
    StripeUsageSyncService['instance'] = undefined;
  });

  describe('constructor', () => {
    it('should create job with default interval', () => {
      job = new StripeUsageSyncJob();
      const status = job.getStatus();
      expect(status.intervalMs).toBe(5 * 60 * 1000); // 5 minutes
      expect(status.dryRun).toBe(false);
    });

    it('should create job with custom interval', () => {
      job = new StripeUsageSyncJob(undefined, undefined, 10 * 60 * 1000);
      const status = job.getStatus();
      expect(status.intervalMs).toBe(10 * 60 * 1000); // 10 minutes
    });

    it('should accept custom Stripe client', () => {
      job = new StripeUsageSyncJob(mockStripe as any);
      expect(job).toBeDefined();
    });

    it('should accept custom RaaS Gateway client', () => {
      const mockGateway = {
        fetchUsageMetrics: jest.fn(),
        aggregateBySubscriptionItem: jest.fn(),
      };
      job = new StripeUsageSyncJob(undefined, mockGateway as any);
      expect(job).toBeDefined();
    });
  });

  describe('start/stop', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should start job and run immediately', () => {
      job = new StripeUsageSyncJob();
      const runSyncSpy = jest.spyOn(job, 'runSync').mockResolvedValue();

      job.start();

      expect(runSyncSpy).toHaveBeenCalledTimes(1);

      // Advance timer by interval
      jest.advanceTimersByTime(5 * 60 * 1000);
      expect(runSyncSpy).toHaveBeenCalledTimes(2);
    });

    it('should not start multiple intervals', () => {
      job = new StripeUsageSyncJob();
      const runSyncSpy = jest.spyOn(job, 'runSync').mockResolvedValue();

      job.start();
      job.start(); // Should be ignored

      expect(runSyncSpy).toHaveBeenCalledTimes(1);
    });

    it('should stop job', () => {
      job = new StripeUsageSyncJob();
      const runSyncSpy = jest.spyOn(job, 'runSync').mockResolvedValue();

      job.start();
      job.stop();

      jest.advanceTimersByTime(5 * 60 * 1000);
      expect(runSyncSpy).toHaveBeenCalledTimes(1); // Only initial run
    });
  });

  describe('runSync', () => {
    beforeEach(() => {
      job = new StripeUsageSyncJob();
    });

    it('should skip if already running', async () => {
      (job as any).isRunning = true;
      await job.runSync();
      // Should not throw, just skip
    });

    it('should sync usage and reset backoff on success', async () => {
      // Mock syncUsage to return success
      const mockSyncUsage = jest.fn().mockResolvedValue({
        success: true,
        licenseKey: 'bulk-sync',
        recordsSent: 5,
      });

      (job as any).sync = {
        syncUsage: mockSyncUsage,
      };

      await job.runSync();

      expect(mockSyncUsage).toHaveBeenCalledWith({ dryRun: false });
      expect(job.getStatus().currentBackoffMs).toBe(0);
    });

    it('should apply backoff on failure', async () => {
      // Mock syncUsage to return failure
      const mockSyncUsage = jest.fn().mockResolvedValue({
        success: false,
        licenseKey: 'bulk-sync',
        recordsSent: 0,
        error: 'Test error',
      });

      (job as any).sync = {
        syncUsage: mockSyncUsage,
      };

      await job.runSync();

      expect(mockSyncUsage).toHaveBeenCalled();
      expect(job.getStatus().currentBackoffMs).toBeGreaterThan(0);
    });

    it('should apply backoff on exception', async () => {
      // Mock syncUsage to throw
      const mockSyncUsage = jest.fn().mockRejectedValue(new Error('Test error'));

      (job as any).sync = {
        syncUsage: mockSyncUsage,
      };

      await job.runSync();

      expect(mockSyncUsage).toHaveBeenCalled();
      expect(job.getStatus().currentBackoffMs).toBeGreaterThan(0);
    });

    it('should respect dryRun config', async () => {
      job = new StripeUsageSyncJob();
      (job as any).config.dryRun = true;

      const mockSyncUsage = jest.fn().mockResolvedValue({
        success: true,
        licenseKey: 'bulk-sync',
        recordsSent: 0,
      });

      (job as any).sync = {
        syncUsage: mockSyncUsage,
      };

      await job.runSync();

      expect(mockSyncUsage).toHaveBeenCalledWith({ dryRun: true });
    });

    it('should filter by tenantIds if configured', async () => {
      job = new StripeUsageSyncJob();
      (job as any).config.tenantIds = ['tenant-1', 'tenant-2'];

      const mockSyncUsage = jest.fn().mockResolvedValue({
        success: true,
        licenseKey: 'bulk-sync',
        recordsSent: 2,
      });

      (job as any).sync = {
        syncUsage: mockSyncUsage,
      };

      await job.runSync();

      expect(mockSyncUsage).toHaveBeenCalledWith({
        dryRun: false,
        tenantIds: ['tenant-1', 'tenant-2'],
      });
    });
  });

  describe('applyBackoff', () => {
    beforeEach(() => {
      job = new StripeUsageSyncJob();
    });

    it('should double backoff on each failure', () => {
      const initialBackoff = (5 * 60 * 1000) * 0.5; // 50% of interval

      (job as any).applyBackoff();
      expect(job.getStatus().currentBackoffMs).toBe(initialBackoff);

      (job as any).applyBackoff();
      expect(job.getStatus().currentBackoffMs).toBe(initialBackoff * 2);

      (job as any).applyBackoff();
      expect(job.getStatus().currentBackoffMs).toBe(initialBackoff * 4);
    });

    it('should cap backoff at max', () => {
      const maxBackoff = 30 * 60 * 1000; // 30 minutes

      // Apply backoff multiple times
      for (let i = 0; i < 10; i++) {
        (job as any).applyBackoff();
      }

      expect(job.getStatus().currentBackoffMs).toBeLessThanOrEqual(maxBackoff);
    });
  });

  describe('updateConfig', () => {
    beforeEach(() => {
      job = new StripeUsageSyncJob();
    });

    it('should update interval', () => {
      job.updateConfig({ intervalMs: 10 * 60 * 1000 });
      expect(job.getStatus().intervalMs).toBe(10 * 60 * 1000);
    });

    it('should update dryRun', () => {
      job.updateConfig({ dryRun: true });
      expect(job.getStatus().dryRun).toBe(true);
    });

    it('should update multiple configs', () => {
      job.updateConfig({
        intervalMs: 15 * 60 * 1000,
        dryRun: true,
        enableBackoff: false,
      });
      const status = job.getStatus();
      expect(status.intervalMs).toBe(15 * 60 * 1000);
      expect(status.dryRun).toBe(true);
    });
  });

  describe('handlePolarWebhookReconciliation', () => {
    beforeEach(() => {
      job = new StripeUsageSyncJob();
    });

    it('should match when usage is identical', async () => {
      const mockGetUsage = jest.fn().mockResolvedValue({
        byEventType: {
          api_call: 100,
          compute_minute: 50,
          ml_inference: 25,
        },
      });

      (job as any).sync = {
        tracker: {
          getUsage: mockGetUsage,
        },
      };

      const result = await job.handlePolarWebhookReconciliation({
        subscription_id: 'sub_123',
        tenant_id: 'tenant-1',
        period: '2026-03',
        usage: {
          api_calls: 100,
          compute_minutes: 50,
          ml_inferences: 25,
        },
      });

      expect(result.matched).toBe(true);
      expect(result.discrepancies).toHaveLength(0);
      expect(result.message).toBe('Usage records match');
    });

    it('should detect discrepancies', async () => {
      const mockGetUsage = jest.fn().mockResolvedValue({
        byEventType: {
          api_call: 100,
          compute_minute: 50,
          ml_inference: 25,
        },
      });

      (job as any).sync = {
        tracker: {
          getUsage: mockGetUsage,
        },
      };

      const result = await job.handlePolarWebhookReconciliation({
        subscription_id: 'sub_123',
        tenant_id: 'tenant-1',
        period: '2026-03',
        usage: {
          api_calls: 150, // Different
          compute_minutes: 50,
          ml_inferences: 25,
        },
      });

      expect(result.matched).toBe(false);
      expect(result.discrepancies).toHaveLength(1);
      expect(result.discrepancies[0].metric).toBe('api_calls');
    });

    it('should allow 1% tolerance', async () => {
      const mockGetUsage = jest.fn().mockResolvedValue({
        byEventType: {
          api_call: 100,
          compute_minute: 50,
          ml_inference: 25,
        },
      });

      (job as any).sync = {
        tracker: {
          getUsage: mockGetUsage,
        },
      };

      const result = await job.handlePolarWebhookReconciliation({
        subscription_id: 'sub_123',
        tenant_id: 'tenant-1',
        period: '2026-03',
        usage: {
          api_calls: 101, // Within 1% tolerance
          compute_minutes: 50,
          ml_inferences: 25,
        },
      });

      expect(result.matched).toBe(true);
    });

    it('should handle missing usage data gracefully', async () => {
      const mockGetUsage = jest.fn().mockResolvedValue({
        byEventType: {},
      });

      (job as any).sync = {
        tracker: {
          getUsage: mockGetUsage,
        },
      };

      const result = await job.handlePolarWebhookReconciliation({
        subscription_id: 'sub_123',
        tenant_id: 'tenant-1',
        period: '2026-03',
        usage: {
          api_calls: 100,
          compute_minutes: 50,
          ml_inferences: 25,
        },
      });

      expect(result.matched).toBe(false);
      expect(result.discrepancies.length).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', async () => {
      const mockGetUsage = jest.fn().mockRejectedValue(new Error('Database error'));

      (job as any).sync = {
        tracker: {
          getUsage: mockGetUsage,
        },
      };

      const result = await job.handlePolarWebhookReconciliation({
        subscription_id: 'sub_123',
        tenant_id: 'tenant-1',
        period: '2026-03',
      });

      expect(result.matched).toBe(false);
      expect(result.message).toContain('Reconciliation failed');
    });
  });
});

describe('createStripeUsageSyncJob', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should create and start job', () => {
    const job = createStripeUsageSyncJob();
    const status = job.getStatus();
    // Job is created and started - interval is set
    expect(status.intervalMs).toBe(5 * 60 * 1000);
  });

  it('should accept custom interval', () => {
    const job = createStripeUsageSyncJob(10 * 60 * 1000);
    expect(job.getStatus().intervalMs).toBe(10 * 60 * 1000);
  });
});

describe('DefaultRaasGatewayClient', () => {
  let client: DefaultRaasGatewayClient;
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
    global.fetch = jest.fn();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    client = new DefaultRaasGatewayClient('http://test-gateway:3003', 'test-api-key');
    jest.clearAllMocks();
  });

  describe('fetchUsageMetrics', () => {
    it('should fetch from RaaS Gateway KV', async () => {
      const mockResponse = {
        api_calls: 1000,
        compute_minutes: 50,
        ml_inferences: 200,
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.fetchUsageMetrics('tenant-1', {
        from: Date.now() - 24 * 60 * 60 * 1000,
        to: Date.now(),
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-gateway:3003/v1/usage/tenant-1',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-API-Key': 'test-api-key',
          }),
        })
      );

      expect(result.api_calls).toBe(1000);
      expect(result.compute_minutes).toBe(50);
    });

    it('should fallback to local tracker on Gateway error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await client.fetchUsageMetrics('tenant-1', {
        from: Date.now() - 24 * 60 * 60 * 1000,
        to: Date.now(),
      });

      // Should return zeros from local tracker (since it's not populated in tests)
      expect(result.api_calls).toBe(0);
      expect(result.compute_minutes).toBe(0);
    });

    it('should fallback to local tracker on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await client.fetchUsageMetrics('tenant-1', {
        from: Date.now() - 24 * 60 * 60 * 1000,
        to: Date.now(),
      });

      expect(result).toBeDefined();
    });
  });

  describe('aggregateBySubscriptionItem', () => {
    it('should aggregate with subscription item from metadata', async () => {
      mockLicenseFindFirst.mockResolvedValue({
        metadata: {
          stripeSubscriptionItemId: 'si_123',
          stripePriceId: 'price_456',
        },
      });

      const metrics: KVUsageMetrics = {
        api_calls: 1000,
        compute_minutes: 50,
        ml_inferences: 200,
        tenant_id: 'tenant-1',
        period_start: Date.now() - 24 * 60 * 60 * 1000,
        period_end: Date.now(),
      };

      const result = await client.aggregateBySubscriptionItem('tenant-1', metrics);

      expect(result.subscriptionItemId).toBe('si_123');
      expect(result.priceId).toBe('price_456');
      expect(result.apiCalls).toBe(1000);
    });

    it('should handle missing subscription item', async () => {
      mockLicenseFindFirst.mockResolvedValue(null);

      const metrics: KVUsageMetrics = {
        api_calls: 1000,
        compute_minutes: 50,
        ml_inferences: 200,
        tenant_id: 'tenant-1',
        period_start: Date.now() - 24 * 60 * 60 * 1000,
        period_end: Date.now(),
      };

      const result = await client.aggregateBySubscriptionItem('tenant-1', metrics);

      expect(result.subscriptionItemId).toBe('');
      expect(result.priceId).toBe('');
    });
  });
});
