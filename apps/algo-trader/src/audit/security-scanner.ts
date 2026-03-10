/**
 * Security Scanner - Regex + pattern-based security vulnerability detection.
 * Scans TypeScript files for hardcoded secrets, unsafe eval, insecure randomness,
 * missing input validation, and SQL injection patterns.
 */
import * as fs from 'fs';

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type CheckType =
  | 'hardcodedSecrets'
  | 'unsafeEval'
  | 'insecureRandom'
  | 'inputValidation'
  | 'sqlInjection';

export interface SecurityFinding {
  filePath: string;
  line: number;
  column: number;
  check: CheckType;
  severity: Severity;
  message: string;
  codeSnippet: string;
  suggestedFix: string;
}

interface PatternRule {
  check: CheckType;
  pattern: RegExp;
  severity: Severity;
  message: string;
  suggestedFix: string;
}

/** Security check patterns - regex-based detection */
const SECURITY_PATTERNS: PatternRule[] = [
  // Hardcoded secrets
  {
    check: 'hardcodedSecrets',
    pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/gi,
    severity: 'critical',
    message: 'Hardcoded API key detected',
    suggestedFix: 'Move to environment variable: process.env.API_KEY',
  },
  {
    check: 'hardcodedSecrets',
    pattern: /(?:private[_-]?key|privatekey)\s*[:=]\s*['"][a-zA-Z0-9_\-/+=]{16,}['"]/gi,
    severity: 'critical',
    message: 'Hardcoded private key detected',
    suggestedFix: 'Store in secure vault or env var: process.env.PRIVATE_KEY',
  },
  {
    check: 'hardcodedSecrets',
    pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{4,}['"]/gi,
    severity: 'critical',
    message: 'Hardcoded password detected',
    suggestedFix: 'Use env var or secrets manager',
  },
  {
    check: 'hardcodedSecrets',
    pattern: /(?:secret)\s*[:=]\s*['"][a-zA-Z0-9_\-]{8,}['"]/gi,
    severity: 'critical',
    message: 'Hardcoded secret value detected',
    suggestedFix: 'Move to environment variable',
  },
  {
    check: 'hardcodedSecrets',
    pattern: /0x[a-fA-F0-9]{40,}/g,
    severity: 'high',
    message: 'Potential hardcoded blockchain address/key',
    suggestedFix: 'Use environment variable for addresses',
  },
  // Unsafe eval
  {
    check: 'unsafeEval',
    pattern: /\beval\s*\(/g,
    severity: 'critical',
    message: 'Unsafe eval() usage detected',
    suggestedFix: 'Replace with JSON.parse() or safe alternatives',
  },
  {
    check: 'unsafeEval',
    pattern: /new\s+Function\s*\(/g,
    severity: 'critical',
    message: 'Unsafe new Function() usage detected',
    suggestedFix: 'Use explicit function definitions instead',
  },
  // Insecure randomness
  {
    check: 'insecureRandom',
    pattern: /Math\.random\s*\(\)/g,
    severity: 'medium',
    message: 'Math.random() used — not cryptographically secure',
    suggestedFix: "Use crypto.randomBytes() or crypto.getRandomValues() for security-sensitive ops",
  },
  // SQL injection
  {
    check: 'sqlInjection',
    pattern: /`(?:SELECT|INSERT|UPDATE|DELETE|DROP)\b[^`]*\$\{/gi,
    severity: 'critical',
    message: 'Potential SQL injection via template literal',
    suggestedFix: 'Use parameterized queries with $1, $2 placeholders',
  },
  // Input validation
  {
    check: 'inputValidation',
    pattern: /req\.(?:body|query|params)\s*(?:\.\w+|\[)/g,
    severity: 'medium',
    message: 'Direct access to request data without validation',
    suggestedFix: 'Validate with zod schema before accessing',
  },
];

/**
 * Extract a code snippet around the match location.
 */
function extractSnippet(lines: string[], lineIdx: number): string {
  const start = Math.max(0, lineIdx - 1);
  const end = Math.min(lines.length, lineIdx + 2);
  return lines.slice(start, end).join('\n');
}

/**
 * Scan a single file for security vulnerabilities.
 */
export function scanFile(
  filePath: string,
  content: string,
  enabledChecks: CheckType[]
): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const lines = content.split('\n');

  // Filter patterns by enabled checks
  const activePatterns = SECURITY_PATTERNS.filter((p) =>
    enabledChecks.includes(p.check)
  );

  for (const rule of activePatterns) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip comments
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;

      // Reset regex lastIndex for global patterns
      rule.pattern.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = rule.pattern.exec(line)) !== null) {
        findings.push({
          filePath,
          line: i + 1,
          column: match.index + 1,
          check: rule.check,
          severity: rule.severity,
          message: rule.message,
          codeSnippet: extractSnippet(lines, i),
          suggestedFix: rule.suggestedFix,
        });
      }
    }
  }

  return findings;
}

/**
 * Scan multiple files for security vulnerabilities.
 */
export function scanFiles(
  files: { filePath: string; content?: string }[],
  enabledChecks: CheckType[]
): SecurityFinding[] {
  const allFindings: SecurityFinding[] = [];

  for (const file of files) {
    const content = file.content || fs.readFileSync(file.filePath, 'utf-8');
    const findings = scanFile(file.filePath, content, enabledChecks);
    allFindings.push(...findings);
  }

  return allFindings.sort((a, b) => {
    const severityOrder: Record<Severity, number> = {
      critical: 0, high: 1, medium: 2, low: 3,
    };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}
