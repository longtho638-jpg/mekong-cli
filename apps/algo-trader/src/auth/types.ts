/**
 * Auth types: AuthContext, TenantToken, ApiKeyRecord
 */

export interface TenantToken {
  tenantId: string;
  scopes: string[];
  keyId?: string;
  iat?: number;
  exp?: number;
}

export interface AuthContext {
  tenantId: string;
  scopes: string[];
  keyId: string;
}

export interface ApiKeyRecord {
  keyId: string;
  tenantId: string;
  hashedKey: string;
  scopes: string[];
  createdAt: number;
  label?: string;
}

export interface GeneratedApiKey {
  raw: string;
  hashed: string;
  keyId: string;
}

export interface RateLimitState {
  count: number;
  windowStart: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}
