import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

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
  console.log('🏗️  Extracting hardcoded strings (Experimental)...');
  console.log(`Root: ${ROOT_DIR}`);

  const files: string[] = [];
  SEARCH_DIRS.forEach(dir => {
    const pattern = `${dir}/**/*.{ts,tsx,astro}`;
    console.log(`Pattern: ${pattern}`);
    const matchedFiles = globSync(pattern, {
      cwd: ROOT_DIR,
      ignore: EXCLUDE_PATTERNS
    }).map(f => path.join(ROOT_DIR, f));
    files.push(...matchedFiles);
  });

  console.log(`Scanning ${files.length} files...`);

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
    console.log(`\n📄 ${file}:`);
    strings.forEach(s => {
      console.log(`   - "${s}"`);
      totalCount++;
    });
  });

  console.log(`\nFound ${totalCount} potential hardcoded strings across ${Object.keys(results).length} files.`);
  console.log('Note: This is a rough extraction and includes many false positives (imports, keys, etc).');
}

extract();
