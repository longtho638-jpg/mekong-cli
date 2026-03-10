/**
 * RaaS Gateway CLI - Type Definitions
 */

export interface GatewayConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  verbose: boolean;
}

export interface AuthResult {
  authenticated: boolean;
  tenantId: string | null;
  role: string;
  licenseKey: string | null;
  error?: string;
}

export interface GatewayHealth {
  status: 'ok' | 'error';
  version: string;
  timestamp: number;
}

export interface GatewayStatus {
  status: 'ok';
  version: string;
  tenant: string;
  role: string;
  rateLimit: {
    remaining: number;
    limit: number;
  };
}

export interface RateLimitHeaders {
  limit: number;
  remaining: number;
  reset: number;
}

export interface GatewayError {
  error: string;
  details?: string;
  status: number;
  headers?: RateLimitHeaders | Record<string, string>;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

export interface GatewayResponse<T> {
  data: T;
  status: number;
  headers: RateLimitHeaders | null;
}
