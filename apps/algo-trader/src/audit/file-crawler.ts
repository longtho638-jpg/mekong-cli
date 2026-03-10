/**
 * File Crawler - Recursively scans directories for TypeScript files.
 * Returns file paths with metadata (size, last modified).
 */
import * as fs from 'fs';
import * as path from 'path';

export interface FileMetadata {
  filePath: string;
  relativePath: string;
  size: number;
  lastModified: Date;
  lineCount: number;
}

export interface CrawlOptions {
  scanPaths: string[];
  excludePaths: string[];
  extensions?: string[];
  rootDir?: string;
}

/**
 * Recursively collect .ts files from a directory, excluding specified paths.
 */
function walkDir(
  dir: string,
  excludePaths: string[],
  extensions: string[],
  results: string[]
): void {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (excludePaths.some((ex) => fullPath.includes(ex))) continue;

    if (entry.isDirectory()) {
      walkDir(fullPath, excludePaths, extensions, results);
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      // Skip test files
      if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.spec.ts')) continue;
      results.push(fullPath);
    }
  }
}

/**
 * Count lines in a file without loading entire content into memory.
 */
function countLines(filePath: string): number {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split('\n').length;
}

/**
 * Crawl specified paths and return file metadata.
 */
export function crawlFiles(options: CrawlOptions): FileMetadata[] {
  const rootDir = options.rootDir || process.cwd();
  const extensions = options.extensions || ['.ts', '.tsx'];
  const results: FileMetadata[] = [];

  for (const scanPath of options.scanPaths) {
    const absolutePath = path.resolve(rootDir, scanPath);
    const filePaths: string[] = [];
    walkDir(absolutePath, options.excludePaths, extensions, filePaths);

    for (const filePath of filePaths) {
      const stat = fs.statSync(filePath);
      results.push({
        filePath,
        relativePath: path.relative(rootDir, filePath),
        size: stat.size,
        lastModified: stat.mtime,
        lineCount: countLines(filePath),
      });
    }
  }

  return results.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}
