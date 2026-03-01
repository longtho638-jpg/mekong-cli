/**
 * n8n-inspired Webhook Notifier for trading events.
 * Supports: trade notifications, signal alerts, risk warnings.
 * Features: retry with backoff, payload signing (HMAC-SHA256), batching.
 */

import * as crypto from 'crypto';
import * as https from 'https';
import * as http from 'http';
import { logger } from '../utils/logger';

export interface WebhookConfig {
  url: string;
  secret?: string;       // HMAC signing secret
  events: WebhookEventType[];
  retries?: number;      // Default: 3
  timeoutMs?: number;    // Default: 5000
}

export type WebhookEventType =
  | 'trade.executed'
  | 'signal.detected'
  | 'risk.alert'
  | 'drawdown.warning'
  | 'bot.started'
  | 'bot.stopped';

export interface WebhookPayload {
  id: string;
  event: WebhookEventType;
  timestamp: number;
  data: Record<string, unknown>;
}

export interface WebhookDeliveryResult {
  webhookUrl: string;
  statusCode: number;
  success: boolean;
  attempts: number;
  latency: number;
}

const MAX_LOG_ENTRIES = 200;
const DEFAULT_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 5000;
const BACKOFF_BASE_MS = 1000;

export class WebhookNotifier {
  private webhooks: WebhookConfig[] = [];
  private deliveryLog: WebhookDeliveryResult[] = [];

  register(config: WebhookConfig): void {
    const existing = this.webhooks.findIndex(w => w.url === config.url);
    if (existing >= 0) {
      this.webhooks[existing] = config;
      logger.info(`Webhook updated: ${config.url}`);
    } else {
      this.webhooks.push(config);
      logger.info(`Webhook registered: ${config.url} [${config.events.join(', ')}]`);
    }
  }

  unregister(url: string): void {
    const before = this.webhooks.length;
    this.webhooks = this.webhooks.filter(w => w.url !== url);
    if (this.webhooks.length < before) {
      logger.info(`Webhook unregistered: ${url}`);
    }
  }

  async notify(
    event: WebhookEventType,
    data: Record<string, unknown>
  ): Promise<WebhookDeliveryResult[]> {
    const targets = this.webhooks.filter(w => w.events.includes(event));
    if (targets.length === 0) return [];

    const payload: WebhookPayload = {
      id: crypto.randomUUID(),
      event,
      timestamp: Date.now(),
      data,
    };

    const results = await Promise.all(
      targets.map(config => this.sendWithRetry(config.url, payload, config))
    );

    for (const result of results) {
      this.deliveryLog.push(result);
    }
    // Cap log at 200 entries (drop oldest)
    if (this.deliveryLog.length > MAX_LOG_ENTRIES) {
      this.deliveryLog = this.deliveryLog.slice(-MAX_LOG_ENTRIES);
    }

    return results;
  }

  private signPayload(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  private async sendWithRetry(
    url: string,
    payload: WebhookPayload,
    config: WebhookConfig
  ): Promise<WebhookDeliveryResult> {
    const maxAttempts = (config.retries ?? DEFAULT_RETRIES) + 1;
    const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const body = JSON.stringify(payload);
    let lastStatus = 0;
    const start = Date.now();

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (attempt > 1) {
        const delay = BACKOFF_BASE_MS * Math.pow(2, attempt - 2); // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      try {
        lastStatus = await this.sendRequest(url, body, config.secret, timeoutMs);
        const success = lastStatus >= 200 && lastStatus < 300;

        if (success) {
          logger.info(`Webhook delivered [${payload.event}] → ${url} (${lastStatus}) attempt=${attempt}`);
          return { webhookUrl: url, statusCode: lastStatus, success: true, attempts: attempt, latency: Date.now() - start };
        }

        logger.warn(`Webhook attempt ${attempt}/${maxAttempts} failed [${lastStatus}] → ${url}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.warn(`Webhook attempt ${attempt}/${maxAttempts} error → ${url}: ${msg}`);
      }
    }

    logger.error(`Webhook delivery failed after ${maxAttempts} attempts → ${url}`);
    return { webhookUrl: url, statusCode: lastStatus, success: false, attempts: maxAttempts, latency: Date.now() - start };
  }

  private sendRequest(
    url: string,
    body: string,
    secret: string | undefined,
    timeoutMs: number
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const transport = parsed.protocol === 'https:' ? https : http;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body).toString(),
        'User-Agent': 'algo-trader-webhook/1.0',
      };

      if (secret) {
        headers['X-Webhook-Signature'] = `sha256=${this.signPayload(body, secret)}`;
      }

      const req = transport.request(
        {
          hostname: parsed.hostname,
          port: parsed.port,
          path: parsed.pathname + parsed.search,
          method: 'POST',
          headers,
        },
        res => resolve(res.statusCode ?? 0)
      );

      req.setTimeout(timeoutMs, () => {
        req.destroy(new Error(`Webhook timeout after ${timeoutMs}ms`));
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  getDeliveryLog(limit?: number): WebhookDeliveryResult[] {
    return limit ? this.deliveryLog.slice(-limit) : [...this.deliveryLog];
  }

  listWebhooks(): WebhookConfig[] {
    return [...this.webhooks];
  }
}
