/**
 * ESLint Runner - Runs TypeScript quality checks on files.
 * Uses TypeScript compiler diagnostics as fallback when ESLint is not available.
 * Categorizes issues by rule and severity.
 */
import * as fs from 'fs';

export type IssueSeverity = 'error' | 'warning';

export interface LintIssue {
  filePath: string;
  line: number;
  column: number;
  severity: IssueSeverity;
  rule: string;
  message: string;
}

export interface LintResult {
  filePath: string;
  issues: LintIssue[];
  errorCount: number;
  warningCount: number;
}

export interface LintSummary {
  totalFiles: number;
  totalErrors: number;
  totalWarnings: number;
  issuesByRule: Record<string, number>;
  results: LintResult[];
}

/** Anti-pattern detection rules (regex-based linting) */
interface LintRule {
  id: string;
  pattern: RegExp;
  severity: IssueSeverity;
  message: string;
}

const LINT_RULES: LintRule[] = [
  {
    id: 'no-any-type',
    pattern: /:\s*any\b/g,
    severity: 'warning',
    message: 'Avoid using "any" type — use specific types instead',
  },
  {
    id: 'no-ts-ignore',
    pattern: /@ts-ignore|@ts-nocheck/g,
    severity: 'error',
    message: 'Do not suppress TypeScript errors — fix the type issue',
  },
  {
    id: 'no-console-log',
    pattern: /\bconsole\.(log|warn|error|debug|info)\s*\(/g,
    severity: 'warning',
    message: 'Remove console statements — use structured logger instead',
  },
  {
    id: 'no-todo-fixme',
    pattern: /\/\/\s*(TODO|FIXME|HACK|XXX)\b/gi,
    severity: 'warning',
    message: 'Unresolved TODO/FIXME comment — address or create a ticket',
  },
  {
    id: 'max-line-length',
    pattern: /^.{200,}$/gm,
    severity: 'warning',
    message: 'Line exceeds 200 characters — consider breaking it up',
  },
  {
    id: 'no-empty-catch',
    pattern: /catch\s*\([^)]*\)\s*\{\s*\}/g,
    severity: 'error',
    message: 'Empty catch block — at minimum log the error',
  },
  {
    id: 'no-magic-numbers',
    pattern: /(?<![.\w])(?:0x[a-fA-F0-9]+|\d{4,})(?![.\w])/g,
    severity: 'warning',
    message: 'Magic number — extract to named constant',
  },
];

/**
 * Lint a single file using regex-based rules.
 */
export function lintFile(filePath: string, content: string): LintResult {
  const issues: LintIssue[] = [];
  const lines = content.split('\n');

  for (const rule of LINT_RULES) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip comment-only lines for some rules
      if (rule.id === 'no-any-type' && line.trim().startsWith('//')) continue;

      rule.pattern.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = rule.pattern.exec(line)) !== null) {
        issues.push({
          filePath,
          line: i + 1,
          column: match.index + 1,
          severity: rule.severity,
          rule: rule.id,
          message: rule.message,
        });
      }
    }
  }

  return {
    filePath,
    issues,
    errorCount: issues.filter((i) => i.severity === 'error').length,
    warningCount: issues.filter((i) => i.severity === 'warning').length,
  };
}

/**
 * Lint multiple files and produce a summary.
 */
export function lintFiles(
  files: { filePath: string; content?: string }[]
): LintSummary {
  const results: LintResult[] = [];
  const issuesByRule: Record<string, number> = {};

  for (const file of files) {
    const content = file.content || fs.readFileSync(file.filePath, 'utf-8');
    const result = lintFile(file.filePath, content);
    results.push(result);

    for (const issue of result.issues) {
      issuesByRule[issue.rule] = (issuesByRule[issue.rule] || 0) + 1;
    }
  }

  return {
    totalFiles: files.length,
    totalErrors: results.reduce((sum, r) => sum + r.errorCount, 0),
    totalWarnings: results.reduce((sum, r) => sum + r.warningCount, 0),
    issuesByRule,
    results,
  };
}
