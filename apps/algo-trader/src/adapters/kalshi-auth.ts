/**
 * Kalshi Auth Utilities
 *
 * RSA-PSS signature generation for Kalshi API authentication.
 */

import * as crypto from 'crypto';

export interface AuthConfig {
  apiKey: string;
  privateKey: crypto.KeyObject;
  useServerTime: boolean;
  serverTimeOffset: number;
}

/**
 * Generate RSA-PSS signature for Kalshi API request
 */
export function signRequest(
  method: string,
  path: string,
  body: string | undefined,
  config: AuthConfig
): string {
  const timestamp = config.useServerTime
    ? Date.now() + config.serverTimeOffset
    : Date.now();

  const payload = body ?? '';
  const dataToSign = `${method}\n${path}\n${payload}\n${timestamp}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.write(dataToSign);
  sign.end();

  return sign.sign(
    { key: config.privateKey, padding: crypto.constants.RSA_PKCS1_PSS_PADDING },
    'base64'
  );
}

/**
 * Build auth headers for Kalshi API request
 */
export function buildAuthHeaders(
  method: string,
  path: string,
  body: string | undefined,
  config: AuthConfig
): Record<string, string> {
  const signature = signRequest(method, path, body, config);
  const timestamp = config.useServerTime
    ? Date.now() + config.serverTimeOffset
    : Date.now();

  return {
    'X-KALSHI-API-KEY': config.apiKey,
    'X-KALSHI-SIGNATURE': signature,
    'X-KALSHI-TIMESTAMP': timestamp.toString(),
  };
}

/**
 * Load private key from file
 */
export function loadPrivateKey(path: string): string {
  const fs = require('fs');
  if (!fs.existsSync(path)) {
    throw new Error(`Private key file not found: ${path}`);
  }
  return fs.readFileSync(path, 'utf8');
}

/**
 * Create KeyObject from PEM string
 */
export function createKeyObject(pemKey: string): crypto.KeyObject {
  return crypto.createPrivateKey(pemKey);
}
