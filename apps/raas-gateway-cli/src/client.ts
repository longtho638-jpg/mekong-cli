/**
 * RaaS Gateway CLI - HTTP Client
 *
 * RaaSClient class for communicating with RaaS Gateway API
 * Implements JWT authentication, error handling, and verbose logging
 */

import fetch, { RequestInit } from 'node-fetch';
import {
  GatewayConfig,
  GatewayHealth,
  GatewayStatus,
  RequestOptions,
  GatewayError,
} from './types.js';

export class RaaSClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;
  private verbose: boolean;

  constructor(config: GatewayConfig) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout;
    this.verbose = config.verbose;
  }

  /**
   * Execute HTTP request with error handling and verbose logging
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const url = `${this.baseUrl}${endpoint}`;

    // Build request headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add JWT authentication (except for public endpoints like /health)
    if (this.apiKey && endpoint !== '/health') {
      requestHeaders['Authorization'] = `Bearer ${this.apiKey}`;
    }

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method,
      headers: requestHeaders,
      signal: AbortSignal.timeout(this.timeout),
    };

    // Add body for POST/PUT requests
    if (body && ['POST', 'PUT'].includes(method)) {
      fetchOptions.body = JSON.stringify(body);
    }

    // Verbose logging - request
    if (this.verbose) {
      console.log('>>> REQUEST:');
      console.log(`    ${method} ${url}`);
      console.log('    Headers:', JSON.stringify({
        ...requestHeaders,
        Authorization: requestHeaders.Authorization ? 'Bearer [REDACTED]' : undefined,
      }, null, 2));
      if (fetchOptions.body) {
        console.log('    Body:', fetchOptions.body);
      }
    }

    try {
      const response: any = await fetch(url, fetchOptions);

      // Verbose logging - response
      if (this.verbose) {
        console.log('<<< RESPONSE:');
        console.log(`    Status: ${response.status} ${response.statusText}`);
        console.log('    Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
      }

      // Parse response body
      const responseText = await response.text();
      const contentType = response.headers.get('content-type');

      let data: T;
      if (contentType?.includes('application/json')) {
        data = JSON.parse(responseText) as T;
      } else {
        data = responseText as unknown as T;
      }

      if (this.verbose) {
        console.log('    Body:', JSON.stringify(data, null, 2));
      }

      // Handle HTTP errors
      if (!response.ok) {
        throw this.createError(response.status, responseText, response.headers);
      }

      return data;
    } catch (error) {
      // Network errors
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw {
            error: 'Request timeout',
            details: `Request exceeded ${this.timeout}ms timeout`,
            status: 408,
          } as GatewayError;
        }
        if (error.message.includes('fetch failed')) {
          throw {
            error: 'Network error',
            details: `Unable to connect to ${this.baseUrl}`,
            status: 0,
          } as GatewayError;
        }
      }
      throw error;
    }
  }

  /**
   * Create formatted error from HTTP response
   */
  private createError(
    status: number,
    body: string,
    headers: any
  ): GatewayError {
    const error: GatewayError = {
      error: `HTTP ${status}`,
      details: body,
      status,
    };

    // Parse rate limit headers if available
    const limit = (headers as any).get?.('x-ratelimit-limit');
    const remaining = (headers as any).get?.('x-ratelimit-remaining');
    const reset = (headers as any).get?.('x-ratelimit-reset');

    if (limit && remaining && reset) {
      error.headers = {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10),
      };
    }

    // Specific error messages by status code
    switch (status) {
      case 401:
        error.error = 'Authentication failed';
        error.details = 'Invalid or expired API key. Please re-authenticate with `raas-cli auth`.';
        break;
      case 403:
        error.error = 'Access denied';
        error.details = 'Your API key does not have permission for this resource.';
        break;
      case 429:
        error.error = 'Rate limit exceeded';
        const retryAfter = (headers as any).get?.('Retry-After');
        if (retryAfter) {
          error.details = `Too many requests. Please retry after ${retryAfter} seconds.`;
        } else {
          error.details = 'Too many requests. Please wait before retrying.';
        }
        break;
      case 404:
        error.error = 'Not found';
        break;
      case 500:
        error.error = 'Server error';
        break;
      case 502:
      case 503:
        error.error = 'Service unavailable';
        error.details = 'The RaaS Gateway is temporarily unavailable. Please try again later.';
        break;
    }

    return error;
  }

  /**
   * Health check - public endpoint (no auth required)
   * GET /health
   */
  async healthCheck(): Promise<GatewayHealth> {
    return this.request<GatewayHealth>('/health');
  }

  /**
   * Get gateway status - authenticated endpoint
   * GET /v1/status
   */
  async getStatus(): Promise<GatewayStatus> {
    return this.request<GatewayStatus>('/v1/status');
  }

  /**
   * List available agents/services
   * GET /v1/agents
   */
  async listServices(): Promise<any[]> {
    return this.request<any[]>('/v1/agents');
  }

  /**
   * Invoke a workflow/task
   * POST /v1/tasks
   */
  async invokeWorkflow(task: string): Promise<any> {
    return this.request<any>('/v1/tasks', {
      method: 'POST',
      body: { task },
    });
  }
}
