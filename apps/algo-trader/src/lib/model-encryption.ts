/**
 * ML Model Encryption at Rest
 * 
 * Encrypts ML model weights using AES-256-GCM with license key derivation.
 * Premium feature: Requires PRO license to encrypt/decrypt.
 */

import * as tf from '@tensorflow/tfjs';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { LicenseService, LicenseTier, LicenseError } from './raas-gate';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;

export interface EncryptedModel {
  ciphertext: string;
  iv: string;
  salt: string;
  authTag: string;
  timestamp: number;
  weightSpecs?: any;
}

/**
 * Convert tf.io.ModelArtifacts weightData to Uint8Array
 */
function toUint8Array(weightData: tf.io.ModelArtifacts['weightData']): Uint8Array {
  if (!weightData) {
    return new Uint8Array(0);
  }
  if (weightData instanceof Uint8Array) {
    return weightData;
  }
  if (weightData instanceof ArrayBuffer) {
    return new Uint8Array(weightData);
  }
  if (Buffer.isBuffer(weightData)) {
    return new Uint8Array(weightData);
  }
  // Handle ArrayBuffer[] case - flatten
  if (Array.isArray(weightData)) {
    const total = weightData.reduce((sum, arr) => sum + arr.byteLength, 0);
    const result = new Uint8Array(total);
    let offset = 0;
    for (const arr of weightData) {
      result.set(new Uint8Array(arr), offset);
      offset += arr.byteLength;
    }
    return result;
  }
  return new Uint8Array(0);
}

function deriveKey(licenseKey: string, salt: Buffer): Buffer {
  return scryptSync(licenseKey, salt, 32) as Buffer;
}

export async function encryptModelWeights(
  artifacts: tf.io.ModelArtifacts,
  licenseKey?: string
): Promise<EncryptedModel> {
  const licenseService = LicenseService.getInstance();
  if (!licenseService.hasTier(LicenseTier.PRO)) {
    throw new LicenseError(
      'Model encryption requires PRO license',
      LicenseTier.PRO,
      'model_encryption'
    );
  }

  const key = licenseKey || process.env.RAAS_LICENSE_KEY;
  if (!key) {
    throw new Error('License key required for encryption');
  }

  const weightData = toUint8Array(artifacts.weightData);
  const plaintext = Buffer.from(weightData);

  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const derivedKey = deriveKey(key, salt);

  const cipher = createCipheriv(ALGORITHM, derivedKey, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('hex'),
    salt: salt.toString('hex'),
    authTag: authTag.toString('hex'),
    timestamp: Date.now(),
    weightSpecs: artifacts.weightSpecs,
  };
}

export async function decryptModelWeights(
  encrypted: EncryptedModel,
  licenseKey?: string
): Promise<tf.io.ModelArtifacts> {
  const licenseService = LicenseService.getInstance();
  if (!licenseService.hasTier(LicenseTier.PRO)) {
    throw new LicenseError(
      'Model decryption requires PRO license',
      LicenseTier.PRO,
      'model_encryption'
    );
  }

  const key = licenseKey || process.env.RAAS_LICENSE_KEY;
  if (!key) {
    throw new Error('License key required for decryption');
  }

  const ciphertext = Buffer.from(encrypted.ciphertext, 'base64');
  const iv = Buffer.from(encrypted.iv, 'hex');
  const salt = Buffer.from(encrypted.salt, 'hex');
  const authTag = Buffer.from(encrypted.authTag, 'hex');

  const derivedKey = deriveKey(key, salt);

  const decipher = createDecipheriv(ALGORITHM, derivedKey, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  return {
    weightSpecs: encrypted.weightSpecs || [],
    weightData: new Uint8Array(plaintext).buffer,
  };
}
