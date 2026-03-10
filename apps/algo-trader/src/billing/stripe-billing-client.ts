/**
 * Stripe Billing Client — Usage Records API Wrapper
 *
 * TypeScript client for Stripe Metered Billing Usage Records API.
 * Handles authentication, retries, and error handling.
 *
 * API Reference:
 * @see https://docs.stripe.com/api/usage_records
 *
 * Usage:
 * ```typescript
 * const client = new StripeBillingClient(process.env.STRIPE_SECRET_KEY);
 *
 * // Create usage record
 * await client.createUsageRecord({
 *   subscriptionItemId: 'si_abc123',
 *   quantity: 150,
 *   timestamp: Math.floor(Date.now() / 1000),
 *   action: 'increment',
 * });
 *
 * // Get usage record summary
 * const summary = await client.getUsageRecordSummary('si_abc123');
 * ```
 */

import { logger } from '../utils/logger';

/**
 * Stripe Usage Record format
 */
export interface StripeUsageRecordInput {
  /** Stripe subscription item ID (e.g., 'si_abc123') */
  subscriptionItemId: string;
  /** Quantity consumed (must be integer for most meters) */
  quantity: number;
  /** Unix timestamp (seconds) for when usage occurred */
  timestamp: number;
  /** How to record: 'increment' adds to existing, 'set' overwrites */
  action: 'increment' | 'set';
}

/**
 * Stripe Usage Record response
 */
export interface StripeUsageRecord {
  id: string;
  object: 'usage_record';
  quantity: number;
  timestamp: number;
  subscription_item: string;
  action: string;
  created: number;
  livemode: boolean;
}

/**
 * Usage record summary
 */
export interface UsageRecordSummary {
  subscriptionItemId: string;
  totalQuantity: number;
  firstUsageRecord: number;
  lastUsageRecord: number;
}

/**
 * Stripe API error
 */
export interface StripeApiError {
  error: {
    type: string;
    message: string;
    code?: string;
    param?: string;
  };
}

/**
 * Client configuration
 */
export interface StripeClientConfig {
  /** Stripe API key (required) */
  apiKey: string;
  /** API base URL (default: https://api.stripe.com) */
  baseUrl?: string;
  /** Request timeout in ms (default: 10000) */
  timeout?: number;
  /** Max retry attempts (default: 3) */
  maxRetries?: number;
  /** Retry delay in ms (default: 1000) */
  retryDelay?: number;
}

/**
 * Stripe Billing Client
 *
 * Wraps Stripe Usage Records API with:
 * - Automatic retries with exponential backoff
 * - Error handling and logging
 * - Type-safe request/response
 */
export class StripeBillingClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;

  constructor(config: StripeClientConfig) {
    if (!config.apiKey) {
      throw new Error('Stripe API key is required');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.stripe.com';
    this.timeout = config.timeout || 10000;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  /**
   * Create a usage record
   *
   * @see https://docs.stripe.com/api/usage_records/create
   */
  async createUsageRecord(
    input: StripeUsageRecordInput
  ): Promise<StripeUsageRecord> {
    const url = `${this.baseUrl}/v1/subscription_items/${input.subscriptionItemId}/usage_records`;

    const body = new URLSearchParams({
      quantity: input.quantity.toString(),
      timestamp: input.timestamp.toString(),
      action: input.action,
    });

    return this.request('POST', url, body.toString());
  }

  /**
   * Get usage record summary
   *
   * @see https://docs.stripe.com/api/usage_records/summary
   */
  async getUsageRecordSummary(
    subscriptionItemId: string
  ): Promise<UsageRecordSummary> {
    const url = `${this.baseUrl}/v1/subscription_items/${subscriptionItemId}/usage_record_summary`;
    return this.request('GET', url);
  }

  /**
   * List usage records for a subscription item
   *
   * @see https://docs.stripe.com/api/usage_records/list
   */
  async listUsageRecords(
    subscriptionItemId: string,
    options?: {
      limit?: number;
      created?: number;
    }
  ): Promise<{ data: StripeUsageRecord[]; hasMore: boolean }> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.created) params.append('created', options.created.toString());

    const url = `${this.baseUrl}/v1/subscription_items/${subscriptionItemId}/usage_records?${params.toString()}`;
    const result = await this.request<{ data: StripeUsageRecord[]; has_more?: boolean }>('GET', url);

    return {
      data: result.data || [],
      hasMore: result.has_more || false,
    };
  }

  /**
   * Create usage records in batch
   */
  async createUsageRecordsBatch(
    records: StripeUsageRecordInput[]
  ): Promise<StripeUsageRecord[]> {
    const results = await Promise.allSettled(
      records.map((record) => this.createUsageRecord(record))
    );

    const successful: StripeUsageRecord[] = [];
    const failed: { record: StripeUsageRecordInput; error: unknown }[] = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push({
          record: records[i],
          error: result.reason,
        });
      }
    }

    if (failed.length > 0) {
      logger.warn('[StripeBilling] Batch completed with failures', {
        successful: successful.length,
        failed: failed.length,
      });
    }

    return successful;
  }

  /**
   * Make HTTP request to Stripe API
   */
  private async request<T>(
    method: string,
    url: string,
    body?: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // Add jitter to retry delay
        const delay = this.retryDelay * Math.pow(2, attempt) * (0.5 + Math.random());
        if (attempt > 0) {
          logger.info('[StripeBilling] Retrying request', { attempt, delay });
          await this.sleep(delay);
        }

        const response = await fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Stripe-Version': '2024-12-18.acacia',
          },
          body: method === 'POST' ? body : undefined,
          signal: AbortSignal.timeout(this.timeout),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new StripeApiErrorWrapper(errorData);
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors
        if (error instanceof StripeApiErrorWrapper) {
          const stripeError = error as StripeApiErrorWrapper;
          if (stripeError.statusCode && stripeError.statusCode >= 400 && stripeError.statusCode < 500) {
            logger.error('[StripeBilling] Client error, not retrying', {
              status: stripeError.statusCode,
              message: stripeError.message,
            });
            break;
          }
        }

        logger.warn('[StripeBilling] Request failed', {
          attempt: attempt + 1,
          maxRetries: this.maxRetries,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    throw lastError || new Error('Stripe API request failed');
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Wrapper for Stripe API errors
 */
class StripeApiErrorWrapper extends Error implements StripeApiError {
  error: {
    type: string;
    message: string;
    code?: string;
    param?: string;
  };
  statusCode?: number;

  constructor(data: StripeApiError & { statusCode?: number }) {
    super(data.error?.message || 'Stripe API error');
    this.name = 'StripeApiError';
    this.error = data.error;
    this.statusCode = data.statusCode;
  }
}

// Export for testing
export { StripeApiErrorWrapper };
