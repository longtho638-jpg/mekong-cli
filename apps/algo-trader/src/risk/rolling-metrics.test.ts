/**
 * Tests for RollingMetrics — Time-windowed risk-adjusted return calculations.
 */

import { RollingMetrics, ReturnEntry, RollingWindowType } from './rolling-metrics';

describe('RollingMetrics', () => {
  let rollingMetrics: RollingMetrics;

  beforeEach(() => {
    rollingMetrics = new RollingMetrics({
      riskFreeRate: 0.045,
      tradingDaysPerYear: 252,
    });
  });

  afterEach(() => {
    rollingMetrics.dispose();
  });

  describe('constructor', () => {
    it('should initialize with default windows', () => {
      const metrics = new RollingMetrics();
      expect(metrics).toBeDefined();

      const memUsage = metrics.getMemoryUsage();
      expect(memUsage.byWindow['1h']).toBe(0);
      expect(memUsage.byWindow['24h']).toBe(0);
      expect(memUsage.byWindow['7d']).toBe(0);
    });

    it('should accept custom Sharpe config', () => {
      const metrics = new RollingMetrics({
        riskFreeRate: 0.05,
        tradingDaysPerYear: 250,
      });
      expect(metrics).toBeDefined();
    });

    it('should accept custom window configs', () => {
      const metrics = new RollingMetrics(
        { riskFreeRate: 0.045 },
        {
          '1h': { minSamples: 10, maxSamples: 500 },
        }
      );

      const config = metrics.getWindowConfig('1h');
      expect(config.minSamples).toBe(10);
      expect(config.maxSamples).toBe(500);
    });
  });

  describe('addEntry', () => {
    it('should add entry to all windows', () => {
      const entry: ReturnEntry = {
        return: 0.01,
        timestamp: Date.now(),
      };

      rollingMetrics.addEntry(entry);

      const memUsage = rollingMetrics.getMemoryUsage();
      expect(memUsage.byWindow['1h']).toBe(1);
      expect(memUsage.byWindow['24h']).toBe(1);
      expect(memUsage.byWindow['7d']).toBe(1);
    });

    it('should add entries with portfolio values', () => {
      const entry: ReturnEntry = {
        return: 0.01,
        timestamp: Date.now(),
        value: 10000,
      };

      rollingMetrics.addEntry(entry);
      expect(rollingMetrics.getSampleCount('1h')).toBe(1);
    });
  });

  describe('getMetrics', () => {
    it('should return null when insufficient samples', () => {
      // Default minSamples for 1h is 5
      rollingMetrics.addEntry({ return: 0.01, timestamp: Date.now() });
      rollingMetrics.addEntry({ return: 0.02, timestamp: Date.now() });

      const result = rollingMetrics.getMetrics('1h');
      expect(result).toBeNull();
    });

    it('should return metrics when sufficient samples', () => {
      const now = Date.now();
      for (let i = 0; i < 10; i++) {
        rollingMetrics.addEntry({
          return: 0.001 * (i % 3 - 1), // Alternating returns
          timestamp: now - i * 60000, // 1 minute apart
        });
      }

      const result = rollingMetrics.getMetrics('1h');

      expect(result).toBeDefined();
      expect(result!.window).toBe('1h');
      expect(result!.sampleCount).toBe(10);
      expect(result!.metrics).toHaveProperty('sharpeRatio');
      expect(result!.metrics).toHaveProperty('sortinoRatio');
      expect(result!.metrics).toHaveProperty('calmarRatio');
    });

    it('should filter entries by window time range', () => {
      const now = Date.now();
      const twoHoursAgo = now - 2 * 60 * 60 * 1000;

      // Add old entries (outside 1h window)
      for (let i = 0; i < 10; i++) {
        rollingMetrics.addEntry({
          return: 0.01,
          timestamp: twoHoursAgo - i * 60000,
        });
      }

      // Add recent entries (inside 1h window)
      for (let i = 0; i < 6; i++) {
        rollingMetrics.addEntry({
          return: 0.005,
          timestamp: now - i * 60000,
        });
      }

      const result = rollingMetrics.getMetrics('1h');
      expect(result).not.toBeNull();
      expect(result!.sampleCount).toBe(6); // Only recent entries
    });
  });

  describe('getAllMetrics', () => {
    it('should return empty array when no data', () => {
      const results = rollingMetrics.getAllMetrics();
      expect(results).toEqual([]);
    });

    it('should return metrics for all windows with sufficient data', () => {
      const now = Date.now();

      // Add 60 entries (enough for all windows)
      for (let i = 0; i < 60; i++) {
        rollingMetrics.addEntry({
          return: 0.001 * (i % 5 - 2),
          timestamp: now - i * 60000,
        });
      }

      const results = rollingMetrics.getAllMetrics();

      expect(results.length).toBeGreaterThan(0);
      // Only windows with sufficient data will be included
    });
  });

  describe('getSharpe, getSortino, getCalmar', () => {
    it('should return null for insufficient data', () => {
      expect(rollingMetrics.getSharpe('1h')).toBeNull();
      expect(rollingMetrics.getSortino('1h')).toBeNull();
      expect(rollingMetrics.getCalmar('1h')).toBeNull();
    });

    it('should return ratio values with sufficient data', () => {
      const now = Date.now();
      for (let i = 0; i < 10; i++) {
        rollingMetrics.addEntry({
          return: 0.002 - (i % 3) * 0.001,
          timestamp: now - i * 60000,
        });
      }

      const sharpe = rollingMetrics.getSharpe('1h');
      const sortino = rollingMetrics.getSortino('1h');
      const calmar = rollingMetrics.getCalmar('1h');

      expect(typeof sharpe).toBe('number');
      expect(typeof sortino).toBe('number');
      expect(typeof calmar).toBe('number');
    });
  });

  describe('getSampleCount', () => {
    it('should return 0 for empty window', () => {
      expect(rollingMetrics.getSampleCount('1h')).toBe(0);
      expect(rollingMetrics.getSampleCount('24h')).toBe(0);
      expect(rollingMetrics.getSampleCount('7d')).toBe(0);
    });

    it('should return correct count after adding entries', () => {
      const now = Date.now();
      for (let i = 0; i < 15; i++) {
        rollingMetrics.addEntry({
          return: 0.001,
          timestamp: now - i * 60000,
        });
      }

      expect(rollingMetrics.getSampleCount('1h')).toBe(15);
      expect(rollingMetrics.getSampleCount('24h')).toBe(15);
      expect(rollingMetrics.getSampleCount('7d')).toBe(15);
    });
  });

  describe('clear', () => {
    it('should clear all windows', () => {
      const now = Date.now();
      for (let i = 0; i < 10; i++) {
        rollingMetrics.addEntry({
          return: 0.001,
          timestamp: now - i * 60000,
        });
      }

      rollingMetrics.clear();

      const memUsage = rollingMetrics.getMemoryUsage();
      expect(memUsage.totalEntries).toBe(0);
    });
  });

  describe('auto cleanup', () => {
    it('should start and stop auto cleanup', () => {
      rollingMetrics.startAutoCleanup(1000); // 1 second
      expect((rollingMetrics as unknown as { cleanupInterval?: NodeJS.Timeout }).cleanupInterval).toBeDefined();

      rollingMetrics.stopAutoCleanup();
      expect((rollingMetrics as unknown as { cleanupInterval?: NodeJS.Timeout }).cleanupInterval).toBeUndefined();
    });

    it('should cleanup old entries automatically', (done) => {
      const now = Date.now();

      // Add entries with old timestamps
      for (let i = 0; i < 10; i++) {
        rollingMetrics.addEntry({
          return: 0.001,
          timestamp: now - (i + 100) * 60000, // 100+ minutes ago
        });
      }

      rollingMetrics.cleanupAll();

      // Old entries should be removed
      expect(rollingMetrics.getSampleCount('1h')).toBe(0);

      done();
    });
  });

  describe('cleanupAll', () => {
    it('should remove entries outside all windows', () => {
      const now = Date.now();
      const twoHoursAgo = now - 2 * 60 * 60 * 1000;

      // Add entries from 2 hours ago
      for (let i = 0; i < 10; i++) {
        rollingMetrics.addEntry({
          return: 0.001,
          timestamp: twoHoursAgo - i * 60000,
        });
      }

      rollingMetrics.cleanupAll();

      // 1h window should be empty
      expect(rollingMetrics.getSampleCount('1h')).toBe(0);

      // 24h and 7d should still have data
      expect(rollingMetrics.getSampleCount('24h')).toBe(10);
      expect(rollingMetrics.getSampleCount('7d')).toBe(10);
    });
  });

  describe('getWindowConfig', () => {
    it('should return config for specified window', () => {
      const config1h = rollingMetrics.getWindowConfig('1h');
      expect(config1h.windowMs).toBe(60 * 60 * 1000);
      expect(config1h.minSamples).toBe(5);

      const config24h = rollingMetrics.getWindowConfig('24h');
      expect(config24h.windowMs).toBe(24 * 60 * 60 * 1000);
      expect(config24h.minSamples).toBe(20);

      const config7d = rollingMetrics.getWindowConfig('7d');
      expect(config7d.windowMs).toBe(7 * 24 * 60 * 60 * 1000);
      expect(config7d.minSamples).toBe(50);
    });
  });

  describe('getMemoryUsage', () => {
    it('should return memory usage statistics', () => {
      const now = Date.now();
      for (let i = 0; i < 5; i++) {
        rollingMetrics.addEntry({
          return: 0.001,
          timestamp: now - i * 60000,
        });
      }

      const usage = rollingMetrics.getMemoryUsage();

      expect(usage).toHaveProperty('totalEntries');
      expect(usage).toHaveProperty('byWindow');
      expect(usage.byWindow['1h']).toBe(5);
      expect(usage.byWindow['24h']).toBe(5);
      expect(usage.byWindow['7d']).toBe(5);
    });
  });

  describe('dispose', () => {
    it('should stop cleanup and clear data', () => {
      rollingMetrics.startAutoCleanup(1000);
      rollingMetrics.addEntry({ return: 0.001, timestamp: Date.now() });

      rollingMetrics.dispose();

      expect(rollingMetrics.getMemoryUsage().totalEntries).toBe(0);
    });
  });

  describe('maxSamples enforcement', () => {
    it('should enforce maxSamples limit', () => {
      const now = Date.now();
      // Add more entries than maxSamples for 1h window (1000)
      for (let i = 0; i < 1100; i++) {
        rollingMetrics.addEntry({
          return: 0.0001,
          timestamp: now - i * 60000,
        });
      }

      const usage = rollingMetrics.getMemoryUsage();
      expect(usage.byWindow['1h']).toBeLessThanOrEqual(1000);
    });
  });

  describe('integration with values', () => {
    it('should calculate metrics with portfolio values', () => {
      const now = Date.now();
      let portfolioValue = 10000;

      for (let i = 0; i < 20; i++) {
        const ret = 0.002 - (i % 5) * 0.0005;
        portfolioValue *= (1 + ret);

        rollingMetrics.addEntry({
          return: ret,
          timestamp: now - i * 60000,
          value: portfolioValue,
        });
      }

      const result = rollingMetrics.getMetrics('1h');

      expect(result).toBeDefined();
      expect(result!.metrics.maxDrawdown).toBeGreaterThanOrEqual(0);
      expect(result!.metrics.sharpeRatio).toBeDefined();
    });
  });
});
