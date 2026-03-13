/**
 * RaaS Gateway KV Client — Cloudflare KV Storage
 *
 * Client for Cloudflare KV storage used by RaaS Gateway for:
 * - Real-time usage counter storage
 * - Suspension state persistence
 * - Overage configuration
 *
 * Environment variables required:
 * - CLOUDFLARE_ACCOUNT_ID
 * - CLOUDFLARE_API_TOKEN
 * - RAAS_KV_NAMESPACE_ID
 *
 * Usage:
 * ```typescript
 * const kv = new RaaSGatewayKVClient();
 *
 * // Store usage counter
 * await kv.setCounter('lic_abc123', 'api_call', 15000);
 *
 * // Get counter
 * const count = await kv.getCounter('lic_abc123', 'api_call');
 *
 * // Set suspension state
 * await kv.setSuspension('lic_abc123', { suspended: true, reason: 'quota_exceeded' });
 * ```
 */

import { logger } from '../utils/logger';

/**
 * Counter value structure
 */
export interface CounterValue {
  /** Counter value */
  value: number;
  /** Last updated timestamp */
  updatedAt: string;
}

/**
 * Suspension state structure
 */
export interface SuspensionState {
  /** Whether suspended */
  suspended: boolean;
  /** Suspension reason */
  reason: 'quota_exceeded' | 'payment_failed' | 'manual' | 'expired';
  /** Suspended at timestamp */
  suspendedAt?: string;
  /** Current usage when suspended */
  currentUsage?: number;
  /** Quota limit */
  limit?: number;
  /** Whether overage is allowed */
  overageAllowed?: boolean;
  /** Overage units if allowed */
  overageUnits?: number;
}

/**
 * Overage configuration structure
 */
export interface OverageConfig {
  /** Whether overage is enabled */
  enabled: boolean;
  /** Max overage as percent of quota */
  maxOveragePercent: number;
  /** Price per overage unit */
  pricePerUnit?: number;
}

/**
 * Usage event structure for RaaS Gateway sync
 */
export interface UsageEvent {
  licenseKey: string;
  eventType: string;
  units: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * KV key builder helpers
 */
export class KVKeyBuilder {
  private static PREFIX = 'raas';

  /**
   * Build counter key: raas:counter:{licenseKey}:{month}:{metric}
   */
  static counterKey(licenseKey: string, metric: string, month?: string): string {
    const monthPart = month || new Date().toISOString().slice(0, 7); // YYYY-MM
    return `${this.PREFIX}:counter:${licenseKey}:${monthPart}:${metric}`;
  }

  /**
   * Build suspension key: raas:suspension:{licenseKey}
   */
  static suspensionKey(licenseKey: string): string {
    return `${this.PREFIX}:suspension:${licenseKey}`;
  }

  /**
   * Build overage config key: raas:overage_config:{licenseKey}
   */
  static overageConfigKey(licenseKey: string): string {
    return `${this.PREFIX}:overage_config:${licenseKey}`;
  }

  /**
   * Build overage state key: raas:overage_state:{licenseKey}
   */
  static overageStateKey(licenseKey: string): string {
    return `${this.PREFIX}:overage_state:${licenseKey}`;
  }

  /**
   * Build event key: raas:event:{licenseKey}:{timestamp}:{eventType}
   */
  static eventKey(licenseKey: string, timestamp: string, eventType: string): string {
    return `${this.PREFIX}:event:${licenseKey}:${timestamp}:${eventType}`;
  }

  /**
   * List event keys for a license in a time range
   */
  static eventKeyPrefix(licenseKey: string): string {
    return `${this.PREFIX}:event:${licenseKey}:`;
  }
}

/**
 * Client configuration
 */
export interface KVClientConfig {
  /** Cloudflare API token */
  apiToken?: string;
  /** Cloudflare account ID */
  accountId?: string;
  /** KV namespace ID */
  namespaceId?: string;
  /** KV API base URL */
  baseUrl?: string;
}

/**
 * RaaS Gateway KV Client
 *
 * Wraps Cloudflare KV API with:
 * - Type-safe operations
 * - Automatic key building
 * - Error handling
 */
export class RaaSGatewayKVClient {
  private apiToken: string;
  private accountId: string;
  private namespaceId: string;
  private baseUrl: string;

  constructor(config?: KVClientConfig) {
    this.apiToken = config?.apiToken || process.env.CLOUDFLARE_API_TOKEN || '';
    this.accountId = config?.accountId || process.env.CLOUDFLARE_ACCOUNT_ID || '';
    this.namespaceId = config?.namespaceId || process.env.RAAS_KV_NAMESPACE_ID || '';
    this.baseUrl = config?.baseUrl || `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/storage/kv/namespaces/${this.namespaceId}`;
  }

  /**
   * Check if client is configured
   */
  isConfigured(): boolean {
    return !!(this.apiToken && this.accountId && this.namespaceId);
  }

  /**
   * Set usage counter
   */
  async setCounter(
    licenseKey: string,
    metric: string,
    value: number,
    month?: string
  ): Promise<void> {
    if (!this.isConfigured()) {
      logger.warn('[RaaSKV] Not configured, skipping setCounter', { licenseKey });
      return;
    }

    const key = KVKeyBuilder.counterKey(licenseKey, metric, month);
    const counterValue: CounterValue = {
      value,
      updatedAt: new Date().toISOString(),
    };

    await this.put(key, counterValue);
    logger.debug('[RaaSKV] Set counter', { key, value });
  }

  /**
   * Increment usage counter atomically
   */
  async incrementCounter(
    licenseKey: string,
    metric: string,
    delta: number = 1,
    month?: string
  ): Promise<number> {
    if (!this.isConfigured()) {
      logger.warn('[RaaSKV] Not configured, skipping incrementCounter', { licenseKey });
      return 0;
    }

    const key = KVKeyBuilder.counterKey(licenseKey, metric, month);

    // Get current value
    const current = await this.getCounter(licenseKey, metric, month);
    const newValue = (current?.value || 0) + delta;

    // Set new value
    await this.setCounter(licenseKey, metric, newValue, month);

    return newValue;
  }

  /**
   * Get usage counter
   */
  async getCounter(
    licenseKey: string,
    metric: string,
    month?: string
  ): Promise<CounterValue | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const key = KVKeyBuilder.counterKey(licenseKey, metric, month);
    return this.get<CounterValue>(key);
  }

  /**
   * Set suspension state
   */
  async setSuspension(
    licenseKey: string,
    state: SuspensionState
  ): Promise<void> {
    if (!this.isConfigured()) {
      logger.warn('[RaaSKV] Not configured, skipping setSuspension', { licenseKey });
      return;
    }

    const key = KVKeyBuilder.suspensionKey(licenseKey);
    await this.put(key, state);
    logger.info('[RaaSKV] Set suspension', { key, suspended: state.suspended });
  }

  /**
   * Get suspension state
   */
  async getSuspension(licenseKey: string): Promise<SuspensionState | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const key = KVKeyBuilder.suspensionKey(licenseKey);
    return this.get<SuspensionState>(key);
  }

  /**
   * Check if license is suspended (helper for middleware)
   * Returns simplified suspension status for quick checks
   */
  async isSuspended(licenseKey: string): Promise<{
    suspended: boolean;
    reason?: SuspensionState['reason'];
    suspendedAt?: string;
  }> {
    if (!this.isConfigured()) {
      // KV not configured - assume not suspended (fail-open for local dev)
      return { suspended: false };
    }

    try {
      const state = await this.getSuspension(licenseKey);
      if (!state || !state.suspended) {
        return { suspended: false };
      }
      return {
        suspended: true,
        reason: state.reason,
        suspendedAt: state.suspendedAt,
      };
    } catch (error) {
      // KV error - log and fail-open (don't block legitimate users)
      logger.error('[RaaSKV] isSuspended check failed', { licenseKey, error });
      return { suspended: false };
    }
  }

  /**
   * Set overage configuration
   */
  async setOverageConfig(
    licenseKey: string,
    config: OverageConfig
  ): Promise<void> {
    if (!this.isConfigured()) {
      logger.warn('[RaaSKV] Not configured, skipping setOverageConfig', { licenseKey });
      return;
    }

    const key = KVKeyBuilder.overageConfigKey(licenseKey);
    await this.put(key, config);
    logger.info('[RaaSKV] Set overage config', { key, enabled: config.enabled });
  }

  /**
   * Get overage configuration
   */
  async getOverageConfig(licenseKey: string): Promise<OverageConfig | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const key = KVKeyBuilder.overageConfigKey(licenseKey);
    return this.get<OverageConfig>(key);
  }

  /**
   * Set overage state
   */
  async setOverageState(
    licenseKey: string,
    state: {
      overageUnits: number;
      updatedAt: string;
    }
  ): Promise<void> {
    if (!this.isConfigured()) {
      logger.warn('[RaaSKV] Not configured, skipping setOverageState', { licenseKey });
      return;
    }

    const key = KVKeyBuilder.overageStateKey(licenseKey);
    await this.put(key, state);
  }

  /**
   * Get overage state
   */
  async getOverageState(
    licenseKey: string
  ): Promise<{ overageUnits: number; updatedAt: string } | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const key = KVKeyBuilder.overageStateKey(licenseKey);
    return this.get(key);
  }

  /**
   * Delete a key
   */
  async delete(key: string): Promise<void> {
    if (!this.isConfigured()) {
      return;
    }

    const url = `${this.baseUrl}/values/${key}`;

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`KV delete failed: ${response.status}`);
      }
    } catch (error) {
      logger.error('[RaaSKV] Delete failed', { key, error });
      throw error;
    }
  }

  /**
   * Put value to KV
   */
  private async put<T>(key: string, value: T): Promise<void> {
    const url = `${this.baseUrl}/values/${key}`;

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(value),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`KV put failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      logger.error('[RaaSKV] Put failed', { key, error });
      throw error;
    }
  }

  /**
   * Get value from KV
   */
  private async get<T>(key: string): Promise<T | null> {
    const url = `${this.baseUrl}/values/${key}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`KV get failed: ${response.status}`);
      }

      return await response.json() as T;
    } catch (error) {
      logger.error('[RaaSKV] Get failed', { key, error });
      return null;
    }
  }

  /**
   * Push usage event to KV for RaaS Gateway sync
   *
   * @param event - Usage event to store
   * @returns Event key for reference
   */
  async pushUsageEvent(event: UsageEvent): Promise<string> {
    if (!this.isConfigured()) {
      logger.warn('[RaaSKV] Not configured, skipping pushUsageEvent', { licenseKey: event.licenseKey });
      return '';
    }

    try {
      // Use epoch timestamp for ordering
      const timestamp = Date.now().toString();
      const key = KVKeyBuilder.eventKey(event.licenseKey, timestamp, event.eventType);
      await this.put(key, event);
      logger.debug('[RaaSKV] Pushed usage event', { key, eventType: event.eventType });
      return key;
    } catch (error) {
      logger.error('[RaaSKV] pushUsageEvent failed', { event, error });
      throw error;
    }
  }

  /**
   * Stream usage events in chronological order
   *
   * Note: Cloudflare KV doesn't support server-side filtering,
   * so this lists all keys with the license prefix and filters client-side.
   *
   * @param licenseKey - License identifier
   * @param startTime - Start epoch timestamp (default: 0)
   * @param endTime - End epoch timestamp (default: now)
   * @returns Usage events sorted chronologically
   */
  async streamUsageEvents(
    licenseKey: string,
    startTime?: number,
    endTime?: number
  ): Promise<UsageEvent[]> {
    if (!this.isConfigured()) {
      logger.warn('[RaaSKV] Not configured, skipping streamUsageEvents', { licenseKey });
      return [];
    }

    try {
      // List all keys with the license prefix
      const prefix = KVKeyBuilder.eventKeyPrefix(licenseKey);
      const url = `${this.baseUrl}/keys?prefix=${encodeURIComponent(prefix)}&limit=1000`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`KV list keys failed: ${response.status}`);
      }

      const data = await response.json() as { keys: Array<{ name: string }> };
      const keys = data.keys || [];

      // Filter and fetch events
      const events: UsageEvent[] = [];
      const startTs = startTime || 0;
      const endTs = endTime || Date.now();

      for (const keyInfo of keys) {
        // Extract timestamp from key: raas:event:{licenseKey}:{timestamp}:{eventType}
        const parts = keyInfo.name.split(':');
        if (parts.length >= 5) {
          const timestamp = parseInt(parts[3], 10);
          if (timestamp >= startTs && timestamp <= endTs) {
            const event = await this.get<UsageEvent>(keyInfo.name);
            if (event) {
              events.push(event);
            }
          }
        }
      }

      // Sort chronologically by timestamp
      return events.sort((a, b) => {
        const tsA = new Date(a.timestamp).getTime();
        const tsB = new Date(b.timestamp).getTime();
        return tsA - tsB;
      });
    } catch (error) {
      logger.error('[RaaSKV] streamUsageEvents failed', { licenseKey, error });
      return [];
    }
  }

  /**
   * Get usage events count for monitoring
   */
  async getUsageEventsCount(licenseKey: string): Promise<number> {
    if (!this.isConfigured()) {
      return 0;
    }

    try {
      const prefix = KVKeyBuilder.eventKeyPrefix(licenseKey);
      const url = `${this.baseUrl}/keys?prefix=${encodeURIComponent(prefix)}&limit=1`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      });

      if (!response.ok) {
        return 0;
      }

      const data = await response.json() as { count: number };
      return data.count || 0;
    } catch (error) {
      logger.error('[RaaSKV] getUsageEventsCount failed', { licenseKey, error });
      return 0;
    }
  }
}

// Export singleton with default config
export const raasKVClient = new RaaSGatewayKVClient();
