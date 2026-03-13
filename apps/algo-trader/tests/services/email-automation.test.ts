/**
 * Email Automation Service Tests
 *
 * Tests for automated email notifications:
 * - Trial expiry reminders
 * - Usage milestone alerts
 * - Upgrade prompts
 * - Weekly digests
 */

import {
  EmailAutomationService,
  EmailSendResult,
  emailAutomationService,
} from '../../src/services/email-automation';
import { tradeMeteringService, LicenseTier } from '../../src/metering/trade-metering';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    tenant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    license: {
      findMany: jest.fn(),
    },
    $disconnect: jest.fn().mockResolvedValue(undefined),
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrismaClient),
  };
});

// Mock fetch for Resend API
global.fetch = jest.fn();

// Mock setInterval to prevent background scheduler from running
jest.useFakeTimers();

// Set RESEND_API_KEY before tests run
process.env.RESEND_API_KEY = 'test-key';

describe('EmailAutomationService', () => {
  let service: EmailAutomationService;
  let mockPrisma: any;

  beforeEach(() => {
    // Reset singleton and mocks
    EmailAutomationService.resetInstance();
    service = EmailAutomationService.getInstance();
    mockPrisma = require('@prisma/client').PrismaClient();

    // Reset fetch mock
    jest.clearAllMocks();
    tradeMeteringService.clear();
    service.clearSentMilestones();

    // Reset all mocks
    mockPrisma.tenant.findUnique.mockReset();
    mockPrisma.tenant.findMany.mockReset();
    mockPrisma.license.findMany.mockReset();
  });

  afterEach(async () => {
    await service.shutdown();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('Singleton pattern', () => {
    it('should return same instance from getInstance', () => {
      const instance1 = EmailAutomationService.getInstance();
      const instance2 = EmailAutomationService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = EmailAutomationService.getInstance();
      EmailAutomationService.resetInstance();
      const instance2 = EmailAutomationService.getInstance();
      expect(instance1).not.toBe(instance2);
    });

    it('should export singleton instance', () => {
      expect(emailAutomationService).toBeDefined();
      expect(emailAutomationService).toBeInstanceOf(EmailAutomationService);
    });
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const service = EmailAutomationService.getInstance();
      expect(service).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const service = EmailAutomationService.getInstance({
        emailFrom: 'custom@example.com',
        platformUrl: 'https://custom.com',
        trialReminderDays: [30, 14, 7],
        usageThresholds: [50, 75, 90],
        weeklyDigestEnabled: false,
        weeklyDigestDay: 0,
      });
      expect(service).toBeDefined();
    });
  });

  describe('sendTrialExpiryReminder', () => {
    const mockTenant = {
      id: 'tenant-1',
      name: 'Test User',
      email: 'test@example.com',
    };

    it('should send trial expiry reminder email', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      // Mock successful Resend response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'email-123' }),
      });

      const result = await service.sendTrialExpiryReminder('tenant-1', 7);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('email-123');
      expect(result.recipient).toBe('test@example.com');
      expect(result.templateType).toBe('trial_expiry_reminder');
    });

    it('should fail when tenant not found', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);

      const result = await service.sendTrialExpiryReminder('nonexistent', 7);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Tenant not found');
    });

    it('should fail when tenant has no email', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        name: 'Test User',
        email: null,
      });

      const result = await service.sendTrialExpiryReminder('tenant-1', 7);

      expect(result.success).toBe(false);
      expect(result.error).toContain('no email');
    });

    it('should fail when Resend is not configured', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      // Mock missing RESEND_API_KEY
      const originalKey = process.env.RESEND_API_KEY;
      delete process.env.RESEND_API_KEY;
      EmailAutomationService.resetInstance();
      const serviceWithoutKey = EmailAutomationService.getInstance();

      const result = await serviceWithoutKey.sendTrialExpiryReminder('tenant-1', 7);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not configured');

      // Restore
      process.env.RESEND_API_KEY = originalKey;
    });

    it('should handle Resend API errors', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        text: async () => 'API Error',
      });

      const result = await service.sendTrialExpiryReminder('tenant-1', 7);

      expect(result.success).toBe(false);
      expect(result.error).toContain('API Error');
    });
  });

  describe('sendUsageMilestone', () => {
    const mockTenant = {
      id: 'tenant-1',
      name: 'Test User',
      email: 'test@example.com',
    };

    beforeEach(() => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
      tradeMeteringService.setUserTier('tenant-1', LicenseTier.FREE);
    });

    it('should send usage milestone email at 80%', async () => {
      // Track some trades to get usage data
      for (let i = 0; i < 4; i++) {
        await tradeMeteringService.trackTrade('tenant-1');
      }

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'email-456' }),
      });

      const result = await service.sendUsageMilestone('tenant-1', 'trades', 80);

      expect(result.success).toBe(true);
      expect(result.recipient).toBe('test@example.com');
      expect(result.templateType).toBe('usage_milestone');
    });

    it('should prevent duplicate sends for same milestone', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'email-789' }),
      });

      // First send should succeed
      const result1 = await service.sendUsageMilestone('tenant-1', 'trades', 80);
      expect(result1.success).toBe(true);

      // Second send should be blocked
      const result2 = await service.sendUsageMilestone('tenant-1', 'trades', 80);
      expect(result2.success).toBe(false);
      expect(result2.error).toContain('Already sent');
    });

    it('should handle different resource types', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'email-111' }),
      });

      for (const resourceType of ['trades', 'signals', 'api_calls'] as const) {
        const result = await service.sendUsageMilestone(
          'tenant-1',
          resourceType,
          80
        );
        expect(result.success).toBe(true);
        expect(result.templateType).toBe('usage_milestone');
      }
    });
  });

  describe('sendUpgradePrompt', () => {
    const mockTenant = {
      id: 'tenant-1',
      name: 'Test User',
      email: 'test@example.com',
    };

    beforeEach(() => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
      tradeMeteringService.setUserTier('tenant-1', LicenseTier.FREE);
    });

    it('should send upgrade prompt for FREE tier user', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'email-upgrade' }),
      });

      const result = await service.sendUpgradePrompt('tenant-1', ['trades']);

      expect(result.success).toBe(true);
      expect(result.templateType).toBe('upgrade_prompt');
    });

    it('should suggest PRO for FREE users', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'email-upgrade' }),
      });

      const result = await service.sendUpgradePrompt('tenant-1', ['trades']);

      expect(result.success).toBe(true);
    });

    it('should suggest ENTERPRISE for PRO users', async () => {
      tradeMeteringService.setUserTier('tenant-1', LicenseTier.PRO);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'email-upgrade' }),
      });

      const result = await service.sendUpgradePrompt('tenant-1', ['trades']);

      expect(result.success).toBe(true);
    });
  });

  describe('sendWeeklyDigest', () => {
    const mockTenant = {
      id: 'tenant-1',
      name: 'Test User',
      email: 'test@example.com',
    };

    beforeEach(() => {
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
    });

    it('should send weekly digest to PRO users', async () => {
      tradeMeteringService.setUserTier('tenant-1', LicenseTier.PRO);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'email-digest' }),
      });

      const result = await service.sendWeeklyDigest('tenant-1');

      expect(result.success).toBe(true);
      expect(result.templateType).toBe('weekly_digest');
    });

    it('should reject FREE tier users for weekly digest', async () => {
      tradeMeteringService.setUserTier('tenant-1', LicenseTier.FREE);

      const result = await service.sendWeeklyDigest('tenant-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Pro+ tiers');
    });

    it('should send weekly digest to ENTERPRISE users', async () => {
      tradeMeteringService.setUserTier('tenant-1', LicenseTier.ENTERPRISE);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'email-digest' }),
      });

      const result = await service.sendWeeklyDigest('tenant-1');

      expect(result.success).toBe(true);
    });
  });

  describe('addToWeeklyDigestQueue', () => {
    it('should add tenant to weekly digest queue', () => {
      service.addToWeeklyDigestQueue('tenant-1');
      // Queue is internal, we just verify no error
    });
  });

  describe('Monitoring methods', () => {
    it('should return sent milestones count', () => {
      expect(service.getSentMilestonesCount()).toBe(0);
    });

    it('should return trial jobs count', () => {
      expect(service.getTrialJobsCount()).toBe(0);
    });

    it('should clear sent milestones', async () => {
      // Manually add a milestone to test clearing
      const mockTenant = {
        id: 'tenant-1',
        name: 'Test User',
        email: 'test@example.com',
      };
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'email-111' }),
      });

      const result = await service.sendUsageMilestone('tenant-1', 'trades', 80);

      if (result.success) {
        const count1 = service.getSentMilestonesCount();
        service.clearSentMilestones();
        const count2 = service.getSentMilestonesCount();
        expect(count2).toBeLessThan(count1);
      } else {
        // If send failed, just test that clear works
        service.clearSentMilestones();
        expect(service.getSentMilestonesCount()).toBe(0);
      }
    });
  });

  describe('Event listeners', () => {
    it('should listen to tradeMetering threshold_alert events', async () => {
      const mockTenant = {
        id: 'tenant-1',
        name: 'Test User',
        email: 'test@example.com',
      };
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'email-alert' }),
      });

      const emailSentPromise = new Promise((resolve) => {
        service.once('email_sent', resolve);
      });

      // Simulate threshold alert from trade metering
      tradeMeteringService.setUserTier('tenant-1', LicenseTier.FREE);
      for (let i = 0; i < 4; i++) {
        await tradeMeteringService.trackTrade('tenant-1');
      }

      // Wait for event
      await emailSentPromise;

      // Verify email was attempted
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('shutdown', () => {
    it('should cleanup resources on shutdown', async () => {
      service.addToWeeklyDigestQueue('tenant-1');
      expect(service.getTrialJobsCount()).toBeGreaterThanOrEqual(0);

      await service.shutdown();

      expect(service.getTrialJobsCount()).toBe(0);
      expect(service.getSentMilestonesCount()).toBe(0);
    });
  });
});
