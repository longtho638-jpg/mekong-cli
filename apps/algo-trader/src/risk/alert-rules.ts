/**
 * Alert Rules — Configurable alert rules with webhook support.
 *
 * Defines AlertRule interface, webhook handlers, and console logging fallback.
 */

import { RiskEventEmitter } from '../core/risk-events';
import { AlertEvent, AlertSeverity, AlertType } from '../risk/types';
import { logger } from '../utils/logger';

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  /** Webhook URL */
  url: string;
  /** HTTP method */
  method?: 'POST' | 'GET' | 'PUT';
  /** Headers to include */
  headers?: Record<string, string>;
  /** Secret for HMAC signature */
  secret?: string;
}

/**
 * Alert rule definition
 */
export interface AlertRule {
  /** Unique rule identifier */
  id: string;
  /** Rule name */
  name: string;
  /** Event types this rule applies to */
  eventTypes: AlertType[];
  /** Minimum severity to trigger */
  minSeverity: AlertSeverity;
  /** Whether rule is enabled */
  enabled: boolean;
  /** Webhook configuration (optional) */
  webhook?: WebhookConfig;
  /** Custom condition function (serialized as string) */
  condition?: string;
  /** Actions to take */
  actions: AlertAction[];
}

/**
 * Alert action types
 */
export type AlertAction =
  | { type: 'log'; level: 'info' | 'warn' | 'error' }
  | { type: 'webhook'; config: WebhookConfig }
  | { type: 'email'; to: string }
  | { type: 'slack'; channel: string }
  | { type: 'discord'; webhookUrl: string };

/**
 * Alert rule engine
 */
export class AlertRules {
  private rules: Map<string, AlertRule> = new Map();
  private eventEmitter: RiskEventEmitter;

  constructor() {
    this.eventEmitter = RiskEventEmitter.getInstance();
    this.setupDefaultRules();
    this.listenToEvents();
  }

  /**
   * Setup default alert rules
   */
  private setupDefaultRules(): void {
    // PnL Alert Rule
    this.addRule({
      id: 'pnl-alert',
      name: 'PnL Threshold Alert',
      eventTypes: ['pnl:alert'],
      minSeverity: 'warning',
      enabled: true,
      actions: [
        { type: 'log', level: 'warn' },
      ],
    });

    // Drawdown Warning Rule
    this.addRule({
      id: 'drawdown-warning',
      name: 'Drawdown Warning',
      eventTypes: ['drawdown:warning'],
      minSeverity: 'warning',
      enabled: true,
      actions: [
        { type: 'log', level: 'warn' },
      ],
    });

    // Circuit Breaker Trip Rule
    this.addRule({
      id: 'circuit-trip',
      name: 'Circuit Breaker Trip',
      eventTypes: ['circuit:trip'],
      minSeverity: 'critical',
      enabled: true,
      actions: [
        { type: 'log', level: 'error' },
      ],
    });

    // Limit Breached Rule
    this.addRule({
      id: 'limit-breached',
      name: 'Position Limit Breached',
      eventTypes: ['limit:breached'],
      minSeverity: 'warning',
      enabled: true,
      actions: [
        { type: 'log', level: 'warn' },
      ],
    });
  }

  /**
   * Add a new alert rule
   */
  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    logger.info(`[AlertRules] Added rule: ${rule.name}`);
  }

  /**
   * Remove a rule
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
    logger.info(`[AlertRules] Removed rule: ${ruleId}`);
  }

  /**
   * Enable/disable a rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      this.rules.set(ruleId, rule);
    }
  }

  /**
   * Add webhook to a rule
   */
  addWebhook(ruleId: string, config: WebhookConfig): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.webhook = config;
      rule.actions.push({ type: 'webhook', config });
      this.rules.set(ruleId, rule);
      logger.info(`[AlertRules] Added webhook to rule: ${ruleId}`);
    }
  }

  /**
   * Listen to risk events
   */
  private listenToEvents(): void {
    this.eventEmitter.onAny(async (event) => {
      await this.handleEvent(event);
    });
  }

  /**
   * Handle incoming event
   */
  private async handleEvent(event: AlertEvent): Promise<void> {
    for (const [, rule] of this.rules) {
      if (!rule.enabled) continue;
      if (!rule.eventTypes.includes(event.type)) continue;
      if (this.severityBelow(event.severity, rule.minSeverity)) continue;

      // Execute actions
      for (const action of rule.actions) {
        await this.executeAction(action, event);
      }
    }
  }

  /**
   * Check if severity is below threshold
   */
  private severityBelow(severity: AlertSeverity, threshold: AlertSeverity): boolean {
    const order: Record<AlertSeverity, number> = {
      info: 0,
      warning: 1,
      critical: 2,
    };
    return order[severity] < order[threshold];
  }

  /**
   * Execute alert action
   */
  private async executeAction(action: AlertAction, event: AlertEvent): Promise<void> {
    switch (action.type) {
      case 'log':
        this.logAction(action, event);
        break;

      case 'webhook':
        await this.webhookAction(action, event);
        break;

      case 'slack':
        await this.slackAction(action, event);
        break;

      case 'discord':
        await this.discordAction(action, event);
        break;

      case 'email':
        await this.emailAction(action, event);
        break;
    }
  }

  /**
   * Log action
   */
  private logAction(action: { type: 'log'; level: 'info' | 'warn' | 'error' }, event: AlertEvent): void {
    const message = `[Alert] ${event.type}: ${event.message}`;

    switch (action.level) {
      case 'info':
        logger.info(message);
        break;
      case 'warn':
        logger.warn(message);
        break;
      case 'error':
        logger.error(message);
        break;
    }
  }

  /**
   * Webhook action
   */
  private async webhookAction(
    action: { type: 'webhook'; config: WebhookConfig },
    event: AlertEvent,
  ): Promise<void> {
    try {
      const response = await fetch(action.config.url, {
        method: action.config.method ?? 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...action.config.headers,
        },
        body: JSON.stringify({
          type: event.type,
          severity: event.severity,
          message: event.message,
          timestamp: event.timestamp,
          metadata: event.metadata,
        }),
      });

      if (!response.ok) {
        logger.error(`[AlertRules] Webhook failed: ${response.status}`);
      }
    } catch (err) {
      logger.error(`[AlertRules] Webhook error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Slack action (placeholder)
   */
  private async slackAction(
    action: { type: 'slack'; channel: string },
    event: AlertEvent,
  ): Promise<void> {
    logger.info(`[AlertRules] Slack notification to #${action.channel}: ${event.message}`);
    // TODO: Implement Slack webhook integration
  }

  /**
   * Discord action (placeholder)
   */
  private async discordAction(
    action: { type: 'discord'; webhookUrl: string },
    event: AlertEvent,
  ): Promise<void> {
    logger.info(`[AlertRules] Discord notification: ${event.message}`);
    // TODO: Implement Discord webhook integration
  }

  /**
   * Email action (placeholder)
   */
  private async emailAction(
    action: { type: 'email'; to: string },
    event: AlertEvent,
  ): Promise<void> {
    logger.info(`[AlertRules] Email notification to ${action.to}: ${event.message}`);
    // TODO: Implement email integration
  }

  /**
   * Get all rules
   */
  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): AlertRule | undefined {
    return this.rules.get(ruleId);
  }
}
