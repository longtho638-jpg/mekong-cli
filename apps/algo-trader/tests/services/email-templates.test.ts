/**
 * Email Templates Service Tests
 *
 * Tests for email template generation functions.
 */

import {
  getEmailTemplate,
  getTrialExpiryTemplate,
  getUsageMilestoneTemplate,
  getUpgradePromptTemplate,
  getWeeklyDigestTemplate,
  TrialExpiryData,
  UsageMilestoneData,
  UpgradePromptData,
  WeeklyDigestData,
} from '../../src/services/email-templates';
import { LicenseTier } from '../../src/lib/raas-gate';

describe('Email Templates Service', () => {
  describe('getTrialExpiryTemplate', () => {
    const mockData: TrialExpiryData = {
      tenantId: 'tenant-1',
      tenantName: 'Test User',
      userEmail: 'test@example.com',
      trialEndsAt: new Date('2026-03-20'),
      daysRemaining: 7,
      tier: LicenseTier.FREE,
    };

    it('should generate template with correct subject', () => {
      const template = getTrialExpiryTemplate(mockData);
      expect(template.subject).toContain('IMPORTANT');
      expect(template.subject).toContain('7 Days');
    });

    it('should show URGENT for 3 days or less', () => {
      const urgentData = { ...mockData, daysRemaining: 3 };
      const template = getTrialExpiryTemplate(urgentData);
      expect(template.subject).toContain('URGENT');
    });

    it('should show REMINDER for more than 7 days', () => {
      const reminderData = { ...mockData, daysRemaining: 14 };
      const template = getTrialExpiryTemplate(reminderData);
      expect(template.subject).toContain('REMINDER');
    });

    it('should include tenant name in HTML', () => {
      const template = getTrialExpiryTemplate(mockData);
      expect(template.html).toContain('Dear Test User');
    });

    it('should include days remaining in HTML', () => {
      const template = getTrialExpiryTemplate(mockData);
      expect(template.html).toContain('7');
      expect(template.html).toContain('DAYS REMAINING');
    });

    it('should include upgrade URL', () => {
      const template = getTrialExpiryTemplate(mockData);
      expect(template.html).toContain('/pricing');
    });

    it('should generate text version', () => {
      const template = getTrialExpiryTemplate(mockData);
      expect(template.text).toContain('Test User');
      expect(template.text).toContain('7 Days');
      expect(template.text).not.toContain('<html>');
    });
  });

  describe('getUsageMilestoneTemplate', () => {
    const mockData: UsageMilestoneData = {
      tenantId: 'tenant-1',
      tenantName: 'Test User',
      userEmail: 'test@example.com',
      tier: LicenseTier.FREE,
      resourceType: 'trades',
      percentUsed: 80,
      currentUsage: 4,
      dailyLimit: 5,
      isExceeded: false,
    };

    it('should generate 80% milestone template', () => {
      const template = getUsageMilestoneTemplate(mockData);
      expect(template.subject).toContain('80%');
      expect(template.subject).toContain('📊');
    });

    it('should generate 100% limit reached template', () => {
      const exceededData = { ...mockData, percentUsed: 100, isExceeded: true };
      const template = getUsageMilestoneTemplate(exceededData);
      expect(template.subject).toContain('Limit Reached');
      expect(template.subject).toContain('⚠️');
    });

    it('should show correct resource type', () => {
      const template = getUsageMilestoneTemplate(mockData);
      expect(template.html).toContain('Trade Executions');
    });

    it('should handle signals resource type', () => {
      const signalsData: UsageMilestoneData = {
        ...mockData,
        resourceType: 'signals',
      };
      const template = getUsageMilestoneTemplate(signalsData);
      expect(template.html).toContain('Signal Consumptions');
    });

    it('should handle API calls resource type', () => {
      const apiData: UsageMilestoneData = {
        ...mockData,
        resourceType: 'api_calls',
      };
      const template = getUsageMilestoneTemplate(apiData);
      expect(template.html).toContain('API Calls');
    });

    it('should show usage statistics', () => {
      const template = getUsageMilestoneTemplate(mockData);
      expect(template.html).toContain('4'); // Used
      expect(template.html).toContain('5'); // Daily Limit
    });

    it('should include dashboard link', () => {
      const template = getUsageMilestoneTemplate(mockData);
      expect(template.html).toContain('/dashboard/usage');
    });
  });

  describe('getUpgradePromptTemplate', () => {
    const mockData: UpgradePromptData = {
      tenantId: 'tenant-1',
      tenantName: 'Test User',
      userEmail: 'test@example.com',
      currentTier: LicenseTier.FREE,
      suggestedTier: LicenseTier.PRO,
      exceededResources: ['trades', 'API calls'],
      upgradeUrl: '/pricing',
    };

    it('should generate upgrade prompt subject', () => {
      const template = getUpgradePromptTemplate(mockData);
      expect(template.subject).toContain('Upgrade to pro');
      expect(template.subject).toContain('Unlimited Trading');
    });

    it('should list exceeded resources', () => {
      const template = getUpgradePromptTemplate(mockData);
      expect(template.html).toContain('trades');
      expect(template.html).toContain('API calls');
    });

    it('should show comparison table', () => {
      const template = getUpgradePromptTemplate(mockData);
      expect(template.html).toContain('free');
      expect(template.html).toContain('pro');
    });

    it('should include upgrade button', () => {
      const template = getUpgradePromptTemplate(mockData);
      expect(template.html).toContain('Upgrade to pro Now');
    });

    it('should show PRO tier benefits', () => {
      const template = getUpgradePromptTemplate(mockData);
      expect(template.html).toContain('Unlimited trades');
      expect(template.html).toContain('Priority support');
    });

    it('should include money-back guarantee', () => {
      const template = getUpgradePromptTemplate(mockData);
      expect(template.html).toContain('30-day money-back guarantee');
    });

    it('should suggest ENTERPRISE for PRO users', () => {
      const enterpriseData: UpgradePromptData = {
        ...mockData,
        currentTier: LicenseTier.PRO,
        suggestedTier: LicenseTier.ENTERPRISE,
      };
      const template = getUpgradePromptTemplate(enterpriseData);
      expect(template.subject).toContain('Upgrade to enterprise');
    });
  });

  describe('getWeeklyDigestTemplate', () => {
    const mockData: WeeklyDigestData = {
      tenantId: 'tenant-1',
      tenantName: 'Test User',
      userEmail: 'test@example.com',
      tier: LicenseTier.PRO,
      weekStart: new Date('2026-03-01'),
      weekEnd: new Date('2026-03-07'),
      totalTrades: 50,
      totalSignals: 30,
      totalApiCalls: 500,
      successRate: 75.5,
      totalPnl: 250.50,
      topPerformer: 'BTC/USDT',
    };

    it('should generate weekly digest subject', () => {
      const template = getWeeklyDigestTemplate(mockData);
      expect(template.subject).toContain('Weekly Trading Digest');
      expect(template.subject).toContain('3/1/2026');
    });

    it('should show P&L with positive indicator', () => {
      const template = getWeeklyDigestTemplate(mockData);
      expect(template.html).toContain('📈');
      expect(template.html).toContain('$250.50');
    });

    it('should handle negative P&L', () => {
      const negativeData: WeeklyDigestData = {
        ...mockData,
        totalPnl: -150.00,
      };
      const template = getWeeklyDigestTemplate(negativeData);
      expect(template.html).toContain('📉');
      expect(template.html).toContain('$-150.00');
    });

    it('should show all statistics', () => {
      const template = getWeeklyDigestTemplate(mockData);
      expect(template.html).toContain('50'); // Trades
      expect(template.html).toContain('30'); // Signals
      expect(template.html).toContain('500'); // API Calls
      expect(template.html).toContain('75.5%'); // Success Rate
    });

    it('should show top performer', () => {
      const template = getWeeklyDigestTemplate(mockData);
      expect(template.html).toContain('BTC/USDT');
    });

    it('should include pro tip based on success rate', () => {
      const template = getWeeklyDigestTemplate(mockData);
      expect(template.html).toContain('Pro Tip');
      expect(template.html).toContain('Great job');
    });

    it('should handle undefined P&L', () => {
      const noPnlData: WeeklyDigestData = {
        ...mockData,
        totalPnl: undefined,
      };
      const template = getWeeklyDigestTemplate(noPnlData);
      // Should not crash and should still show other stats
      expect(template.html).toContain('50');
    });

    it('should include notification preferences link', () => {
      const template = getWeeklyDigestTemplate(mockData);
      expect(template.html).toContain('/settings/notifications');
    });
  });

  describe('getEmailTemplate dispatcher', () => {
    it('should dispatch trial_expiry_reminder template', () => {
      const data: TrialExpiryData = {
        tenantId: 'tenant-1',
        tenantName: 'Test',
        userEmail: 'test@example.com',
        trialEndsAt: new Date(),
        daysRemaining: 7,
        tier: LicenseTier.FREE,
      };
      const template = getEmailTemplate('trial_expiry_reminder', data);
      expect(template.subject).toContain('Trial Expires');
    });

    it('should dispatch usage_milestone template', () => {
      const data: UsageMilestoneData = {
        tenantId: 'tenant-1',
        tenantName: 'Test',
        userEmail: 'test@example.com',
        tier: LicenseTier.FREE,
        resourceType: 'trades',
        percentUsed: 80,
        currentUsage: 4,
        dailyLimit: 5,
        isExceeded: false,
      };
      const template = getEmailTemplate('usage_milestone', data);
      expect(template.subject).toContain('80%');
    });

    it('should dispatch upgrade_prompt template', () => {
      const data: UpgradePromptData = {
        tenantId: 'tenant-1',
        tenantName: 'Test',
        userEmail: 'test@example.com',
        currentTier: LicenseTier.FREE,
        suggestedTier: LicenseTier.PRO,
        exceededResources: ['trades'],
        upgradeUrl: '/pricing',
      };
      const template = getEmailTemplate('upgrade_prompt', data);
      expect(template.subject).toContain('Upgrade');
    });

    it('should dispatch weekly_digest template', () => {
      const data: WeeklyDigestData = {
        tenantId: 'tenant-1',
        tenantName: 'Test',
        userEmail: 'test@example.com',
        tier: LicenseTier.PRO,
        weekStart: new Date(),
        weekEnd: new Date(),
        totalTrades: 10,
        totalSignals: 5,
        totalApiCalls: 100,
        successRate: 70,
      };
      const template = getEmailTemplate('weekly_digest', data);
      expect(template.subject).toContain('Weekly Trading Digest');
    });

    it('should throw error for unknown template type', () => {
      expect(() => {
        getEmailTemplate('unknown_type' as any, {} as any);
      }).toThrow('Unknown email template type');
    });
  });

  describe('Template HTML structure', () => {
    it('should generate valid HTML for all templates', () => {
      const templates = [
        getTrialExpiryTemplate({
          tenantId: '1',
          tenantName: 'Test',
          userEmail: 'test@example.com',
          trialEndsAt: new Date(),
          daysRemaining: 7,
          tier: LicenseTier.FREE,
        }),
        getUsageMilestoneTemplate({
          tenantId: '1',
          tenantName: 'Test',
          userEmail: 'test@example.com',
          tier: LicenseTier.FREE,
          resourceType: 'trades',
          percentUsed: 80,
          currentUsage: 4,
          dailyLimit: 5,
          isExceeded: false,
        }),
        getUpgradePromptTemplate({
          tenantId: '1',
          tenantName: 'Test',
          userEmail: 'test@example.com',
          currentTier: LicenseTier.FREE,
          suggestedTier: LicenseTier.PRO,
          exceededResources: ['trades'],
          upgradeUrl: '/pricing',
        }),
        getWeeklyDigestTemplate({
          tenantId: '1',
          tenantName: 'Test',
          userEmail: 'test@example.com',
          tier: LicenseTier.PRO,
          weekStart: new Date(),
          weekEnd: new Date(),
          totalTrades: 10,
          totalSignals: 5,
          totalApiCalls: 100,
          successRate: 70,
        }),
      ];

      for (const template of templates) {
        expect(template.html).toContain('<!DOCTYPE html>');
        expect(template.html).toContain('<html>');
        expect(template.html).toContain('</html>');
        expect(template.html).toContain('<style>');
      }
    });
  });
});
