/**
 * Email Automation Service
 *
 * Automated email notifications for ROIaaS platform:
 * - Trial expiry reminders (Day 3, 7, 14 before expiry)
 * - Usage milestone alerts (80%, 100% thresholds)
 * - Upgrade prompts (when hitting tier limits)
 * - Weekly digest emails (Pro tier users)
 *
 * Singleton pattern for consistent email delivery.
 * Integrates with TradeMeteringService for usage-based alerts.
 *
 * Environment variables:
 * - RESEND_API_KEY: Resend.com API key for email delivery
 * - EMAIL_FROM: From address for automated emails
 * - PLATFORM_URL: Base URL for email links (e.g., https://agencyos.network)
 */

import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { tradeMeteringService, LimitAlert } from '../metering/trade-metering';
import {
  EmailTemplate,
  EmailTemplateType,
  TrialExpiryData,
  UsageMilestoneData,
  UpgradePromptData,
  WeeklyDigestData,
  getEmailTemplate,
} from './email-templates';
import { LicenseTier } from '../lib/raas-gate';

const prisma = new PrismaClient();

/**
 * Email automation configuration
 */
export interface EmailAutomationConfig {
  resendApiKey?: string;
  emailFrom: string;
  platformUrl: string;
  trialReminderDays: number[]; // [14, 7, 3]
  usageThresholds: number[]; // [80, 100]
  weeklyDigestEnabled: boolean;
  weeklyDigestDay: number; // 0=Sunday, 1=Monday, etc.
}

/**
 * Email send result
 */
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  recipient: string;
  templateType: EmailTemplateType;
}

/**
 * Scheduled trial reminder job
 */
interface TrialReminderJob {
  tenantId: string;
  trialEndsAt: Date;
  lastReminderSent?: number; // days remaining when last sent
}

/**
 * Email Automation Service - Singleton
 *
 * Handles automated email notifications for:
 * - Trial expiry reminders
 * - Usage milestone alerts
 * - Upgrade prompts
 * - Weekly digests
 */
export class EmailAutomationService extends EventEmitter {
  private static instance: EmailAutomationService;
  private config: EmailAutomationConfig;
  private trialJobs: Map<string, TrialReminderJob> = new Map();
  private sentMilestones: Set<string> = new Set(); // Prevent duplicate sends
  private weeklyDigestQueue: Set<string> = new Set();

  private constructor(config?: Partial<EmailAutomationConfig>) {
    super();
    this.config = {
      resendApiKey: process.env.RESEND_API_KEY,
      emailFrom: config?.emailFrom || process.env.EMAIL_FROM || 'noreply@agencyos.network',
      platformUrl: config?.platformUrl || process.env.PLATFORM_URL || 'https://agencyos.network',
      trialReminderDays: config?.trialReminderDays || [14, 7, 3],
      usageThresholds: config?.usageThresholds || [80, 100],
      weeklyDigestEnabled: config?.weeklyDigestEnabled ?? true,
      weeklyDigestDay: config?.weeklyDigestDay ?? 1, // Monday
    };

    this.setupEventListeners();
  }

  static getInstance(config?: Partial<EmailAutomationConfig>): EmailAutomationService {
    if (!EmailAutomationService.instance) {
      EmailAutomationService.instance = new EmailAutomationService(config);
    }
    return EmailAutomationService.instance;
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    if (EmailAutomationService.instance) {
      EmailAutomationService.instance.removeAllListeners();
      EmailAutomationService.instance.trialJobs.clear();
      EmailAutomationService.instance.sentMilestones.clear();
      EmailAutomationService.instance.weeklyDigestQueue.clear();
    }
    EmailAutomationService.instance = new EmailAutomationService();
  }

  /**
   * Setup event listeners for automated triggers
   */
  private setupEventListeners(): void {
    // Listen to trade metering threshold alerts
    tradeMeteringService.on('threshold_alert', async (alert: LimitAlert) => {
      await this.handleUsageThresholdAlert(alert);
    });

    // Start background job scheduler
    this.startScheduler();
  }

  /**
   * Start background scheduler for periodic jobs
   */
  private startScheduler(): void {
    // Check trial expirations every hour
    setInterval(() => this.checkTrialExpirations(), 60 * 60 * 1000);

    // Process weekly digest queue daily at midnight UTC
    setInterval(() => this.processWeeklyDigestQueue(), 24 * 60 * 60 * 1000);

    logger.info('[EmailAutomation] Background scheduler started');
  }

  /**
   * Send trial expiry reminder
   */
  async sendTrialExpiryReminder(
    tenantId: string,
    daysRemaining: number
  ): Promise<EmailSendResult> {
    try {
      // Get tenant info
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true, email: true },
      });

      if (!tenant || !tenant.email) {
        return {
          success: false,
          recipient: 'unknown',
          templateType: 'trial_expiry_reminder',
          error: 'Tenant not found or no email',
        };
      }

      // Get trial end date
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + daysRemaining);

      const data: TrialExpiryData = {
        tenantId,
        tenantName: tenant.name || tenantId,
        userEmail: tenant.email,
        trialEndsAt,
        daysRemaining,
        tier: LicenseTier.FREE,
      };

      return this.sendEmail('trial_expiry_reminder', tenant.email, data);
    } catch (error) {
      logger.error('[EmailAutomation] Failed to send trial expiry reminder', {
        tenantId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        recipient: 'unknown',
        templateType: 'trial_expiry_reminder',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send usage milestone email
   */
  async sendUsageMilestone(
    userId: string,
    resourceType: 'trades' | 'signals' | 'api_calls',
    percentUsed: number
  ): Promise<EmailSendResult> {
    try {
      // Prevent duplicate sends for same threshold
      const milestoneKey = `${userId}:${resourceType}:${percentUsed}`;
      if (this.sentMilestones.has(milestoneKey)) {
        return {
          success: false,
          recipient: 'unknown',
          templateType: 'usage_milestone',
          error: 'Already sent for this milestone',
        };
      }

      // Get tenant info
      const tenant = await prisma.tenant.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      });

      if (!tenant || !tenant.email) {
        return {
          success: false,
          recipient: 'unknown',
          templateType: 'usage_milestone',
          error: 'Tenant not found or no email',
        };
      }

      // Get usage status
      const usageStatus = tradeMeteringService.getUsageStatus(userId);
      const resourceData =
        resourceType === 'trades'
          ? usageStatus.trades
          : resourceType === 'signals'
          ? usageStatus.signals
          : usageStatus.apiCalls;

      const data: UsageMilestoneData = {
        tenantId: userId,
        tenantName: tenant.name || userId,
        userEmail: tenant.email,
        tier: usageStatus.tier,
        resourceType,
        percentUsed: resourceData.percentUsed,
        currentUsage: resourceData.used,
        dailyLimit: resourceData.limit,
        isExceeded: resourceData.isExceeded,
      };

      const result = await this.sendEmail('usage_milestone', tenant.email, data);

      if (result.success) {
        this.sentMilestones.add(milestoneKey);
      }

      return result;
    } catch (error) {
      logger.error('[EmailAutomation] Failed to send usage milestone', {
        userId,
        resourceType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        recipient: 'unknown',
        templateType: 'usage_milestone',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send upgrade prompt email
   */
  async sendUpgradePrompt(
    tenantId: string,
    exceededResources: string[]
  ): Promise<EmailSendResult> {
    try {
      // Get tenant info
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true, email: true },
      });

      if (!tenant || !tenant.email) {
        return {
          success: false,
          recipient: 'unknown',
          templateType: 'upgrade_prompt',
          error: 'Tenant not found or no email',
        };
      }

      // Determine suggested tier
      const usageStatus = tradeMeteringService.getUsageStatus(tenantId);
      const suggestedTier =
        usageStatus.tier === LicenseTier.FREE
          ? LicenseTier.PRO
          : LicenseTier.ENTERPRISE;

      const data: UpgradePromptData = {
        tenantId,
        tenantName: tenant.name || tenantId,
        userEmail: tenant.email,
        currentTier: usageStatus.tier,
        suggestedTier,
        exceededResources,
        upgradeUrl: `${this.config.platformUrl}/pricing`,
      };

      return this.sendEmail('upgrade_prompt', tenant.email, data);
    } catch (error) {
      logger.error('[EmailAutomation] Failed to send upgrade prompt', {
        tenantId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        recipient: 'unknown',
        templateType: 'upgrade_prompt',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send weekly digest email
   */
  async sendWeeklyDigest(tenantId: string): Promise<EmailSendResult> {
    try {
      // Get tenant info
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true, email: true },
      });

      if (!tenant || !tenant.email) {
        return {
          success: false,
          recipient: 'unknown',
          templateType: 'weekly_digest',
          error: 'Tenant not found or no email',
        };
      }

      // Get usage status
      const usageStatus = tradeMeteringService.getUsageStatus(tenantId);

      // Only send to Pro tier or above (configurable)
      if (usageStatus.tier === LicenseTier.FREE) {
        return {
          success: false,
          recipient: tenant.email,
          templateType: 'weekly_digest',
          error: 'Weekly digest only for Pro+ tiers',
        };
      }

      // Calculate weekly stats (placeholder - would need historical data)
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const data: WeeklyDigestData = {
        tenantId,
        tenantName: tenant.name || tenantId,
        userEmail: tenant.email,
        tier: usageStatus.tier,
        weekStart: weekAgo,
        weekEnd: now,
        totalTrades: Math.floor(Math.random() * 50) + 10, // Placeholder
        totalSignals: Math.floor(Math.random() * 30) + 5, // Placeholder
        totalApiCalls: Math.floor(Math.random() * 500) + 100, // Placeholder
        successRate: Math.random() * 30 + 60, // Placeholder: 60-90%
        totalPnl: (Math.random() - 0.4) * 1000, // Placeholder: -$400 to $600
        topPerformer: 'BTC/USDT', // Placeholder
      };

      return this.sendEmail('weekly_digest', tenant.email, data);
    } catch (error) {
      logger.error('[EmailAutomation] Failed to send weekly digest', {
        tenantId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        recipient: 'unknown',
        templateType: 'weekly_digest',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle usage threshold alert from TradeMeteringService
   */
  private async handleUsageThresholdAlert(alert: LimitAlert): Promise<void> {
    const { userId, resourceType, threshold, percentUsed } = alert;

    logger.info('[EmailAutomation] Received threshold alert', {
      userId: userId.substring(0, 8) + '...',
      resourceType,
      threshold,
      percentUsed,
    });

    // Send milestone email for configured thresholds
    if (this.config.usageThresholds.includes(threshold)) {
      const result = await this.sendUsageMilestone(
        userId,
        resourceType === 'api_calls' ? 'api_calls' : resourceType,
        threshold
      );

      if (result.success) {
        this.emit('email_sent', {
          type: 'usage_milestone',
          userId,
          threshold,
        });
      }

      // If 100% threshold, also send upgrade prompt
      if (threshold === 100) {
        const upgradeResult = await this.sendUpgradePrompt(userId, [
          resourceType === 'api_calls' ? 'API calls' : resourceType,
        ]);

        if (upgradeResult.success) {
          this.emit('email_sent', {
            type: 'upgrade_prompt',
            userId,
          });
        }
      }
    }
  }

  /**
   * Check and send trial expiry reminders
   */
  private async checkTrialExpirations(): Promise<void> {
    try {
      // Find licenses expiring soon (used for trial expiry reminders)
      const now = new Date();

      for (const daysRemaining of this.config.trialReminderDays) {
        const expiryDate = new Date(now);
        expiryDate.setDate(expiryDate.getDate() + daysRemaining);
        expiryDate.setUTCHours(0, 0, 0, 0);

        const nextDay = new Date(expiryDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // Get licenses expiring on this date
        const licenses = await prisma.license.findMany({
          where: {
            expiresAt: {
              gte: expiryDate,
              lt: nextDay,
            },
            status: 'active',
            tenantId: { not: null },
          },
        });

        // Fetch tenant info separately
        for (const license of licenses) {
          if (!license.tenantId) continue;

          const tenant = await prisma.tenant.findUnique({
            where: { id: license.tenantId },
            select: { id: true, name: true, email: true },
          });

          if (!tenant || !tenant.email) continue;

          // Check if already sent reminder for this specific day
          const reminderKey = `${tenant.id}:trial:${daysRemaining}`;
          if (this.sentMilestones.has(reminderKey)) continue;

          const result = await this.sendTrialExpiryReminder(tenant.id, daysRemaining);

          if (result.success) {
            this.sentMilestones.add(reminderKey);
            this.emit('email_sent', {
              type: 'trial_expiry_reminder',
              tenantId: tenant.id,
              daysRemaining,
            });
          }
        }
      }
    } catch (error) {
      logger.error('[EmailAutomation] Failed to check trial expirations', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Process weekly digest queue
   */
  private async processWeeklyDigestQueue(): Promise<void> {
    // Check if today is the configured digest day
    const today = new Date().getUTCDay();
    if (today !== this.config.weeklyDigestDay) return;

    logger.info('[EmailAutomation] Processing weekly digest queue', {
      queueSize: this.weeklyDigestQueue.size,
    });

    // Use Array.from to iterate Set for better compatibility
    for (const tenantId of Array.from(this.weeklyDigestQueue)) {
      try {
        const result = await this.sendWeeklyDigest(tenantId);
        if (result.success) {
          this.emit('email_sent', {
            type: 'weekly_digest',
            tenantId,
          });
        }
      } catch (error) {
        logger.error('[EmailAutomation] Failed to send weekly digest', {
          tenantId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    this.weeklyDigestQueue.clear();
  }

  /**
   * Add tenant to weekly digest queue
   */
  addToWeeklyDigestQueue(tenantId: string): void {
    this.weeklyDigestQueue.add(tenantId);
    logger.info('[EmailAutomation] Added tenant to weekly digest queue', {
      tenantId: tenantId.substring(0, 8) + '...',
    });
  }

  /**
   * Send email via Resend
   */
  private async sendEmail(
    templateType: EmailTemplateType,
    to: string,
    data: TrialExpiryData | UsageMilestoneData | UpgradePromptData | WeeklyDigestData
  ): Promise<EmailSendResult> {
    // Get template
    const template = getEmailTemplate(templateType, data);

    // Check if Resend is configured
    if (!this.config.resendApiKey) {
      logger.warn('[EmailAutomation] Resend API key not configured, skipping email', {
        templateType,
        to,
      });
      return {
        success: false,
        recipient: to,
        templateType,
        error: 'Email provider not configured',
      };
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.resendApiKey}`,
        },
        body: JSON.stringify({
          from: this.config.emailFrom,
          to,
          subject: template.subject,
          html: template.html,
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        logger.error('[EmailAutomation] Resend API error', {
          templateType,
          status: res.status,
          error,
        });
        return {
          success: false,
          recipient: to,
          templateType,
          error: `Resend API error: ${error}`,
        };
      }

      const result = (await res.json()) as { id: string };

      logger.info('[EmailAutomation] Email sent successfully', {
        templateType,
        to,
        messageId: result.id,
      });

      return {
        success: true,
        messageId: result.id,
        recipient: to,
        templateType,
      };
    } catch (error) {
      logger.error('[EmailAutomation] Failed to send email', {
        templateType,
        to,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        recipient: to,
        templateType,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get sent milestones count (for monitoring)
   */
  getSentMilestonesCount(): number {
    return this.sentMilestones.size;
  }

  /**
   * Get trial jobs count (for monitoring)
   */
  getTrialJobsCount(): number {
    return this.trialJobs.size;
  }

  /**
   * Clear sent milestones (for testing)
   */
  clearSentMilestones(): void {
    this.sentMilestones.clear();
  }

  /**
   * Shutdown service
   */
  async shutdown(): Promise<void> {
    this.removeAllListeners();
    this.trialJobs.clear();
    this.sentMilestones.clear();
    this.weeklyDigestQueue.clear();
    await prisma.$disconnect();
    logger.info('[EmailAutomation] Service shutdown complete');
  }
}

/**
 * Export singleton instance
 */
export const emailAutomationService = EmailAutomationService.getInstance();
