/**
 * Webhook Notifier with Retry and Circuit Breaker Support
 * Handles reliable webhook delivery with automatic retry and failure protection
 */

import { logger } from '../utils/logger';
import { RetryHandler, RetryConfig } from './retry-handler';
import { CircuitBreakerLegacy as CircuitBreaker, CircuitBreakerConfig } from './circuit-breaker';

export interface WebhookConfig {
  url: string;
  eventType: string | string[];
  headers?: Record<string, string>;
  timeoutMs?: number;
  retryConfig?: RetryConfig;
  circuitBreakerConfig?: CircuitBreakerConfig;
}

export interface WebhookPayload<T = unknown> {
  event: string;
  timestamp: number;
  data: T;
  signature?: string;
}

export interface WebhookRegistration {
  url: string;
  eventTypes: string[];
  headers?: Record<string, string>;
  createdAt: number;
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  error?: string;
  deliveredAt: number;
  attempts: number;
}

export interface WebhookHealthCheck {
  status: 'healthy' | 'unhealthy';
  details: {
    registeredWebhooks: number;
    circuitBreakerState?: string;
    hasRegistrations: boolean;
    error?: string;
  };
}

export class WebhookNotifier {
  private retryHandler?: RetryHandler;
  private circuitBreaker?: CircuitBreaker;
  private registeredWebhooks: Map<string, WebhookRegistration[]> = new Map();
  private readonly defaultTimeoutMs: number = 10000;

  constructor(
    private config: {
      hmacSecret?: string;
      maxConcurrentDeliveries?: number;
    } = {}
  ) {}

  registerWebhook(webhookConfig: WebhookConfig): void {
    const { url, eventType, headers } = webhookConfig;
    const eventTypes = Array.isArray(eventType) ? eventType : [eventType];

    if (!this.registeredWebhooks.has(url)) {
      this.registeredWebhooks.set(url, []);
    }

    const registrations = this.registeredWebhooks.get(url)!;

    if (webhookConfig.retryConfig) {
      this.retryHandler = new RetryHandler(webhookConfig.retryConfig);
    }

    if (webhookConfig.circuitBreakerConfig) {
      this.circuitBreaker = new CircuitBreaker(webhookConfig.circuitBreakerConfig);
    }

    registrations.push({
      url,
      eventTypes,
      headers,
      createdAt: Date.now()
    });

    logger.info(`Webhook registered: ${url} [${eventTypes.join(', ')}]`);
  }

  unregisterWebhook(url: string, eventType?: string | string[]): void {
    if (!this.registeredWebhooks.has(url)) {
      return;
    }

    if (!eventType) {
      this.registeredWebhooks.delete(url);
      logger.info(`Webhook unregistered: ${url}`);
      return;
    }

    const eventTypes = Array.isArray(eventType) ? eventType : [eventType];
    const registrations = this.registeredWebhooks.get(url)!;

    const filteredRegistrations = registrations.filter(reg =>
      !reg.eventTypes.some(et => eventTypes.includes(et))
    );

    if (filteredRegistrations.length === 0) {
      this.registeredWebhooks.delete(url);
    } else {
      this.registeredWebhooks.set(url, filteredRegistrations);
    }

    logger.info(`Webhook unregistered: ${url} [${eventTypes.join(', ')}]`);
  }

  async deliverToEvent(event: string, data: unknown): Promise<WebhookDeliveryResult[]> {
    const matchingWebhooks = this.getMatchingWebhooks(event);
    const results: WebhookDeliveryResult[] = [];

    for (const webhook of matchingWebhooks) {
      try {
        const result = await this.deliverToSingleWebhook(
          webhook.url,
          { event, timestamp: Date.now(), data },
          webhook.headers
        );
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : String(error),
          deliveredAt: Date.now(),
          attempts: 0
        });
      }
    }

    return results;
  }

  async deliverToSingleWebhook(
    url: string,
    payload: WebhookPayload,
    headers?: Record<string, string>
  ): Promise<WebhookDeliveryResult> {
    const deliveryStart = Date.now();
    let attempts = 0;

    try {
      const signedPayload = this.signPayload(payload);

      if (this.circuitBreaker) {
        return await this.circuitBreaker.execute(async () => {
          return await this.performDelivery(url, signedPayload, deliveryStart, headers);
        });
      } else {
        return await this.performDelivery(url, signedPayload, deliveryStart, headers);
      }
    } catch (error) {
      logger.error(`Webhook delivery failed to ${url}: ${error instanceof Error ? error.message : String(error)}`);

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        deliveredAt: Date.now(),
        attempts: 0
      };
    }
  }

  private async performDelivery(
    webhookUrl: string,
    payload: WebhookPayload,
    _deliveryStart: number,
    headers?: Record<string, string>
  ): Promise<WebhookDeliveryResult> {
    let attempts = 0;
    let result: WebhookDeliveryResult = {
      success: false,
      deliveredAt: Date.now(),
      attempts: 0
    };

    if (this.retryHandler) {
      try {
        await this.retryHandler.execute(async () => {
          attempts++;
          const response = await this.makeHttpRequest(webhookUrl, payload, headers);

          if (response.ok) {
            result = {
              success: true,
              statusCode: response.status,
              deliveredAt: Date.now(),
              attempts: attempts
            };
            return result;
          } else {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }
        });
      } catch (error) {
        result = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          deliveredAt: Date.now(),
          attempts: attempts
        };
      }
    } else {
      attempts = 1;
      try {
        const response = await this.makeHttpRequest(webhookUrl, payload, headers);

        if (response.ok) {
          result = {
            success: true,
            statusCode: response.status,
            deliveredAt: Date.now(),
            attempts: attempts
          };
        } else {
          const errorText = await response.text().catch(() => 'Unknown error');
          result = {
            success: false,
            statusCode: response.status,
            error: `HTTP ${response.status}: ${errorText}`,
            deliveredAt: Date.now(),
            attempts: attempts
          };
        }
      } catch (error) {
        result = {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          deliveredAt: Date.now(),
          attempts: attempts
        };
      }
    }

    return result;
  }

  private async makeHttpRequest(
    url: string,
    payload: WebhookPayload,
    headers?: Record<string, string>
  ): Promise<Response> {
    const timeoutMs = this.defaultTimeoutMs;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(headers || {})
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (controller.signal.aborted) {
        throw new Error(`Webhook request to ${url} timed out after ${timeoutMs}ms`);
      }

      throw error;
    }
  }

  private getMatchingWebhooks(event: string): WebhookRegistration[] {
    const matches: WebhookRegistration[] = [];

    for (const registrations of this.registeredWebhooks.values()) {
      for (const reg of registrations) {
        if (reg.eventTypes.includes(event) || reg.eventTypes.includes('*')) {
          matches.push(reg);
        }
      }
    }

    return matches;
  }

  private signPayload(payload: WebhookPayload): WebhookPayload {
    if (!this.config.hmacSecret) {
      return payload;
    }

    return {
      ...payload,
      signature: `dummy-signature-${Date.now()}`
    };
  }

  getRegisteredWebhooks(): Record<string, WebhookRegistration[]> {
    const result: Record<string, WebhookRegistration[]> = {};

    for (const [url, registrations] of this.registeredWebhooks.entries()) {
      result[url] = [...registrations];
    }

    return result;
  }

  async healthCheck(): Promise<WebhookHealthCheck> {
    try {
      const hasRegistrations = this.registeredWebhooks.size > 0;
      const circuitBreakerHealthy = !this.circuitBreaker ||
        this.circuitBreaker.getMetrics().state !== 'OPEN';

      return {
        status: hasRegistrations && circuitBreakerHealthy ? 'healthy' : 'unhealthy',
        details: {
          registeredWebhooks: this.registeredWebhooks.size,
          circuitBreakerState: this.circuitBreaker?.getMetrics().state,
          hasRegistrations
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          registeredWebhooks: this.registeredWebhooks.size,
          hasRegistrations: false,
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
}
