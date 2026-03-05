/**
 * Integration Tests: License Gating for Premium Features
 */

import { LicenseService, LicenseTier, LicenseError } from '../../src/lib/raas-gate';
import { GruPricePredictionModel } from '../../src/ml/gru-price-prediction-model';
import { BacktestEngine } from '../../src/backtest/BacktestEngine';
import { IStrategy, SignalType } from '../../src/interfaces/IStrategy';
import { ICandle } from '../../src/interfaces/ICandle';

class MockStrategy implements IStrategy {
  name = 'MockStrategy';
  signals = [SignalType.HOLD];
  async init(_candles: ICandle[]): Promise<void> {}
  async onCandle(_candle: ICandle): Promise<{ type: SignalType }> {
    return { type: SignalType.HOLD };
  }
}

describe('License Gating Integration', () => {
  let licenseService: LicenseService;

  beforeEach(() => {
    licenseService = LicenseService.getInstance();
    licenseService.reset();
  });

  afterEach(() => {
    licenseService.reset();
  });

  describe('ML Model Weights Gating', () => {
    test('should block saveWeights without PRO license', async () => {
      const model = new GruPricePredictionModel();
      model.build();
      await expect(model.saveWeights()).rejects.toThrow(LicenseError);
    });

    test('should block loadWeights without PRO license', () => {
      const model = new GruPricePredictionModel();
      const mockArtifacts = { weightSpecs: [], weightData: new Uint8Array([]) };
      expect(() => model.loadWeights(mockArtifacts)).toThrow(LicenseError);
    });

    test('should allow saveWeights with PRO license', async () => {
      await licenseService.activateLicense('raas-pro-test', LicenseTier.PRO);
      const model = new GruPricePredictionModel();
      model.build();
      const result = await model.saveWeights();
      expect(result).toBeDefined();
    });

    test('should allow loadWeights with PRO license', () => {
      licenseService.activateLicense('raas-pro-test', LicenseTier.PRO);
      const model = new GruPricePredictionModel();
      model.build();
      const mockArtifacts = { weightSpecs: [], weightData: new Uint8Array([]) };
      expect(() => model.loadWeights(mockArtifacts)).not.toThrow();
    });
  });

  describe('Backtest Engine Gating', () => {
    let engine: BacktestEngine;
    let mockStrategy: IStrategy;
    let mockCandles: ICandle[];

    beforeEach(() => {
      engine = new BacktestEngine();
      mockStrategy = new MockStrategy();
      mockCandles = Array.from({ length: 500 }, (_, i) => ({
        timestamp: Date.now() + i * 60000,
        open: 50000 + Math.random() * 1000,
        high: 51000 + Math.random() * 1000,
        low: 49000 + Math.random() * 1000,
        close: 50000 + Math.random() * 1000,
        volume: Math.random() * 1000,
      }));
    });

    test('should block walkForward without PRO license', async () => {
      await expect(engine.walkForward(() => mockStrategy, mockCandles, 3))
        .rejects.toThrow(LicenseError);
    });

    test('should block monteCarlo without PRO license', () => {
      expect(() => engine.monteCarlo([], 10000)).toThrow(LicenseError);
    });

    test('should allow walkForward with PRO license', async () => {
      await licenseService.activateLicense('raas-pro-test', LicenseTier.PRO);
      const manyCandles = Array.from({ length: 2000 }, (_, i) => ({
        timestamp: Date.now() + i * 60000,
        open: 50000 + Math.random() * 1000,
        high: 51000 + Math.random() * 1000,
        low: 49000 + Math.random() * 1000,
        close: 50000 + Math.random() * 1000,
        volume: Math.random() * 1000,
      }));
      const result = await engine.walkForward(() => mockStrategy, manyCandles, 3);
      expect(result).toBeDefined();
    });

    test('should allow monteCarlo with PRO license', () => {
      licenseService.activateLicense('raas-pro-test', LicenseTier.PRO);
      const mockTrades = [
        { profit: 100, exitTime: Date.now(), entryTime: Date.now() - 1000, mae: 0, mfe: 0 },
        { profit: -50, exitTime: Date.now(), entryTime: Date.now() - 1000, mae: 0, mfe: 0 },
        { profit: 200, exitTime: Date.now(), entryTime: Date.now() - 1000, mae: 0, mfe: 0 },
      ];
      const result = engine.monteCarlo(mockTrades, 10000, 100);
      expect(result).toBeDefined();
    });
  });

  describe('Premium Data Gating', () => {
    let engine: BacktestEngine;
    let mockStrategy: IStrategy;

    beforeEach(() => {
      engine = new BacktestEngine();
      mockStrategy = new MockStrategy();
    });

    test('should block >10k candles without PRO license', async () => {
      const manyCandles = Array.from({ length: 15000 }, (_, i) => ({
        timestamp: Date.now() + i * 60000,
        open: 50000 + Math.random() * 1000,
        high: 51000 + Math.random() * 1000,
        low: 49000 + Math.random() * 1000,
        close: 50000 + Math.random() * 1000,
        volume: Math.random() * 1000,
      }));
      await expect(engine.runDetailed(mockStrategy, manyCandles))
        .rejects.toThrow(LicenseError);
    });

    test('should allow >10k candles with PRO license', async () => {
      await licenseService.activateLicense('raas-pro-test', LicenseTier.PRO);
      const manyCandles = Array.from({ length: 15000 }, (_, i) => ({
        timestamp: Date.now() + i * 60000,
        open: 50000 + Math.random() * 1000,
        high: 51000 + Math.random() * 1000,
        low: 49000 + Math.random() * 1000,
        close: 50000 + Math.random() * 1000,
        volume: Math.random() * 1000,
      }));
      const result = await engine.runDetailed(mockStrategy, manyCandles);
      expect(result).toBeDefined();
    });

    test('should allow <10k candles without license', async () => {
      const fewCandles = Array.from({ length: 5000 }, (_, i) => ({
        timestamp: Date.now() + i * 60000,
        open: 50000 + Math.random() * 1000,
        high: 51000 + Math.random() * 1000,
        low: 49000 + Math.random() * 1000,
        close: 50000 + Math.random() * 1000,
        volume: Math.random() * 1000,
      }));
      const result = await engine.runDetailed(mockStrategy, fewCandles);
      expect(result).toBeDefined();
    });
  });

  describe('License Tier Escalation', () => {
    test('should enforce tier hierarchy (FREE < PRO < ENTERPRISE)', async () => {
      expect(licenseService.hasTier(LicenseTier.FREE)).toBe(true);
      expect(licenseService.hasTier(LicenseTier.PRO)).toBe(false);
      expect(licenseService.hasTier(LicenseTier.ENTERPRISE)).toBe(false);

      await licenseService.activateLicense('raas-pro-test', LicenseTier.PRO);
      expect(licenseService.hasTier(LicenseTier.FREE)).toBe(true);
      expect(licenseService.hasTier(LicenseTier.PRO)).toBe(true);
      expect(licenseService.hasTier(LicenseTier.ENTERPRISE)).toBe(false);

      await licenseService.activateLicense('raas-ent-test', LicenseTier.ENTERPRISE);
      expect(licenseService.hasTier(LicenseTier.FREE)).toBe(true);
      expect(licenseService.hasTier(LicenseTier.PRO)).toBe(true);
      expect(licenseService.hasTier(LicenseTier.ENTERPRISE)).toBe(true);
    });
  });
});
