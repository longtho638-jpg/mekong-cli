/**
 * Alert Notification System — ROIaaS Phase 7
 *
 * Real-time signal alerts, daily PnL summary, portfolio risk alerts, subscription expiry warnings.
 * Tier-based notification delivery:
 * - FREE: Delayed digest (daily summary via email)
 * - PRO: Real-time notifications (webhook + email + Telegram)
 * - ENTERPRISE: Real-time + SMS + custom webhooks
 */

import { EventEmitter } from 'events';
import { LicenseService, LicenseTier } from '../lib/raas-gate';
import { tradeMeteringService } from '../metering/trade-metering';
import { logger } from '../utils/logger';

/**
 * Alert severity levels
 */
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Alert types
 */
export type AlertType =
  | 'signal_generated'
  | 'daily_pnl_summary'
  | 'portfolio_risk_warning'
  | 'subscription_expiring'
  | 'subscription_expired'
  | 'usage_limit_warning'
  | 'trade_executed'
  | 'stop_loss_triggered'
  | 'take_profit_triggered';

/**
 * Notification channel
 */
export type NotificationChannel = 'email' | 'sms' | 'telegram' | 'webhook' | 'push' | 'digest';

/**
 * Alert payload
 */
export interface AlertPayload {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  data?: Record<string, unknown> | DailyPnLSummary | PortfolioRiskAlert | SubscriptionExpiryWarning;
  timestamp: number;
  userId: string;
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  telegramEnabled: boolean;
  webhookEnabled: boolean;
  pushEnabled: boolean;
  realtimeEnabled: boolean; // PRO+ feature
  digestEnabled: boolean; // FREE tier default
  alertTypes: Partial<Record<AlertType, boolean>>;
  webhookUrl?: string;
  telegramChatId?: string;
  phoneNumber?: string;
}

/**
 * Daily PnL summary
 */
export interface DailyPnLSummary {
  userId: string;
  date: string;
  totalPnL: number;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  bestTrade: number;
  worstTrade: number;
  avgWin: number;
  avgLoss: number;
}

/**
 * Portfolio risk alert
 */
export interface PortfolioRiskAlert {
  userId: string;
  currentDrawdown: number;
  maxDrawdownLimit: number;
  dailyPnL: number;
  dailyLossLimit: number;
  exposurePercent: number;
  exposureLimit: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Subscription expiry warning
 */
export interface SubscriptionExpiryWarning {
  userId: string;
  tier: LicenseTier;
  expiresAt: Date;
  daysRemaining: number;
  autoRenew: boolean;
}

/**
 * Alert delivery result
 */
export interface AlertDeliveryResult {
  channel: NotificationChannel;
  success: boolean;
  messageId?: string;
  error?: string;
  deliveredAt?: number;
}

/**
 * Alert notification system
 */
export class AlertNotificationSystem extends EventEmitter {
  private static instance: AlertNotificationSystem;
  private licenseService: LicenseService;
  private preferencesStore: Map<string, NotificationPreferences>;
  private alertQueue: AlertPayload[];
  private digestQueue: Map<string, AlertPayload[]>; // userId -> alerts
  private digestInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.licenseService = LicenseService.getInstance();
    this.preferencesStore = new Map();
    this.alertQueue = [];
    this.digestQueue = new Map();
    this.startDigestScheduler();
  }

  static getInstance(): AlertNotificationSystem {
    if (!AlertNotificationSystem.instance) {
      AlertNotificationSystem.instance = new AlertNotificationSystem();
    }
    return AlertNotificationSystem.instance;
  }

  /**
   * Set user notification preferences
   */
  setPreferences(userId: string, prefs: Partial<NotificationPreferences>): void {
    const existing = this.preferencesStore.get(userId) || this.getDefaultPreferences(userId);
    this.preferencesStore.set(userId, { ...existing, ...prefs, userId });
    logger.info(`[AlertSystem] Preferences updated for user ${userId.substring(0, 8)}...`);
  }

  /**
   * Get user notification preferences
   */
  getPreferences(userId: string): NotificationPreferences {
    return this.preferencesStore.get(userId) || this.getDefaultPreferences(userId);
  }

  /**
   * Send real-time alert
   */
  async sendAlert(payload: AlertPayload): Promise<AlertDeliveryResult[]> {
    const prefs = this.getPreferences(payload.userId);
    const tier = this.licenseService.getTier();

    // Track usage
    await tradeMeteringService.trackApiCall(payload.userId, 'send_alert');

    // FREE tier: Only digest, no real-time
    if (tier === LicenseTier.FREE && !prefs.realtimeEnabled) {
      this.queueForDigest(payload);
      return [{ channel: 'digest', success: true, messageId: 'queued_for_digest' }];
    }

    const results: AlertDeliveryResult[] = [];

    // Determine channels based on tier
    const channels = this.getAllowedChannels(tier, prefs);

    for (const channel of channels) {
      try {
        const result = await this.deliverToChannel(payload, channel, prefs);
        results.push(result);
      } catch (error) {
        logger.error(`[AlertSystem] Failed to deliver to ${channel}: ${error instanceof Error ? error.message : String(error)}`);
        results.push({
          channel,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Emit event for real-time subscribers
    this.emit('alert', payload);

    return results;
  }

  /**
   * Send signal generated alert
   */
  async sendSignalAlert(
    userId: string,
    signalType: 'BUY' | 'SELL',
    symbol: string,
    confidence: number
  ): Promise<AlertDeliveryResult[]> {
    return this.sendAlert({
      type: 'signal_generated',
      severity: confidence > 0.8 ? 'high' : 'medium',
      title: `${signalType} Signal: ${symbol}`,
      message: `Confidence: ${(confidence * 100).toFixed(1)}%`,
      data: { signalType, symbol, confidence },
      timestamp: Date.now(),
      userId,
    });
  }

  /**
   * Send daily PnL summary
   */
  async sendDailyPnLSummary(userId: string, summary: DailyPnLSummary): Promise<AlertDeliveryResult[]> {
    return this.sendAlert({
      type: 'daily_pnl_summary',
      severity: summary.totalPnL >= 0 ? 'low' : 'medium',
      title: `Daily PnL Summary - ${summary.date}`,
      message: `PnL: $${summary.totalPnL.toFixed(2)} | Trades: ${summary.totalTrades} | Win Rate: ${summary.winRate.toFixed(1)}%`,
      data: summary,
      timestamp: Date.now(),
      userId,
    });
  }

  /**
   * Send portfolio risk warning
   */
  async sendPortfolioRiskAlert(userId: string, risk: PortfolioRiskAlert): Promise<AlertDeliveryResult[]> {
    const severity: AlertSeverity =
      risk.riskLevel === 'critical' ? 'critical' :
      risk.riskLevel === 'high' ? 'high' : 'medium';

    return this.sendAlert({
      type: 'portfolio_risk_warning',
      severity,
      title: `Portfolio Risk Alert - ${risk.riskLevel.toUpperCase()}`,
      message: `Drawdown: ${risk.currentDrawdown.toFixed(2)}% | Daily PnL: $${risk.dailyPnL.toFixed(2)}`,
      data: risk,
      timestamp: Date.now(),
      userId,
    });
  }

  /**
   * Send subscription expiry warning
   */
  async sendSubscriptionExpiryWarning(userId: string, warning: SubscriptionExpiryWarning): Promise<AlertDeliveryResult[]> {
    return this.sendAlert({
      type: 'subscription_expiring',
      severity: warning.daysRemaining <= 3 ? 'critical' : 'high',
      title: `Subscription Expiring in ${warning.daysRemaining} Days`,
      message: `Your ${warning.tier.toUpperCase()} subscription expires on ${warning.expiresAt.toLocaleDateString()}`,
      data: warning,
      timestamp: Date.now(),
      userId,
    });
  }

  /**
   * Send usage limit warning
   */
  async sendUsageLimitWarning(
    userId: string,
    resourceType: string,
    used: number,
    limit: number
  ): Promise<AlertDeliveryResult[]> {
    const percentUsed = (used / limit) * 100;

    return this.sendAlert({
      type: 'usage_limit_warning',
      severity: percentUsed >= 100 ? 'critical' : 'high',
      title: `${resourceType} Limit ${percentUsed >= 100 ? 'Exceeded' : 'Warning'}`,
      message: `You've used ${used} of ${limit} ${resourceType} (${percentUsed.toFixed(1)}%)`,
      data: { resourceType, used, limit, percentUsed },
      timestamp: Date.now(),
      userId,
    });
  }

  /**
   * Get default preferences for user
   */
  private getDefaultPreferences(userId: string): NotificationPreferences {
    const tier = this.licenseService.getTier();

    return {
      userId,
      emailEnabled: true,
      smsEnabled: tier === LicenseTier.ENTERPRISE,
      telegramEnabled: tier !== LicenseTier.FREE,
      webhookEnabled: tier !== LicenseTier.FREE,
      pushEnabled: true,
      realtimeEnabled: tier !== LicenseTier.FREE,
      digestEnabled: tier === LicenseTier.FREE,
      alertTypes: {
        signal_generated: true,
        daily_pnl_summary: true,
        portfolio_risk_warning: true,
        subscription_expiring: true,
        trade_executed: true,
      },
    };
  }

  /**
   * Get allowed channels for tier
   */
  private getAllowedChannels(
    tier: LicenseTier,
    prefs: NotificationPreferences
  ): NotificationChannel[] {
    const channels: NotificationChannel[] = [];

    if (prefs.emailEnabled) channels.push('email');
    if (prefs.telegramEnabled) channels.push('telegram');

    // PRO+ features
    if (tier !== LicenseTier.FREE) {
      if (prefs.webhookEnabled && prefs.webhookUrl) channels.push('webhook');
      if (prefs.pushEnabled) channels.push('push');
    }

    // ENTERPRISE only
    if (tier === LicenseTier.ENTERPRISE) {
      if (prefs.smsEnabled && prefs.phoneNumber) channels.push('sms');
    }

    return channels;
  }

  /**
   * Deliver alert to specific channel
   */
  private async deliverToChannel(
    payload: AlertPayload,
    channel: NotificationChannel,
    prefs: NotificationPreferences
  ): Promise<AlertDeliveryResult> {
    // In production, implement actual delivery logic for each channel
    // For now, simulate delivery

    logger.info(`[AlertSystem] Delivering "${payload.title}" to ${channel}`);

    switch (channel) {
      case 'email':
        return this.deliverEmail(payload, prefs);
      case 'telegram':
        return this.deliverTelegram(payload, prefs);
      case 'webhook':
        return this.deliverWebhook(payload, prefs);
      case 'sms':
        return this.deliverSms(payload, prefs);
      case 'push':
        return this.deliverPush(payload, prefs);
      default:
        return { channel, success: false, error: 'Unknown channel' };
    }
  }

  /**
   * Deliver via email
   */
  private async deliverEmail(
    payload: AlertPayload,
    _prefs: NotificationPreferences
  ): Promise<AlertDeliveryResult> {
    // TODO: Implement with Resend/SendGrid
    // Simulate successful delivery
    return {
      channel: 'email',
      success: true,
      messageId: `email_${Date.now()}`,
      deliveredAt: Date.now(),
    };
  }

  /**
   * Deliver via Telegram
   */
  private async deliverTelegram(
    payload: AlertPayload,
    prefs: NotificationPreferences
  ): Promise<AlertDeliveryResult> {
    if (!prefs.telegramChatId || !process.env.TELEGRAM_BOT_TOKEN) {
      return { channel: 'telegram', success: false, error: 'Telegram not configured' };
    }

    // TODO: Implement Telegram API call
    return {
      channel: 'telegram',
      success: true,
      messageId: `tg_${Date.now()}`,
      deliveredAt: Date.now(),
    };
  }

  /**
   * Deliver via webhook
   */
  private async deliverWebhook(
    payload: AlertPayload,
    prefs: NotificationPreferences
  ): Promise<AlertDeliveryResult> {
    if (!prefs.webhookUrl) {
      return { channel: 'webhook', success: false, error: 'No webhook URL configured' };
    }

    try {
      const response = await fetch(prefs.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`);
      }

      return {
        channel: 'webhook',
        success: true,
        messageId: `webhook_${Date.now()}`,
        deliveredAt: Date.now(),
      };
    } catch (error) {
      return {
        channel: 'webhook',
        success: false,
        error: error instanceof Error ? error.message : 'Webhook delivery failed',
      };
    }
  }

  /**
   * Deliver via SMS
   */
  private async deliverSms(
    payload: AlertPayload,
    prefs: NotificationPreferences
  ): Promise<AlertDeliveryResult> {
    if (!prefs.phoneNumber || !process.env.TWILIO_ACCOUNT_SID) {
      return { channel: 'sms', success: false, error: 'SMS not configured' };
    }

    // TODO: Implement Twilio API call
    return {
      channel: 'sms',
      success: true,
      messageId: `sms_${Date.now()}`,
      deliveredAt: Date.now(),
    };
  }

  /**
   * Deliver via push notification
   */
  private async deliverPush(
    payload: AlertPayload,
    _prefs: NotificationPreferences
  ): Promise<AlertDeliveryResult> {
    // TODO: Implement push notification (e.g., Firebase Cloud Messaging)
    return {
      channel: 'push',
      success: true,
      messageId: `push_${Date.now()}`,
      deliveredAt: Date.now(),
    };
  }

  /**
   * Queue alert for digest delivery
   */
  private queueForDigest(payload: AlertPayload): void {
    const existing = this.digestQueue.get(payload.userId) || [];
    existing.push(payload);
    this.digestQueue.set(payload.userId, existing);
    logger.info(`[AlertSystem] Alert queued for digest: ${payload.type}`);
  }

  /**
   * Send digest to user
   */
  async sendDigest(userId: string): Promise<AlertDeliveryResult[]> {
    const alerts = this.digestQueue.get(userId) || [];
    if (alerts.length === 0) {
      return [];
    }

    // Clear digest queue
    this.digestQueue.delete(userId);

    // Create summary alert
    const summaryPayload: AlertPayload = {
      type: 'daily_pnl_summary',
      severity: 'low',
      title: `Daily Digest - ${alerts.length} Alerts`,
      message: alerts.map(a => `${a.title}: ${a.message}`).join('\n'),
      data: { alertCount: alerts.length, alerts },
      timestamp: Date.now(),
      userId,
    };

    return this.sendAlert(summaryPayload);
  }

  /**
   * Start digest scheduler (runs daily at midnight UTC)
   */
  private startDigestScheduler(): void {
    if (this.digestInterval) {
      clearInterval(this.digestInterval);
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    this.digestInterval = setInterval(() => {
      this.runDailyDigest();
    }, msUntilMidnight);

    logger.info('[AlertSystem] Digest scheduler started');
  }

  /**
   * Run daily digest for all users with digest enabled
   */
  private async runDailyDigest(): Promise<void> {
    logger.info('[AlertSystem] Running daily digest');

    for (const [userId, prefs] of this.preferencesStore.entries()) {
      if (prefs.digestEnabled && !prefs.realtimeEnabled) {
        await this.sendDigest(userId);
      }
    }
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    if (AlertNotificationSystem.instance) {
      AlertNotificationSystem.instance.removeAllListeners();
    }
    AlertNotificationSystem.instance = new AlertNotificationSystem();
  }

  /**
   * Shutdown system
   */
  shutdown(): void {
    if (this.digestInterval) {
      clearInterval(this.digestInterval);
      this.digestInterval = null;
    }
  }
}

// Export singleton instance
export const alertNotificationSystem = AlertNotificationSystem.getInstance();
