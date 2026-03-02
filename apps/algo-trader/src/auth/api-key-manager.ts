/**
 * API key generation, hashing, and validation.
 * Keys use algo_ prefix + 32 random hex chars.
 * Raw keys are never persisted — only SHA-256 hashes.
 */
import { createHash, randomBytes, timingSafeEqual as cryptoTimingSafeEqual } from 'crypto';
import type { ApiKeyRecord, AuthContext, GeneratedApiKey } from './types';

const KEY_PREFIX = 'algo_';
const KEY_RANDOM_BYTES = 16; // 32 hex chars

/**
 * Generate a new API key: `algo_` + 32 hex chars.
 * Returns both raw (show once) and hashed (store this).
 */
export function generateApiKey(
  tenantId: string,
  scopes: string[],
  label?: string
): GeneratedApiKey & { record: Omit<ApiKeyRecord, 'hashedKey'> & { hashedKey: string } } {
  const raw = KEY_PREFIX + randomBytes(KEY_RANDOM_BYTES).toString('hex');
  const hashed = hashKey(raw);
  const keyId = randomBytes(8).toString('hex');

  const record: ApiKeyRecord = {
    keyId,
    tenantId,
    hashedKey: hashed,
    scopes,
    createdAt: Date.now(),
    label,
  };

  return { raw, hashed, keyId, record };
}

/**
 * Hash a raw API key using SHA-256.
 */
export function hashKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * Validate a raw API key against an in-memory store.
 * Returns AuthContext if valid, null otherwise.
 */
export function validateKey(
  raw: string,
  store: Map<string, ApiKeyRecord>
): AuthContext | null {
  if (!raw.startsWith(KEY_PREFIX)) return null;

  const hashed = hashKey(raw);

  for (const record of store.values()) {
    if (timingSafeEqual(record.hashedKey, hashed)) {
      return {
        tenantId: record.tenantId,
        scopes: record.scopes,
        keyId: record.keyId,
      };
    }
  }

  return null;
}

/**
 * Timing-safe string comparison to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const aBuf = Buffer.from(a, 'hex');
  const bBuf = Buffer.from(b, 'hex');
  return cryptoTimingSafeEqual(aBuf, bBuf);
}

/**
 * Look up a record by keyId (for rate limiting, audit).
 */
export function getRecordByKeyId(
  keyId: string,
  store: Map<string, ApiKeyRecord>
): ApiKeyRecord | undefined {
  return store.get(keyId);
}
