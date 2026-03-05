/**
 * StrategyLoader Tests - License Gate for ML Strategies
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { StrategyLoader } from './StrategyLoader';
import { LicenseService, LicenseTier, LicenseError } from '../lib/raas-gate';

describe('StrategyLoader - ML License Gate', () => {
  beforeEach(() => {
    LicenseService.getInstance().reset();
    delete process.env.RAAS_LICENSE_KEY;
  });

  test('should load basic strategies without license', () => {
    const strategy = StrategyLoader.load('RsiSma');
    expect(strategy).toBeDefined();
    expect(strategy.name).toBe('RSI + SMA Strategy');
  });

  test('should register ML strategies with PRO license then load', async () => {
    // Set PRO license first
    await LicenseService.getInstance().validate('raas-pro-test');

    // Register ML strategies (requires PRO)
    StrategyLoader.registerMLStrategies();

    // Should load successfully
    const strategy = StrategyLoader.load('GruPrediction');
    expect(strategy).toBeDefined();
    expect(strategy.name).toContain('GRU');
  });

  test('should throw LicenseError for ML strategies without PRO license', async () => {
    // FREE tier
    await LicenseService.getInstance().validate();

    // Try to register ML strategies - should throw
    expect(() => {
      StrategyLoader.registerMLStrategies();
    }).toThrow(LicenseError);
  });
});
