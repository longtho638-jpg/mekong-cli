/**
 * Model Encryption Tests
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { encryptModelWeights, decryptModelWeights } from './model-encryption';
import { LicenseService, LicenseTier } from './raas-gate';
import * as tf from '@tensorflow/tfjs';

describe('Model Encryption', () => {
  beforeEach(() => {
    LicenseService.getInstance().reset();
    delete process.env.RAAS_LICENSE_KEY;
  });

  const mockArtifacts: tf.io.ModelArtifacts = {
    weightSpecs: [
      { name: 'dense/kernel', shape: [10, 5], dtype: 'float32' },
    ],
    weightData: new Float32Array([1, 2, 3, 4, 5]).buffer,
  };

  test('should throw LicenseError for FREE tier', async () => {
    await LicenseService.getInstance().validate();

    await expect(encryptModelWeights(mockArtifacts))
      .rejects.toThrow('Model encryption requires PRO license');
  });

  test('should encrypt model weights with PRO license', async () => {
    await LicenseService.getInstance().validate('raas-pro-test');

    const encrypted = await encryptModelWeights(mockArtifacts, 'raas-pro-test-key');

    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.iv).toHaveLength(32);
    expect(encrypted.salt).toHaveLength(64);
    expect(encrypted.authTag).toHaveLength(32);
    expect(encrypted.timestamp).toBeGreaterThan(0);
  });

  test('should decrypt model weights', async () => {
    await LicenseService.getInstance().validate('raas-pro-test');

    const encrypted = await encryptModelWeights(mockArtifacts, 'test-key-123');
    const decrypted = await decryptModelWeights(encrypted, 'test-key-123');

    expect(decrypted.weightSpecs).toEqual(mockArtifacts.weightSpecs);
    expect(decrypted.weightData).toBeDefined();
  });

  test('should fail decryption with wrong key', async () => {
    await LicenseService.getInstance().validate('raas-pro-test');

    const encrypted = await encryptModelWeights(mockArtifacts, 'correct-key');

    await expect(decryptModelWeights(encrypted, 'wrong-key'))
      .rejects.toThrow();
  });

  test('should require license key from env if not provided', async () => {
    await LicenseService.getInstance().validate('raas-pro-test');
    delete process.env.RAAS_LICENSE_KEY;

    await expect(encryptModelWeights(mockArtifacts))
      .rejects.toThrow('License key required');
  });
});
