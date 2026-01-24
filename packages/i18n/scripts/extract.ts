import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';
import { logger } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '../../..');
const SEARCH_DIRS = ['apps', 'packages'];
const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/.turbo/**',
  '**/.next/**',
  '**/packages/i18n/**',
  '**/*.d.ts'
];
const EXTENSIONS = ['.ts', '.tsx', '.astro'];

// Simple regex to find JSX/TSX text content and string literals
// This is a heuristic approach and will likely need refinement
const PATTERNS = [
  />([^<{}>]+)</g, // JSX text content
  /["']([^"']{4,})["']/g // String literals of 4+ characters
];

function extract() {
  logger.info('🏗️  Extracting hardcoded strings (Experimental)...', {
    rootDir: ROOT_DIR
  });

  const files: string[] = [];
  SEARCH_DIRS.forEach(dir => {
    const pattern = `${dir}/**/*.{ts,tsx,astro}`;
    logger.debug(`Scanning pattern: ${pattern}`);
    const matchedFiles = globSync(pattern, {
      cwd: ROOT_DIR,
      ignore: EXCLUDE_PATTERNS
    }).map(f => path.join(ROOT_DIR, f));
    files.push(...matchedFiles);
  });

  logger.info(`Scanning ${files.length} files...`);

  const results: Record<string, Set<string>> = {};

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');

    PATTERNS.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const text = match[1].trim();
        if (text && text.length > 3 && !text.includes('{') && !text.includes('}')) {
          if (!results[file]) results[file] = new Set();
          results[file].add(text);
        }
      }
    });
  });

  let totalCount = 0;
  Object.entries(results).forEach(([file, strings]) => {
    logger.info(`📄 ${path.relative(ROOT_DIR, file)}:`, {
      strings: Array.from(strings)
    });
    totalCount += strings.size;
  });

  logger.info(`\nFound ${totalCount} potential hardcoded strings across ${Object.keys(results).length} files.`);
  logger.warn('Note: This is a rough extraction and includes many false positives (imports, keys, etc).');
}

extract();
