/**
 * Dunning Enforcement Integration Tests
 * Tests for payment_failed → KV suspension → API blocking flow
 */

// Mock Prisma before any imports
const mockPrisma = {
  dunningState: {
    upsert: jest.fn().mockResolvedValue({
      tenantId: 'test',
      status: 'GRACE_PERIOD',
      failedPayments: 1,
      createdAt: new Date(),
      lastPaymentFailedAt: new Date(),
    }),
    update: jest.fn().mockResolvedValue({}),
    findUnique: jest.fn().mockResolvedValue(null),
  },
  dunningEvent: {
    create: jest.fn().mockResolvedValue({}),
  },
  $disconnect: jest.fn(),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
  DunningStatus: {
    ACTIVE: 'ACTIVE',
    GRACE_PERIOD: 'GRACE_PERIOD',
    SUSPENDED: 'SUSPENDED',
    REVOKED: 'REVOKED',
  },
}));

// Mock BillingNotificationService
jest.mock('../../src/notifications/billing-notification-service', () => ({
  BillingNotificationService: {
    getInstance: jest.fn(() => ({
      sendNotification: jest.fn().mockResolvedValue(undefined),
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

import { DunningStateMachine } from '../../src/billing/dunning-state-machine';
import { raasKVClient } from '../../src/lib/raas-gateway-kv-client';

describe('Dunning Enforcement Integration', () => {
  let machine: DunningStateMachine;

  beforeAll(() => {
    machine = DunningStateMachine.getInstance();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('KV Suspension Flag Sync', () => {
    const testTenantId = 'dunning-test-001';

    afterEach(async () => {
      // Cleanup
      await raasKVClient.setSuspension(testTenantId, {
        suspended: false,
        reason: 'payment_failed',
      });
    });

    it('should write suspension flag to KV when account is suspended', async () => {
      // First initialize the dunning state
      await machine.initializeTenant(testTenantId);

      // Simulate payment failure
      await machine.onPaymentFailed(testTenantId, {
        amount: 9900,
        currency: 'usd',
      });

      // Manually suspend (normally done by processGracePeriodTimeouts)
      await machine.suspendAccount(testTenantId);

      // Verify KV suspension flag was set
      const suspension = await raasKVClient.getSuspension(testTenantId);

      expect(suspension).toBeTruthy();
      expect(suspension?.suspended).toBe(true);
      expect(suspension?.reason).toBe('payment_failed');
      expect(suspension?.suspendedAt).toBeDefined();
    });

    it('should clear suspension flag from KV when payment is recovered', async () => {
      // Setup: suspend the account first
      await machine.initializeTenant(testTenantId);
      await machine.suspendAccount(testTenantId);

      // Verify suspended state
      let suspension = await raasKVClient.getSuspension(testTenantId);
      expect(suspension?.suspended).toBe(true);

      // Recover payment
      await machine.onPaymentRecovered(testTenantId, {
        amount: 9900,
        currency: 'usd',
      });

      // Verify KV suspension flag was cleared
      suspension = await raasKVClient.getSuspension(testTenantId);
      expect(suspension?.suspended).toBe(false);
    });

    it('should have correct suspension state after grace period', async () => {
      await machine.initializeTenant(testTenantId);

      // Simulate payment failure
      const result = await machine.onPaymentFailed(testTenantId);

      expect(result.status).toBe('GRACE_PERIOD');
      expect(result.failedPayments).toBe(1);
      expect(result.canRecover).toBe(true);
    });
  });

  describe('isSuspended Helper Method', () => {
    const testTenantId = 'dunning-test-002';

    afterEach(async () => {
      await raasKVClient.setSuspension(testTenantId, {
        suspended: false,
        reason: 'payment_failed',
      });
    });

    it('should return suspended: false when not suspended', async () => {
      // Set non-suspended state
      await raasKVClient.setSuspension(testTenantId, {
        suspended: false,
        reason: 'payment_failed',
      });

      const result = await raasKVClient.isSuspended(testTenantId);

      expect(result.suspended).toBe(false);
      expect(result.reason).toBeUndefined();
      expect(result.suspendedAt).toBeUndefined();
    });

    it('should return suspended: true with reason when suspended', async () => {
      // Set suspended state
      const suspendedAt = new Date().toISOString();
      await raasKVClient.setSuspension(testTenantId, {
        suspended: true,
        reason: 'payment_failed',
        suspendedAt,
      });

      const result = await raasKVClient.isSuspended(testTenantId);

      expect(result.suspended).toBe(true);
      expect(result.reason).toBe('payment_failed');
      expect(result.suspendedAt).toBe(suspendedAt);
    });

    it('should return suspended: false when KV is not configured', async () => {
      // Create unconfigured client
      const { RaaSGatewayKVClient } = await import('../../src/lib/raas-gateway-kv-client');
      const unconfiguredClient = new RaaSGatewayKVClient({
        apiToken: '',
        accountId: '',
        namespaceId: '',
      });

      const result = await unconfiguredClient.isSuspended(testTenantId);

      expect(result.suspended).toBe(false);
    });
  });
});
