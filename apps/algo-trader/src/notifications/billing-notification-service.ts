/**
 * Billing Notification Service
 *
 * Sends notifications via email, SMS, and Telegram for billing events:
 * - payment_failed: Initial payment failure
 * - grace_period_started: Account entered grace period
 * - account_suspended: API access blocked
 * - account_revoked: Account terminated
 * - payment_recovered: Payment successful, account restored
 * - overage_charged: Usage exceeded plan limits
 *
 * Environment variables:
 * - BILLING_EMAIL_FROM: From address for billing emails
 * - RESEND_API_KEY: Resend.com API key for email
 * - SENDGRID_API_KEY: Alternative SendGrid API key
 * - TWILIO_ACCOUNT_SID: Twilio account SID for SMS
 * - TWILIO_AUTH_TOKEN: Twilio auth token
 * - TWILIO_PHONE_NUMBER: Twilio phone number for SMS
 * - TELEGRAM_BOT_TOKEN: Telegram bot token
 * - TELEGRAM_ADMIN_CHAT_ID: Admin chat ID for notifications
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Notification channel types
 */
export type NotificationChannel = 'email' | 'sms' | 'telegram' | 'all';

/**
 * Notification severity levels
 */
export type NotificationSeverity = 'info' | 'warning' | 'critical';

/**
 * Billing event types
 */
export type BillingEventType =
  | 'payment_failed'
  | 'grace_period_started'
  | 'account_suspended'
  | 'account_revoked'
  | 'payment_recovered'
  | 'overage_charged';

/**
 * Notification channel configuration
 */
export interface ChannelConfig {
  email?: { to: string };
  sms?: { to: string };
  telegram?: { chatId: string };
}

/**
 * Notification template data
 */
export interface NotificationData {
  tenantId: string;
  tenantName?: string;
  amount?: number;
  currency?: string;
  period?: string;
  gracePeriodDays?: number;
  gracePeriodEndsAt?: Date;
  overageUnits?: number;
  overageCharge?: number;
  retryUrl?: string;
  supportUrl?: string;
}

/**
 * Notification result
 */
export interface NotificationResult {
  channel: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Email template for billing events
 */
function getEmailTemplate(
  eventType: BillingEventType,
  data: NotificationData
): { subject: string; html: string; text: string } {
  const supportUrl = data.supportUrl || 'https://agencyos.network/support';
  const retryUrl = data.retryUrl || 'https://agencyos.network/billing';

  switch (eventType) {
    case 'payment_failed':
      return {
        subject: 'Payment Failed - Action Required',
        html: `
          <h1>Payment Failed</h1>
          <p>Dear ${data.tenantName || 'Valued Customer'},</p>
          <p>We were unable to process your payment for ${data.currency || 'USD'} ${data.amount?.toFixed(2) || '0.00'}.</p>
          <p><strong>Account ID:</strong> ${data.tenantId}</p>
          <p>Please update your payment information to avoid service interruption.</p>
          <p><a href="${retryUrl}">Update Payment Method</a></p>
          <p>Questions? Contact <a href="${supportUrl}">Support</a></p>
        `,
        text: `Payment Failed\n\nDear ${data.tenantName || 'Valued Customer'},\n\nWe were unable to process your payment for ${data.currency || 'USD'} ${data.amount?.toFixed(2) || '0.00'}.\n\nAccount ID: ${data.tenantId}\n\nPlease update your payment method: ${retryUrl}\n\nSupport: ${supportUrl}`,
      };

    case 'grace_period_started':
      return {
        subject: `Grace Period Started - ${data.gracePeriodDays || 7} Days to Restore`,
        html: `
          <h1>Grace Period Started</h1>
          <p>Dear ${data.tenantName || 'Valued Customer'},</p>
          <p>Your account has entered a grace period due to payment failure.</p>
          <p><strong>Grace Period Ends:</strong> ${data.gracePeriodEndsAt?.toLocaleDateString() || 'in ' + (data.gracePeriodDays || 7) + ' days'}</p>
          <p>Your API access will continue during this period, but will be suspended if payment is not received.</p>
          <p><a href="${retryUrl}">Make Payment Now</a></p>
          <p>Questions? Contact <a href="${supportUrl}">Support</a></p>
        `,
        text: `Grace Period Started\n\nDear ${data.tenantName || 'Valued Customer'},\n\nYour account has entered a grace period. Grace period ends: ${data.gracePeriodEndsAt?.toLocaleDateString() || 'in ' + (data.gracePeriodDays || 7) + ' days'}.\n\nMake payment: ${retryUrl}\n\nSupport: ${supportUrl}`,
      };

    case 'account_suspended':
      return {
        subject: 'Account Suspended - Immediate Action Required',
        html: `
          <h1>Account Suspended</h1>
          <p>Dear ${data.tenantName || 'Valued Customer'},</p>
          <p><strong>Your account has been suspended due to non-payment.</strong></p>
          <p>API access is now blocked. To restore service, please make payment immediately.</p>
          <p><a href="${retryUrl}">Restore Account</a></p>
          <p>Questions? Contact <a href="${supportUrl}">Support</a></p>
        `,
        text: `Account Suspended\n\nDear ${data.tenantName || 'Valued Customer'},\n\nYour account has been suspended due to non-payment. API access is now blocked.\n\nRestore account: ${retryUrl}\n\nSupport: ${supportUrl}`,
      };

    case 'account_revoked':
      return {
        subject: 'Account Revoked - Final Notice',
        html: `
          <h1>Account Revoked</h1>
          <p>Dear ${data.tenantName || 'Valued Customer'},</p>
          <p><strong>Your account has been revoked due to prolonged non-payment.</strong></p>
          <p>All API access has been terminated. Your data will be deleted in 30 days.</p>
          <p>To discuss reinstatement, contact support immediately.</p>
          <p><a href="${supportUrl}">Contact Support</a></p>
        `,
        text: `Account Revoked\n\nDear ${data.tenantName || 'Valued Customer'},\n\nYour account has been revoked. All API access has been terminated. Data will be deleted in 30 days.\n\nContact support: ${supportUrl}`,
      };

    case 'payment_recovered':
      return {
        subject: 'Payment Received - Account Restored',
        html: `
          <h1>Payment Received - Thank You!</h1>
          <p>Dear ${data.tenantName || 'Valued Customer'},</p>
          <p>We have received your payment of ${data.currency || 'USD'} ${data.amount?.toFixed(2) || '0.00'}.</p>
          <p><strong>Your account has been restored to active status.</strong></p>
          <p>API access is now fully restored.</p>
          <p>Thank you for your business!</p>
          <p>Questions? Contact <a href="${supportUrl}">Support</a></p>
        `,
        text: `Payment Received\n\nDear ${data.tenantName || 'Valued Customer'},\n\nWe have received your payment of ${data.currency || 'USD'} ${data.amount?.toFixed(2) || '0.00'}. Your account has been restored.\n\nSupport: ${supportUrl}`,
      };

    case 'overage_charged':
      return {
        subject: `Overage Charge - ${data.period || 'Current Period'}`,
        html: `
          <h1>Overage Charge Notification</h1>
          <p>Dear ${data.tenantName || 'Valued Customer'},</p>
          <p>Your usage exceeded plan limits for the period ${data.period || 'current billing period'}.</p>
          <p><strong>Overage Details:</strong></p>
          <ul>
            <li>Overage Units: ${data.overageUnits || 0}</li>
            <li>Overage Charge: ${data.currency || 'USD'} ${data.overageCharge?.toFixed(2) || '0.00'}</li>
          </ul>
          <p>This charge will be added to your next invoice.</p>
          <p>Questions? Contact <a href="${supportUrl}">Support</a></p>
        `,
        text: `Overage Charge\n\nDear ${data.tenantName || 'Valued Customer'},\n\nYour usage exceeded plan limits for ${data.period || 'current billing period'}.\n\nOverage Units: ${data.overageUnits || 0}\nOverage Charge: ${data.currency || 'USD'} ${data.overageCharge?.toFixed(2) || '0.00'}\n\nSupport: ${supportUrl}`,
      };
  }
}

/**
 * SMS template for billing events (shorter format)
 */
function getSmsTemplate(
  eventType: BillingEventType,
  data: NotificationData
): string {
  const retryUrl = data.retryUrl || 'https://agencyos.network/billing';

  switch (eventType) {
    case 'payment_failed':
      return `Payment failed for ${data.currency || 'USD'} ${data.amount?.toFixed(2) || '0.00'}. Update payment: ${retryUrl}`;

    case 'grace_period_started':
      return `Grace period started. Ends ${data.gracePeriodEndsAt?.toLocaleDateString() || 'in ' + (data.gracePeriodDays || 7) + ' days'}. Pay now: ${retryUrl}`;

    case 'account_suspended':
      return `ACCOUNT SUSPENDED. API access blocked. Restore: ${retryUrl}`;

    case 'account_revoked':
      return `ACCOUNT REVOKED. API access terminated. Contact support: ${retryUrl}`;

    case 'payment_recovered':
      return `Payment received (${data.currency || 'USD'} ${data.amount?.toFixed(2) || '0.00'}). Account restored. Thank you!`;

    case 'overage_charged':
      return `Overage charge: ${data.currency || 'USD'} ${data.overageCharge?.toFixed(2) || '0.00'} for ${data.overageUnits || 0} units. Period: ${data.period || 'current'}.`;
  }
}

/**
 * Telegram template for billing events
 */
function getTelegramTemplate(
  eventType: BillingEventType,
  data: NotificationData
): string {
  const emoji: Record<BillingEventType, string> = {
    payment_failed: '❌',
    grace_period_started: '⚠️',
    account_suspended: '🚫',
    account_revoked: '⛔',
    payment_recovered: '✅',
    overage_charged: '📊',
  };

  const retryUrl = data.retryUrl || 'https://agencyos.network/billing';

  switch (eventType) {
    case 'payment_failed':
      return `${emoji.payment_failed} *Payment Failed*\n\nAmount: ${data.currency || 'USD'} ${data.amount?.toFixed(2) || '0.00'}\nAccount: ${data.tenantId}\n\n[Update Payment](${retryUrl})`;

    case 'grace_period_started':
      return `${emoji.grace_period_started} *Grace Period Started*\n\nEnds: ${data.gracePeriodEndsAt?.toLocaleDateString() || 'in ' + (data.gracePeriodDays || 7) + ' days'}\nAccount: ${data.tenantId}\n\n[Make Payment](${retryUrl})`;

    case 'account_suspended':
      return `${emoji.account_suspended} *ACCOUNT SUSPENDED*\n\nAPI access blocked.\n\n[Restore Account](${retryUrl})`;

    case 'account_revoked':
      return `${emoji.account_revoked} *ACCOUNT REVOKED*\n\nAPI access terminated. Data will be deleted in 30 days.\n\n[Contact Support](${retryUrl})`;

    case 'payment_recovered':
      return `${emoji.payment_recovered} *Payment Received*\n\nAmount: ${data.currency || 'USD'} ${data.amount?.toFixed(2) || '0.00'}\n\nAccount restored. Thank you!`;

    case 'overage_charged':
      return `${emoji.overage_charged} *Overage Charge*\n\nPeriod: ${data.period || 'current'}\nUnits: ${data.overageUnits || 0}\nCharge: ${data.currency || 'USD'} ${data.overageCharge?.toFixed(2) || '0.00'}`;
  }
}

/**
 * Billing Notification Service
 *
 * Singleton pattern for consistent notification delivery.
 */
export class BillingNotificationService {
  private static instance: BillingNotificationService;
  private emailEnabled: boolean;
  private smsEnabled: boolean;
  private telegramEnabled: boolean;

  private constructor() {
    this.emailEnabled = !!(process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY);
    this.smsEnabled = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
    this.telegramEnabled = !!process.env.TELEGRAM_BOT_TOKEN;
  }

  static getInstance(): BillingNotificationService {
    if (!BillingNotificationService.instance) {
      BillingNotificationService.instance = new BillingNotificationService();
    }
    return BillingNotificationService.instance;
  }

  /**
   * Send notification for a billing event
   */
  async sendNotification(
    eventType: BillingEventType,
    tenantId: string,
    channels: NotificationChannel[] = ['email', 'telegram'],
    data: NotificationData
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    // Get tenant info if not provided
    const tenantName = data.tenantName || await this.getTenantName(tenantId);

    const notificationData: NotificationData = {
      ...data,
      tenantId,
      tenantName,
    };

    // Send to each channel
    for (const channel of channels) {
      try {
        let result: NotificationResult;

        switch (channel) {
          case 'email':
            result = await this.sendEmail(eventType, tenantId, notificationData);
            break;
          case 'sms':
            result = await this.sendSms(eventType, tenantId, notificationData);
            break;
          case 'telegram':
            result = await this.sendTelegram(eventType, tenantId, notificationData);
            break;
          default:
            result = { channel, success: false, error: 'Unknown channel' };
        }

        results.push(result);
      } catch (error) {
        results.push({
          channel,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Log notification event to database
    await this.logNotificationEvent(tenantId, eventType, results);

    return results;
  }

  /**
   * Send email notification
   */
  private async sendEmail(
    eventType: BillingEventType,
    tenantId: string,
    data: NotificationData
  ): Promise<NotificationResult> {
    const template = getEmailTemplate(eventType, data);
    const from = process.env.BILLING_EMAIL_FROM || 'billing@agencyos.network';

    // Get tenant email from database
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, email: true },
    });

    if (!tenant) {
      return { channel: 'email', success: false, error: 'Tenant not found' };
    }

    const toEmail = tenant.email || 'customer@example.com';

    // Use Resend if available
    if (process.env.RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from,
          to: toEmail,
          subject: template.subject,
          html: template.html,
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        return { channel: 'email', success: false, error };
      }

      const result = await res.json() as { id: string };
      return { channel: 'email', success: true, messageId: result.id };
    }

    // Use SendGrid as fallback
    if (process.env.SENDGRID_API_KEY) {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: toEmail }] }],
          from: { email: from.split('@')[0], name: from.split('@')[0] },
          subject: template.subject,
          content: [{ type: 'text/html', value: template.html }],
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        return { channel: 'email', success: false, error };
      }

      return { channel: 'email', success: true };
    }

    // No email provider configured - log and skip
    logger.warn('[BillingNotification] No email provider configured');
    return { channel: 'email', success: false, error: 'No email provider configured' };
  }

  /**
   * Send SMS notification
   */
  private async sendSms(
    eventType: BillingEventType,
    tenantId: string,
    data: NotificationData
  ): Promise<NotificationResult> {
    const message = getSmsTemplate(eventType, data);

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      logger.warn('[BillingNotification] Twilio not configured');
      return { channel: 'sms', success: false, error: 'Twilio not configured' };
    }

    // TODO: Add phone field to Tenant schema and retrieve from database
    // For now, SMS notifications use placeholder until schema is updated
    const to = '+1234567890'; // Placeholder - add phone field to Tenant model

    const url = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
    const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');

    const params = new URLSearchParams({
      From: process.env.TWILIO_PHONE_NUMBER,
      To: to,
      Body: message,
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
      body: params,
    });

    if (!res.ok) {
      const error = await res.text();
      return { channel: 'sms', success: false, error };
    }

    const result = await res.json() as { sid: string };
    return { channel: 'sms', success: true, messageId: result.sid };
  }

  /**
   * Send Telegram notification
   */
  private async sendTelegram(
    eventType: BillingEventType,
    tenantId: string,
    data: NotificationData
  ): Promise<NotificationResult> {
    const message = getTelegramTemplate(eventType, data);

    if (!process.env.TELEGRAM_BOT_TOKEN) {
      logger.warn('[BillingNotification] Telegram bot not configured');
      return { channel: 'telegram', success: false, error: 'Telegram bot not configured' };
    }

    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID || data.tenantId;
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      return { channel: 'telegram', success: false, error };
    }

    const result = await res.json() as { result: { message_id: number } };
    return { channel: 'telegram', success: true, messageId: String(result.result.message_id) };
  }

  /**
   * Log notification event to database
   */
  private async logNotificationEvent(
    tenantId: string,
    eventType: BillingEventType,
    results: NotificationResult[]
  ): Promise<void> {
    const severity: Record<BillingEventType, 'info' | 'warning' | 'critical'> = {
      payment_failed: 'warning',
      grace_period_started: 'warning',
      account_suspended: 'critical',
      account_revoked: 'critical',
      payment_recovered: 'info',
      overage_charged: 'info',
    };

    // Convert results to JSON-serializable format
    const jsonMetadata = {
      notifications: results.map(r => ({
        channel: r.channel,
        success: r.success,
        messageId: r.messageId || null,
        error: r.error || null,
      })),
      timestamp: new Date().toISOString(),
    };

    await prisma.dunningEvent.create({
      data: {
        tenantId,
        eventType,
        severity: severity[eventType],
        metadata: jsonMetadata,
      },
    });
  }

  /**
   * Get tenant name from database
   */
  private async getTenantName(tenantId: string): Promise<string> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });
    return tenant?.name || tenantId;
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    BillingNotificationService.instance = new BillingNotificationService();
  }

  /**
   * Shutdown service
   */
  async shutdown(): Promise<void> {
    await prisma.$disconnect();
  }
}

// Export singleton instance
export const billingNotificationService = BillingNotificationService.getInstance();
