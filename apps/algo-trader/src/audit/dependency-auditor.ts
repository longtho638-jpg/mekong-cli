/**
 * Dependency Auditor - Runs npm audit and parses results.
 * Lists vulnerable dependencies with severity and patched versions.
 */
import { execSync } from 'child_process';
import * as path from 'path';

export interface VulnerableDependency {
  name: string;
  severity: 'critical' | 'high' | 'moderate' | 'low' | 'info';
  title: string;
  url: string;
  range: string;
  fixAvailable: boolean;
  patchedVersion: string;
}

export interface AuditSummary {
  totalDependencies: number;
  vulnerabilities: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
    info: number;
    total: number;
  };
  details: VulnerableDependency[];
  rawOutput: string;
}

/**
 * Parse npm audit JSON output into structured data.
 */
export function parseNpmAuditOutput(jsonOutput: string): AuditSummary {
  try {
    const audit = JSON.parse(jsonOutput);
    const details: VulnerableDependency[] = [];
    const vulnCounts = { critical: 0, high: 0, moderate: 0, low: 0, info: 0, total: 0 };

    // npm audit v2+ format
    if (audit.vulnerabilities) {
      for (const [name, vuln] of Object.entries(audit.vulnerabilities)) {
        const v = vuln as Record<string, unknown>;
        const severity = (v.severity as string) || 'low';
        if (severity in vulnCounts) {
          vulnCounts[severity as keyof typeof vulnCounts]++;
        }
        vulnCounts.total++;

        details.push({
          name,
          severity: severity as VulnerableDependency['severity'],
          title: (v.title as string) || `Vulnerability in ${name}`,
          url: (v.url as string) || '',
          range: (v.range as string) || '*',
          fixAvailable: Boolean(v.fixAvailable),
          patchedVersion: typeof v.fixAvailable === 'object'
            ? ((v.fixAvailable as Record<string, string>)?.version || 'N/A')
            : 'N/A',
        });
      }
    }

    return {
      totalDependencies: audit.metadata?.totalDependencies || 0,
      vulnerabilities: vulnCounts,
      details: details.sort((a, b) => {
        const order = { critical: 0, high: 1, moderate: 2, low: 3, info: 4 };
        return order[a.severity] - order[b.severity];
      }),
      rawOutput: jsonOutput,
    };
  } catch {
    return {
      totalDependencies: 0,
      vulnerabilities: { critical: 0, high: 0, moderate: 0, low: 0, info: 0, total: 0 },
      details: [],
      rawOutput: jsonOutput,
    };
  }
}

/**
 * Run npm audit and return parsed results.
 */
export function runDependencyAudit(projectRoot?: string): AuditSummary {
  const cwd = projectRoot || process.cwd();

  try {
    // npm audit returns non-zero exit code when vulnerabilities found
    const output = execSync('npm audit --json 2>/dev/null || true', {
      cwd,
      encoding: 'utf-8',
      timeout: 60000,
      env: { ...process.env, PATH: process.env.PATH },
    });

    return parseNpmAuditOutput(output);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      totalDependencies: 0,
      vulnerabilities: { critical: 0, high: 0, moderate: 0, low: 0, info: 0, total: 0 },
      details: [],
      rawOutput: `Audit failed: ${errorMsg}`,
    };
  }
}
