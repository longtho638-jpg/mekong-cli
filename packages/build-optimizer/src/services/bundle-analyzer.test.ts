import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BundleAnalyzer } from './bundle-analyzer.js';

describe('BundleAnalyzer', () => {
  let tmpDir: string;
  let analyzer: BundleAnalyzer;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'mekong-bundle-test-'));
    analyzer = new BundleAnalyzer();
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe('analyze — directory fallback', () => {
    it('should return empty metrics for non-existent directory', async () => {
      const result = await analyzer.analyze({ outputDir: join(tmpDir, 'missing') });

      expect(result.totalSize).toBe(0);
      expect(result.assets).toHaveLength(0);
      expect(result.chunks).toHaveLength(0);
    });

    it('should analyze JS and CSS files in output directory', async () => {
      await writeFile(join(tmpDir, 'main.js'), 'console.log("hello");');
      await writeFile(join(tmpDir, 'style.css'), 'body { margin: 0; }');

      const result = await analyzer.analyze({ outputDir: tmpDir });

      expect(result.assets.length).toBeGreaterThanOrEqual(2);
      const jsAsset = result.assets.find(a => a.type === 'js');
      const cssAsset = result.assets.find(a => a.type === 'css');
      expect(jsAsset).toBeDefined();
      expect(cssAsset).toBeDefined();
    });

    it('should sum totalSize across all assets', async () => {
      const content = 'x'.repeat(100);
      await writeFile(join(tmpDir, 'a.js'), content);
      await writeFile(join(tmpDir, 'b.js'), content);

      const result = await analyzer.analyze({ outputDir: tmpDir });

      expect(result.totalSize).toBe(200);
    });

    it('should recurse into subdirectories', async () => {
      const subDir = join(tmpDir, 'static');
      await mkdir(subDir);
      await writeFile(join(subDir, 'chunk.js'), 'chunk');

      const result = await analyzer.analyze({ outputDir: tmpDir });

      const found = result.assets.some(a => a.name.includes('chunk.js'));
      expect(found).toBe(true);
    });
  });

  describe('analyze — webpack stats.json', () => {
    it('should parse webpack stats.json when present', async () => {
      const stats = {
        assets: [
          { name: 'main.js', size: 1024 },
          { name: 'vendor.js', size: 2048, gzipSize: 800 },
        ],
        chunks: [
          { names: ['main'] },
          { names: ['vendor'] },
        ],
      };
      await writeFile(join(tmpDir, 'stats.json'), JSON.stringify(stats));

      const result = await analyzer.analyze({ outputDir: tmpDir });

      expect(result.assets).toHaveLength(2);
      expect(result.totalSize).toBe(3072);
      expect(result.chunks).toContain('main');
      expect(result.chunks).toContain('vendor');
    });

    it('should use gzipSize from stats when provided', async () => {
      const stats = {
        assets: [{ name: 'app.js', size: 1000, gzipSize: 300 }],
        chunks: [],
      };
      await writeFile(join(tmpDir, 'stats.json'), JSON.stringify(stats));

      const result = await analyzer.analyze({ outputDir: tmpDir });

      const asset = result.assets.find(a => a.name === 'app.js');
      expect(asset?.gzipSize).toBe(300);
    });

    it('should use custom stats file name when provided', async () => {
      const stats = {
        assets: [{ name: 'bundle.js', size: 500 }],
        chunks: [],
      };
      await writeFile(join(tmpDir, 'custom-stats.json'), JSON.stringify(stats));

      const result = await analyzer.analyze({ outputDir: tmpDir, statsFile: 'custom-stats.json' });

      expect(result.assets.some(a => a.name === 'bundle.js')).toBe(true);
    });
  });

  describe('calculateBundleBreakdown', () => {
    it('should group asset sizes by type', () => {
      const metrics = {
        totalSize: 5000,
        gzipSize: 1500,
        chunks: [],
        assets: [
          { name: 'main.js', size: 2000, gzipSize: 600, type: 'js' as const },
          { name: 'vendor.js', size: 1500, gzipSize: 450, type: 'js' as const },
          { name: 'style.css', size: 500, gzipSize: 150, type: 'css' as const },
          { name: 'logo.png', size: 1000, gzipSize: 900, type: 'image' as const },
        ],
      };

      const breakdown = analyzer.calculateBundleBreakdown(metrics);

      expect(breakdown.js).toBe(3500);
      expect(breakdown.css).toBe(500);
      expect(breakdown.image).toBe(1000);
      expect(breakdown.font).toBe(0);
      expect(breakdown.other).toBe(0);
    });

    it('should return zero for all types when no assets', () => {
      const metrics = { totalSize: 0, gzipSize: 0, chunks: [], assets: [] };

      const breakdown = analyzer.calculateBundleBreakdown(metrics);

      expect(Object.values(breakdown).every(v => v === 0)).toBe(true);
    });
  });

  describe('findLargestAssets', () => {
    const assets = [
      { name: 'small.js', size: 100, gzipSize: 30, type: 'js' as const },
      { name: 'medium.js', size: 500, gzipSize: 150, type: 'js' as const },
      { name: 'large.js', size: 2000, gzipSize: 600, type: 'js' as const },
      { name: 'huge.js', size: 5000, gzipSize: 1500, type: 'js' as const },
    ];
    const metrics = { totalSize: 7600, gzipSize: 2280, chunks: [], assets };

    it('should return assets sorted by size descending', () => {
      const result = analyzer.findLargestAssets(metrics, 4);

      expect(result[0].name).toBe('huge.js');
      expect(result[1].name).toBe('large.js');
      expect(result[2].name).toBe('medium.js');
      expect(result[3].name).toBe('small.js');
    });

    it('should respect the limit parameter', () => {
      const result = analyzer.findLargestAssets(metrics, 2);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('huge.js');
    });

    it('should default to limit=10', () => {
      const manyAssets = Array.from({ length: 15 }, (_, i) => ({
        name: `file-${i}.js`,
        size: i * 100,
        gzipSize: i * 30,
        type: 'js' as const,
      }));
      const m = { totalSize: 0, gzipSize: 0, chunks: [], assets: manyAssets };

      const result = analyzer.findLargestAssets(m);
      expect(result).toHaveLength(10);
    });

    it('should not mutate the original assets array', () => {
      const original = [...metrics.assets];
      analyzer.findLargestAssets(metrics);

      expect(metrics.assets).toEqual(original);
    });
  });
});
