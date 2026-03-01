import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readJson, writeJson, ensureDir, fileExists, ensureParentDir } from './fs.js';

describe('fs utilities', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'mekong-fs-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe('writeJson / readJson', () => {
    it('should write and read a JSON object', async () => {
      const filePath = join(tmpDir, 'data.json');
      const data = { name: 'mekong', version: '0.1.0', active: true };

      await writeJson(filePath, data);
      const result = await readJson<typeof data>(filePath);

      expect(result).toEqual(data);
    });

    it('should write pretty-printed JSON by default', async () => {
      const filePath = join(tmpDir, 'pretty.json');
      const data = { a: 1 };

      await writeJson(filePath, data);
      const { readFile } = await import('node:fs/promises');
      const raw = await readFile(filePath, 'utf-8');

      expect(raw).toContain('\n');
      expect(raw).toContain('  ');
    });

    it('should write compact JSON when pretty=false', async () => {
      const filePath = join(tmpDir, 'compact.json');
      const data = { a: 1, b: 2 };

      await writeJson(filePath, data, { pretty: false });
      const { readFile } = await import('node:fs/promises');
      const raw = await readFile(filePath, 'utf-8');

      expect(raw).toBe('{"a":1,"b":2}');
    });

    it('should handle arrays in JSON', async () => {
      const filePath = join(tmpDir, 'array.json');
      const data = [1, 'two', { three: 3 }];

      await writeJson(filePath, data);
      const result = await readJson<typeof data>(filePath);

      expect(result).toEqual(data);
    });

    it('should throw when reading non-existent file', async () => {
      const filePath = join(tmpDir, 'missing.json');
      await expect(readJson(filePath)).rejects.toThrow();
    });

    it('should throw when reading invalid JSON', async () => {
      const filePath = join(tmpDir, 'bad.json');
      const { writeFile } = await import('node:fs/promises');
      await writeFile(filePath, 'not json', 'utf-8');

      await expect(readJson(filePath)).rejects.toThrow();
    });
  });

  describe('ensureDir', () => {
    it('should create a new directory', async () => {
      const dirPath = join(tmpDir, 'new-dir');

      await ensureDir(dirPath);

      const exists = await fileExists(dirPath);
      expect(exists).toBe(true);
    });

    it('should create nested directories recursively', async () => {
      const dirPath = join(tmpDir, 'a', 'b', 'c');

      await ensureDir(dirPath);

      const exists = await fileExists(dirPath);
      expect(exists).toBe(true);
    });

    it('should not throw if directory already exists', async () => {
      const dirPath = join(tmpDir, 'existing');
      await ensureDir(dirPath);

      await expect(ensureDir(dirPath)).resolves.not.toThrow();
    });
  });

  describe('fileExists', () => {
    it('should return true for an existing file', async () => {
      const filePath = join(tmpDir, 'exists.json');
      await writeJson(filePath, {});

      const result = await fileExists(filePath);
      expect(result).toBe(true);
    });

    it('should return false for a missing file', async () => {
      const result = await fileExists(join(tmpDir, 'nope.txt'));
      expect(result).toBe(false);
    });

    it('should return true for an existing directory', async () => {
      const result = await fileExists(tmpDir);
      expect(result).toBe(true);
    });
  });

  describe('ensureParentDir', () => {
    it('should create the parent directory of a file path', async () => {
      const filePath = join(tmpDir, 'nested', 'deep', 'file.txt');

      await ensureParentDir(filePath);

      const parentExists = await fileExists(join(tmpDir, 'nested', 'deep'));
      expect(parentExists).toBe(true);
    });

    it('should not throw if parent already exists', async () => {
      const filePath = join(tmpDir, 'file.txt');

      await expect(ensureParentDir(filePath)).resolves.not.toThrow();
    });
  });
});
