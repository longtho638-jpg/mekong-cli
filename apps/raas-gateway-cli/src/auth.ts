/**
 * RaaS Gateway CLI - Authentication Utilities
 * JWT and API key authentication helpers
 */

import { AuthResult } from './types.js';

/**
 * Validate API key format
 * @param apiKey - The API key to validate
 * @returns true if key starts with 'mk_', false otherwise
 */
export function validateApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  return apiKey.startsWith('mk_');
}

/**
 * Decode JWT token and extract payload
 * @param token - JWT token string
 * @returns Object with decoded payload or error
 */
export function decodeJWT(token: string): { payload: any | null; error: string | null } {
  try {
    if (!token || typeof token !== 'string') {
      return { payload: null, error: 'Invalid token: token is empty or not a string' };
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return { payload: null, error: 'Invalid JWT: must have 3 parts' };
    }

    const [, payload] = parts;

    // Base64url decode
    let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');

    // Pad with '=' to make length multiple of 4
    const padLength = (4 - (base64.length % 4)) % 4;
    base64 = base64.padEnd(base64.length + padLength, '=');

    // Decode and parse JSON
    const decoded = Buffer.from(base64, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);

    return { payload: parsed, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to decode JWT';
    return { payload: null, error: errorMessage };
  }
}

/**
 * Build Authorization header for API requests
 * @param apiKey - The API key
 * @returns Headers object with Authorization field
 */
export function buildAuthHeader(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
  };
}

/**
 * Get tenant ID from environment variable
 * @returns Tenant ID or null if not found
 */
export function getTenantFromEnv(): string | null {
  const apiKey = process.env.MK_API_KEY;

  if (!apiKey) {
    return null;
  }

  // Extract tenant from API key format: mk_<tenant>_<secret>
  const parts = apiKey.split('_');
  if (parts.length >= 3 && parts[0] === 'mk') {
    return parts[1] || null;
  }

  return null;
}

/**
 * Full authentication check combining API key validation and JWT decoding
 * @param apiKey - The API key to authenticate
 * @returns AuthResult with authentication status and details
 */
export function authenticate(apiKey: string): AuthResult {
  // Validate API key format
  if (!validateApiKey(apiKey)) {
    return {
      authenticated: false,
      tenantId: null,
      role: 'unauthenticated',
      licenseKey: null,
      error: 'Invalid API key format: must start with "mk_"',
    };
  }

  // Extract tenant from API key
  const tenantId = getTenantFromEnv() || extractTenantFromKey(apiKey);

  // Try to decode JWT if API key looks like a JWT token
  let role = 'user';
  let licenseKey: string | null = null;

  const jwtResult = decodeJWT(apiKey);
  if (jwtResult.payload) {
    role = jwtResult.payload.role || 'user';
    licenseKey = jwtResult.payload.licenseKey || null;
  }

  return {
    authenticated: true,
    tenantId,
    role,
    licenseKey,
  };
}

/**
 * Extract tenant ID from API key string
 * @param apiKey - API key in format mk_<tenant>_<secret>
 * @returns Tenant ID or 'unknown' if cannot extract
 */
function extractTenantFromKey(apiKey: string): string | null {
  const parts = apiKey.split('_');
  if (parts.length >= 3 && parts[0] === 'mk') {
    return parts[1];
  }
  return null;
}
