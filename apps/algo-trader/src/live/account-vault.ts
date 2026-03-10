/**
 * Account Vault — secure storage/retrieval of exchange API credentials.
 * Uses AES-256-GCM encryption. Credentials never logged or exposed in errors.
 */
import * as crypto from 'crypto';

export interface AccountCredential {
  id: string;
  exchange: string;
  apiKey: string;
  secret: string;
  enabled: boolean;
  expiresAt?: Date;
}

export interface VaultConfig {
  accounts: Record<string, { id: string; apiKeyEnv: string; secretEnv: string; enabled: boolean }[]>;
  encryptionKey?: string; // master password for encrypted file storage
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/** Derives a 256-bit key from a password */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha256');
}

/** Encrypts plaintext with AES-256-GCM */
export function encrypt(plaintext: string, password: string): string {
  const salt = crypto.randomBytes(16);
  const key = deriveKey(password, salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: salt:iv:tag:ciphertext (all hex)
  return [salt.toString('hex'), iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':');
}

/** Decrypts AES-256-GCM ciphertext */
export function decrypt(ciphertext: string, password: string): string {
  const parts = ciphertext.split(':');
  if (parts.length !== 4) throw new Error('Invalid encrypted data format');
  const salt = Buffer.from(parts[0], 'hex');
  const iv = Buffer.from(parts[1], 'hex');
  const tag = Buffer.from(parts[2], 'hex');
  const encrypted = Buffer.from(parts[3], 'hex');
  const key = deriveKey(password, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

/** Loads credentials from environment variables */
export function loadCredentials(config: VaultConfig): AccountCredential[] {
  const credentials: AccountCredential[] = [];
  for (const [exchange, accounts] of Object.entries(config.accounts)) {
    for (const acct of accounts) {
      if (!acct.enabled) continue;
      const apiKey = process.env[acct.apiKeyEnv];
      const secret = process.env[acct.secretEnv];
      if (!apiKey || !secret) continue;
      credentials.push({
        id: acct.id,
        exchange,
        apiKey,
        secret,
        enabled: true,
      });
    }
  }
  return credentials;
}

/** Validates credential is not expired */
export function isCredentialValid(cred: AccountCredential): boolean {
  if (!cred.enabled) return false;
  if (cred.expiresAt && cred.expiresAt.getTime() < Date.now()) return false;
  if (!cred.apiKey || !cred.secret) return false;
  return true;
}

/** Rotates to next available account for an exchange */
export function rotateAccount(
  credentials: AccountCredential[],
  exchange: string,
  currentId: string
): AccountCredential | null {
  const exchangeCreds = credentials.filter(
    (c) => c.exchange === exchange && c.enabled && c.id !== currentId
  );
  return exchangeCreds.length > 0 ? exchangeCreds[0] : null;
}

/** Masks credential for safe logging — never expose full key */
export function maskCredential(cred: AccountCredential): Record<string, string> {
  return {
    id: cred.id,
    exchange: cred.exchange,
    apiKey: cred.apiKey ? `${cred.apiKey.slice(0, 4)}****` : '[empty]',
    secret: '[REDACTED]',
    enabled: String(cred.enabled),
  };
}
