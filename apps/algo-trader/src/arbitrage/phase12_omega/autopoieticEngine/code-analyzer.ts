/**
 * Phase 12 Omega — Autopoietic Code Evolution.
 * Module: CodeAnalyzer
 *
 * Scans src/ directory and extracts code metrics using regex-based analysis.
 * No heavy AST dependencies — lightweight simulation.
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Types ────────────────────────────────────────────────────────────────────

export interface FileMetrics {
  filePath: string;
  lineCount: number;
  functionCount: number;
  cyclomaticComplexity: number;
  importCount: number;
  hasConsoleLog: boolean;
}

export interface CodebaseMetrics {
  fileCount: number;
  totalLines: number;
  avgLinesPerFile: number;
  totalFunctions: number;
  avgFunctionsPerFile: number;
  avgCyclomaticComplexity: number;
  filesWithConsoleLog: number;
  totalImports: number;
  analyzedAt: number;
  files: FileMetrics[];
}

export interface CodeAnalyzerConfig {
  /** Root directory to scan. Default: 'src' */
  rootDir: string;
  /** File extensions to include. Default: ['.ts'] */
  extensions: string[];
  /** Max files to analyze (prevents runaway). Default: 200 */
  maxFiles: number;
}

const DEFAULT_CONFIG: CodeAnalyzerConfig = {
  rootDir: 'src',
  extensions: ['.ts'],
  maxFiles: 200,
};

// ── Regex patterns ───────────────────────────────────────────────────────────

const FUNCTION_PATTERN =
  /(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>|\w+\s*=>)|(?:async\s+)?(?:public|private|protected)?\s*\w+\s*\([^)]*\)\s*(?::\s*\S+)?\s*\{)/g;

const BRANCH_PATTERN = /\b(?:if|else if|for|while|do|case|&&|\|\||\?\s*[^:]+:)/g;

const IMPORT_PATTERN = /^import\s+/gm;

const CONSOLE_PATTERN = /console\.(log|warn|error|info|debug)/g;

// ── Helpers ──────────────────────────────────────────────────────────────────

function collectFiles(dir: string, extensions: string[], max: number): string[] {
  const result: string[] = [];

  function walk(current: string): void {
    if (result.length >= max) return;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (result.length >= max) break;
      const full = path.join(current, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walk(full);
      } else if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) {
        result.push(full);
      }
    }
  }

  walk(dir);
  return result;
}

function analyzeFile(filePath: string): FileMetrics {
  let content = '';
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return {
      filePath,
      lineCount: 0,
      functionCount: 0,
      cyclomaticComplexity: 1,
      importCount: 0,
      hasConsoleLog: false,
    };
  }

  const lines = content.split('\n');
  const functionMatches = content.match(FUNCTION_PATTERN) ?? [];
  const branchMatches = content.match(BRANCH_PATTERN) ?? [];
  const importMatches = content.match(IMPORT_PATTERN) ?? [];
  const consoleMatches = content.match(CONSOLE_PATTERN) ?? [];

  return {
    filePath,
    lineCount: lines.length,
    functionCount: functionMatches.length,
    // Cyclomatic complexity: 1 + number of decision branches
    cyclomaticComplexity: 1 + branchMatches.length,
    importCount: importMatches.length,
    hasConsoleLog: consoleMatches.length > 0,
  };
}

// ── CodeAnalyzer class ───────────────────────────────────────────────────────

export class CodeAnalyzer {
  private readonly config: CodeAnalyzerConfig;

  constructor(config: Partial<CodeAnalyzerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** Scan the configured rootDir and return aggregated codebase metrics. */
  analyze(): CodebaseMetrics {
    const files = collectFiles(
      this.config.rootDir,
      this.config.extensions,
      this.config.maxFiles,
    );

    const fileMetrics = files.map(analyzeFile);

    const fileCount = fileMetrics.length;
    const totalLines = fileMetrics.reduce((s, f) => s + f.lineCount, 0);
    const totalFunctions = fileMetrics.reduce((s, f) => s + f.functionCount, 0);
    const totalComplexity = fileMetrics.reduce((s, f) => s + f.cyclomaticComplexity, 0);
    const filesWithConsoleLog = fileMetrics.filter((f) => f.hasConsoleLog).length;
    const totalImports = fileMetrics.reduce((s, f) => s + f.importCount, 0);

    return {
      fileCount,
      totalLines,
      avgLinesPerFile: fileCount > 0 ? Math.round(totalLines / fileCount) : 0,
      totalFunctions,
      avgFunctionsPerFile: fileCount > 0 ? Math.round(totalFunctions / fileCount) : 0,
      avgCyclomaticComplexity: fileCount > 0 ? Math.round(totalComplexity / fileCount) : 1,
      filesWithConsoleLog,
      totalImports,
      analyzedAt: Date.now(),
      files: fileMetrics,
    };
  }

  /** Analyze a single file without scanning the whole tree. */
  analyzeFile(filePath: string): FileMetrics {
    return analyzeFile(filePath);
  }
}
