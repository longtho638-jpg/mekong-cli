/**
 * Phase 12 Omega — Autopoietic Code Evolution.
 * Module: LlmCodeGenerator
 *
 * Simulates LLM-driven code generation via rule-based refactoring.
 * Identifies unused imports and console.log calls, removes them,
 * and returns a structured result describing changes made.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface GenerationChange {
  type: 'remove_console_log' | 'remove_unused_import' | 'simplify_expression' | 'no_change';
  description: string;
  linesAffected: number;
}

export interface GenerationResult {
  originalCode: string;
  refactoredCode: string;
  changes: GenerationChange[];
  estimatedComplexityDelta: number;
  generatedAt: number;
}

export interface LlmCodeGeneratorConfig {
  /** Remove console.log/warn/error statements. Default: true */
  removeConsoleLogs: boolean;
  /** Remove obviously unused single-name imports. Default: true */
  removeUnusedImports: boolean;
  /** Simplify double-negation (!!x → Boolean(x)). Default: true */
  simplifyExpressions: boolean;
}

const DEFAULT_CONFIG: LlmCodeGeneratorConfig = {
  removeConsoleLogs: true,
  removeUnusedImports: true,
  simplifyExpressions: true,
};

// ── Regex patterns ───────────────────────────────────────────────────────────

const CONSOLE_LOG_LINE = /^.*console\.(log|warn|error|info|debug)\s*\(.*\).*\n?/gm;

/**
 * Matches import lines where the imported name does not appear elsewhere.
 * e.g.: import { Foo } from './foo'  — if 'Foo' only in that line → remove.
 */
const SINGLE_IMPORT_LINE = /^import\s+\{?\s*(\w+)\s*\}?\s+from\s+['"][^'"]+['"]\s*;?\n?/gm;

const DOUBLE_NEGATION = /!!\s*(\w+)/g;

// ── Helpers ──────────────────────────────────────────────────────────────────

function countLines(snippet: string): number {
  return (snippet.match(/\n/g) ?? []).length + (snippet.endsWith('\n') ? 0 : 1);
}

function removeConsoleLogs(code: string): { code: string; change: GenerationChange | null } {
  const matches = code.match(CONSOLE_LOG_LINE) ?? [];
  if (matches.length === 0) return { code, change: null };

  const linesAffected = matches.reduce((s, m) => s + countLines(m), 0);
  const refactored = code.replace(CONSOLE_LOG_LINE, '');

  return {
    code: refactored,
    change: {
      type: 'remove_console_log',
      description: `Removed ${matches.length} console statement(s) (${linesAffected} line(s))`,
      linesAffected,
    },
  };
}

function removeUnusedImports(code: string): { code: string; change: GenerationChange | null } {
  let refactored = code;
  let removedCount = 0;
  let removedLines = 0;

  // Reset lastIndex before iterating
  SINGLE_IMPORT_LINE.lastIndex = 0;
  const importMatches = Array.from(code.matchAll(SINGLE_IMPORT_LINE));

  for (const match of importMatches) {
    const fullLine = match[0];
    const importedName = match[1];

    // Check if the name appears elsewhere (outside the import line itself)
    const codeWithoutImport = code.replace(fullLine, '');
    const usagePattern = new RegExp(`\\b${importedName}\\b`);

    if (!usagePattern.test(codeWithoutImport)) {
      refactored = refactored.replace(fullLine, '');
      removedCount++;
      removedLines += countLines(fullLine);
    }
  }

  if (removedCount === 0) return { code: refactored, change: null };

  return {
    code: refactored,
    change: {
      type: 'remove_unused_import',
      description: `Removed ${removedCount} unused import(s) (${removedLines} line(s))`,
      linesAffected: removedLines,
    },
  };
}

function simplifyExpressions(code: string): { code: string; change: GenerationChange | null } {
  const matches = code.match(DOUBLE_NEGATION) ?? [];
  if (matches.length === 0) return { code, change: null };

  const refactored = code.replace(DOUBLE_NEGATION, 'Boolean($1)');

  return {
    code: refactored,
    change: {
      type: 'simplify_expression',
      description: `Replaced ${matches.length} double-negation(s) with Boolean()`,
      linesAffected: matches.length,
    },
  };
}

// ── LlmCodeGenerator class ───────────────────────────────────────────────────

export class LlmCodeGenerator {
  private readonly config: LlmCodeGeneratorConfig;

  constructor(config: Partial<LlmCodeGeneratorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Apply rule-based refactoring to the provided source code.
   * Returns original + refactored code and a list of changes made.
   */
  generate(sourceCode: string): GenerationResult {
    const changes: GenerationChange[] = [];
    let current = sourceCode;

    if (this.config.removeConsoleLogs) {
      const { code, change } = removeConsoleLogs(current);
      current = code;
      if (change) changes.push(change);
    }

    if (this.config.removeUnusedImports) {
      const { code, change } = removeUnusedImports(current);
      current = code;
      if (change) changes.push(change);
    }

    if (this.config.simplifyExpressions) {
      const { code, change } = simplifyExpressions(current);
      current = code;
      if (change) changes.push(change);
    }

    if (changes.length === 0) {
      changes.push({
        type: 'no_change',
        description: 'No optimizations identified',
        linesAffected: 0,
      });
    }

    const totalLinesRemoved = changes.reduce((s, c) => s + c.linesAffected, 0);

    return {
      originalCode: sourceCode,
      refactoredCode: current,
      changes,
      // Negative delta = reduced complexity (improvement)
      estimatedComplexityDelta: totalLinesRemoved > 0 ? -Math.min(totalLinesRemoved, 10) : 0,
      generatedAt: Date.now(),
    };
  }
}
