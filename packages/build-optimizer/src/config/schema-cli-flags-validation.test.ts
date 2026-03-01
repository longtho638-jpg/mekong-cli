import { describe, it, expect } from 'vitest';
import { CliFlagsSchema, PartialConfigSchema } from './schema.js';

describe('CliFlagsSchema', () => {
  it('should parse empty object with defaults', () => {
    const result = CliFlagsSchema.parse({});

    expect(result.verbose).toBe(false);
    expect(result.dryRun).toBe(false);
    expect(result.format).toBe('table');
    expect(result.config).toBeUndefined();
    expect(result.app).toBeUndefined();
  });

  it('should accept verbose flag', () => {
    const result = CliFlagsSchema.parse({ verbose: true });
    expect(result.verbose).toBe(true);
  });

  it('should accept dryRun flag', () => {
    const result = CliFlagsSchema.parse({ dryRun: true });
    expect(result.dryRun).toBe(true);
  });

  it('should accept format values: json, table, compact', () => {
    for (const format of ['json', 'table', 'compact'] as const) {
      const result = CliFlagsSchema.parse({ format });
      expect(result.format).toBe(format);
    }
  });

  it('should reject invalid format value', () => {
    expect(() => CliFlagsSchema.parse({ format: 'xml' })).toThrow();
  });

  it('should accept optional config file path', () => {
    const result = CliFlagsSchema.parse({ config: './mekong.config.js' });
    expect(result.config).toBe('./mekong.config.js');
  });

  it('should accept optional app name', () => {
    const result = CliFlagsSchema.parse({ app: 'my-app' });
    expect(result.app).toBe('my-app');
  });
});

describe('PartialConfigSchema', () => {
  it('should accept empty object (all fields optional)', () => {
    const result = PartialConfigSchema.parse({});
    expect(result).toBeDefined();
  });

  it('should accept partial thresholds', () => {
    const result = PartialConfigSchema.parse({
      thresholds: { bundleSizeWarning: 300 },
    });
    expect(result.thresholds?.bundleSizeWarning).toBe(300);
  });

  it('should accept partial strategies', () => {
    const result = PartialConfigSchema.parse({
      strategies: { treeShaking: false },
    });
    expect(result.strategies?.treeShaking).toBe(false);
  });

  it('should accept partial monitoring config', () => {
    const result = PartialConfigSchema.parse({
      monitoring: { enabled: false },
    });
    expect(result.monitoring?.enabled).toBe(false);
  });

  it('should accept apps array', () => {
    const result = PartialConfigSchema.parse({
      apps: [
        {
          name: 'web',
          path: './apps/web',
          type: 'nextjs',
          buildCommand: 'npm run build',
          outputDir: '.next',
        },
      ],
    });
    expect(result.apps?.[0]?.name).toBe('web');
  });
});
