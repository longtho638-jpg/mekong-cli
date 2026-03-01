import { describe, it, expect } from 'vitest';
import { defaultConfig, presets } from './defaults.js';

describe('defaultConfig', () => {
  it('should have empty apps array', () => {
    expect(defaultConfig.apps).toEqual([]);
  });

  it('should have correct default thresholds', () => {
    expect(defaultConfig.thresholds.bundleSizeWarning).toBe(400);
    expect(defaultConfig.thresholds.bundleSizeError).toBe(600);
    expect(defaultConfig.thresholds.buildTimeWarning).toBe(90);
    expect(defaultConfig.thresholds.buildTimeError).toBe(180);
  });

  it('should have all optimization strategies enabled by default', () => {
    expect(defaultConfig.strategies.treeShaking).toBe(true);
    expect(defaultConfig.strategies.codeSplitting).toBe(true);
    expect(defaultConfig.strategies.compression).toBe(true);
    expect(defaultConfig.strategies.caching).toBe(true);
  });

  it('should have monitoring enabled by default', () => {
    expect(defaultConfig.monitoring.enabled).toBe(true);
    expect(defaultConfig.monitoring.endpoint).toBeUndefined();
  });

  it('should enforce warning < error for bundle size thresholds', () => {
    expect(defaultConfig.thresholds.bundleSizeWarning).toBeLessThan(
      defaultConfig.thresholds.bundleSizeError,
    );
  });

  it('should enforce warning < error for build time thresholds', () => {
    expect(defaultConfig.thresholds.buildTimeWarning).toBeLessThan(
      defaultConfig.thresholds.buildTimeError,
    );
  });
});

describe('presets', () => {
  describe('conservative', () => {
    it('should have higher thresholds than default', () => {
      expect(presets.conservative.thresholds.bundleSizeWarning).toBeGreaterThan(
        defaultConfig.thresholds.bundleSizeWarning,
      );
      expect(presets.conservative.thresholds.bundleSizeError).toBeGreaterThan(
        defaultConfig.thresholds.bundleSizeError,
      );
    });

    it('should disable tree shaking', () => {
      expect(presets.conservative.strategies.treeShaking).toBe(false);
    });

    it('should keep compression and caching enabled', () => {
      expect(presets.conservative.strategies.compression).toBe(true);
      expect(presets.conservative.strategies.caching).toBe(true);
    });
  });

  describe('aggressive', () => {
    it('should have lower thresholds than default', () => {
      expect(presets.aggressive.thresholds.bundleSizeWarning).toBeLessThan(
        defaultConfig.thresholds.bundleSizeWarning,
      );
      expect(presets.aggressive.thresholds.bundleSizeError).toBeLessThan(
        defaultConfig.thresholds.bundleSizeError,
      );
    });

    it('should have all strategies enabled', () => {
      expect(presets.aggressive.strategies.treeShaking).toBe(true);
      expect(presets.aggressive.strategies.codeSplitting).toBe(true);
      expect(presets.aggressive.strategies.compression).toBe(true);
      expect(presets.aggressive.strategies.caching).toBe(true);
    });

    it('should enforce warning < error ordering', () => {
      expect(presets.aggressive.thresholds.bundleSizeWarning).toBeLessThan(
        presets.aggressive.thresholds.bundleSizeError,
      );
      expect(presets.aggressive.thresholds.buildTimeWarning).toBeLessThan(
        presets.aggressive.thresholds.buildTimeError,
      );
    });
  });

  describe('minimal', () => {
    it('should disable monitoring', () => {
      expect(presets.minimal.monitoring.enabled).toBe(false);
    });
  });
});
