/**
 * JWT sign/verify/refresh using built-in crypto (HS256).
 * No external dependencies — pure Node.js crypto module.
 */
import { createHmac, timingSafeEqual } from 'crypto';
import type { TenantToken } from './types';

const DEFAULT_EXPIRY_SECONDS = 3600; // 1 hour
const REFRESH_THRESHOLD_SECONDS = 900; // 15 minutes

function getSecret(): string {
  const secret = process.env['JWT_SECRET'] ?? '';
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  return secret;
}

function base64UrlEncode(data: string): string {
  return Buffer.from(data)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(data: string): string {
  const padded = data + '='.repeat((4 - (data.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

function sign(header: string, payload: string, secret: string): string {
  const input = `${header}.${payload}`;
  return createHmac('sha256', secret).update(input).digest('base64url');
}

/**
 * Sign a TenantToken and return JWT string (HS256).
 */
export function signToken(
  payload: Omit<TenantToken, 'iat' | 'exp'>,
  expirySeconds = DEFAULT_EXPIRY_SECONDS
): string {
  const secret = getSecret();
  const now = Math.floor(Date.now() / 1000);
  const full: TenantToken = { ...payload, iat: now, exp: now + expirySeconds };

  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(full));
  const signature = sign(header, body, secret);

  return `${header}.${body}.${signature}`;
}

/**
 * Verify a JWT string and return the decoded TenantToken.
 * Throws on invalid signature or expired token.
 */
export function verifyToken(token: string): TenantToken {
  const secret = getSecret();
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const [header, body, signature] = parts as [string, string, string];
  const expected = sign(header, body, secret);

  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);

  if (
    expectedBuf.length !== actualBuf.length ||
    !timingSafeEqual(expectedBuf, actualBuf)
  ) {
    throw new Error('Invalid JWT signature');
  }

  let payload: TenantToken;
  try {
    payload = JSON.parse(base64UrlDecode(body)) as TenantToken;
  } catch {
    throw new Error('Invalid JWT payload');
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp !== undefined && payload.exp < now) {
    throw new Error('JWT token expired');
  }

  return payload;
}

/**
 * Refresh a token if it expires within REFRESH_THRESHOLD_SECONDS.
 * Returns new token or original if not near expiry.
 */
export function refreshToken(token: string): string {
  const payload = verifyToken(token);
  const now = Math.floor(Date.now() / 1000);
  const remaining = (payload.exp ?? 0) - now;

  if (remaining > REFRESH_THRESHOLD_SECONDS) {
    return token;
  }

  const { iat: _iat, exp: _exp, ...base } = payload;
  return signToken(base);
}
