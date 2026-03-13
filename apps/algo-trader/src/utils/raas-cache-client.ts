/**
 * RaaS Gateway Cache Client
 * Interfaces with RaaS Gateway v2.0.0 for distributed build caching
 *
 * Features:
 * - Bearer token auth with mk_ API key
 * - Rate limit handling with exponential backoff
 * - Graceful fallback on errors
 */

import { retry } from './retry';

const RAAS_BASE_URL = 'https://raas.agencyos.network/api/v1';

export interface CacheEntry {
  data: string; // base64 encoded
  ttl: number;
}

export class RaaSCacheClient {
  private agencyId: string;
  private apiKey: string;
  private baseUrl: string;

  constructor(
    agencyId: string,
    apiKey: string,
    baseUrl = RAAS_BASE_URL
  ) {
    this.agencyId = agencyId;
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer mk_${this.apiKey}`,
      'Content-Type': 'application/json',
      'X-Agency-ID': this.agencyId,
    };
  }

  /**
   * Get cached value from RaaS KV
   * Returns null on 404 or error (graceful fallback)
   */
  async get(key: string): Promise<Buffer | null> {
    try {
      const response = await retry(
        () =>
          fetch(`${this.baseUrl}/cache/${this.agencyId}/${key}`, {
            headers: this.getHeaders(),
          }),
        { maxRetries: 3, backoff: 'exponential' }
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('RaaS cache GET failed:', error);
      return null; // Graceful fallback to local cache
    }
  }

  /**
   * Set cached value in RaaS KV
   * Silently fails on rate limit (429) - local cache still works
   */
  async set(key: string, data: Buffer, ttlSeconds: number): Promise<void> {
    try {
      const response = await retry(
        () =>
          fetch(`${this.baseUrl}/cache/${this.agencyId}/${key}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify({
              data: data.toString('base64'),
              ttl: ttlSeconds,
            }),
          }),
        { maxRetries: 3, backoff: 'exponential' }
      );

      if (response.status === 429) {
        console.warn('RaaS cache rate limited, falling back to local only');
        return; // Graceful degradation
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('RaaS cache SET failed:', error);
      // Fail silently - local cache still works
    }
  }

  /**
   * Check if key exists in RaaS KV
   */
  async has(key: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/cache/${this.agencyId}/${key}/exists`,
        { headers: this.getHeaders() }
      );
      const data = await response.json() as { exists: boolean };
      return data.exists === true;
    } catch {
      return false;
    }
  }

  /**
   * Invalidate cache entries matching pattern
   */
  async invalidate(pattern: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/cache/${this.agencyId}/invalidate`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ pattern }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Cache invalidation failed:', error);
    }
  }
}
