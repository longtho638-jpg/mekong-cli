import * as fs from 'fs';
import * as path from 'path';
import { crawlFiles, FileMetadata, CrawlOptions } from '../../src/audit/file-crawler';

// Mock fs module
jest.mock('fs');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('file-crawler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('crawlFiles', () => {
    it('should return empty array when directory does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      const options: CrawlOptions = {
        scanPaths: ['src/nonexistent'],
        excludePaths: ['node_modules'],
        rootDir: '/project',
      };

      const result = crawlFiles(options);
      expect(result).toEqual([]);
    });

    it('should find .ts files recursively', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockImplementation((dir: fs.PathLike) => {
        const dirStr = dir.toString();
        if (dirStr.endsWith('src/core')) {
          return [
            { name: 'engine.ts', isDirectory: () => false, isFile: () => true },
            { name: 'utils', isDirectory: () => true, isFile: () => false },
          ] as unknown as fs.Dirent[];
        }
        if (dirStr.endsWith('utils')) {
          return [
            { name: 'helper.ts', isDirectory: () => false, isFile: () => true },
          ] as unknown as fs.Dirent[];
        }
        return [];
      });
      mockFs.statSync.mockReturnValue({
        size: 1024,
        mtime: new Date('2026-01-01'),
      } as fs.Stats);
      mockFs.readFileSync.mockReturnValue('line1\nline2\nline3');

      const options: CrawlOptions = {
        scanPaths: ['src/core'],
        excludePaths: ['node_modules'],
        rootDir: '/project',
      };

      const result = crawlFiles(options);
      expect(result).toHaveLength(2);
      expect(result[0].size).toBe(1024);
      expect(result[0].lineCount).toBe(3);
    });

    it('should exclude specified paths', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockImplementation((dir: fs.PathLike) => {
        const dirStr = dir.toString();
        if (dirStr.endsWith('src/core')) {
          return [
            { name: 'engine.ts', isDirectory: () => false, isFile: () => true },
            { name: 'node_modules', isDirectory: () => true, isFile: () => false },
          ] as unknown as fs.Dirent[];
        }
        return [];
      });
      mockFs.statSync.mockReturnValue({ size: 500, mtime: new Date() } as fs.Stats);
      mockFs.readFileSync.mockReturnValue('line1');

      const result = crawlFiles({
        scanPaths: ['src/core'],
        excludePaths: ['node_modules'],
        rootDir: '/project',
      });

      expect(result).toHaveLength(1);
      expect(result[0].relativePath).toContain('engine.ts');
    });

    it('should skip test files (.test.ts, .spec.ts)', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([
        { name: 'engine.ts', isDirectory: () => false, isFile: () => true },
        { name: 'engine.test.ts', isDirectory: () => false, isFile: () => true },
        { name: 'engine.spec.ts', isDirectory: () => false, isFile: () => true },
      ] as unknown as fs.Dirent[]);
      mockFs.statSync.mockReturnValue({ size: 100, mtime: new Date() } as fs.Stats);
      mockFs.readFileSync.mockReturnValue('code');

      const result = crawlFiles({
        scanPaths: ['src/core'],
        excludePaths: [],
        rootDir: '/project',
      });

      expect(result).toHaveLength(1);
    });

    it('should sort results by relative path', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([
        { name: 'zebra.ts', isDirectory: () => false, isFile: () => true },
        { name: 'alpha.ts', isDirectory: () => false, isFile: () => true },
      ] as unknown as fs.Dirent[]);
      mockFs.statSync.mockReturnValue({ size: 100, mtime: new Date() } as fs.Stats);
      mockFs.readFileSync.mockReturnValue('code');

      const result = crawlFiles({
        scanPaths: ['src/core'],
        excludePaths: [],
        rootDir: '/project',
      });

      expect(result[0].relativePath).toContain('alpha.ts');
      expect(result[1].relativePath).toContain('zebra.ts');
    });

    it('should handle multiple scan paths', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([
        { name: 'file.ts', isDirectory: () => false, isFile: () => true },
      ] as unknown as fs.Dirent[]);
      mockFs.statSync.mockReturnValue({ size: 100, mtime: new Date() } as fs.Stats);
      mockFs.readFileSync.mockReturnValue('code');

      const result = crawlFiles({
        scanPaths: ['src/core', 'src/api'],
        excludePaths: [],
        rootDir: '/project',
      });

      expect(result).toHaveLength(2);
    });
  });
});
