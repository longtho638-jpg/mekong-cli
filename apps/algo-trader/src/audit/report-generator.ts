/**
 * Report Generator - Compiles audit findings into HTML and JSON reports.
 * Self-contained HTML with inline CSS for easy sharing.
 */
import * as fs from 'fs';
import { SecurityFinding, Severity } from './security-scanner';
import { LintSummary } from './eslint-runner';
import { AuditSummary } from './dependency-auditor';
import { FileMetadata } from './file-crawler';

export interface AuditReport {
  timestamp: string;
  totalFiles: number;
  files: FileMetadata[];
  security: SecurityFinding[];
  lint: LintSummary;
  dependencies: AuditSummary;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
}

/** Count security findings by severity */
function countBySeverity(findings: SecurityFinding[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of findings) {
    counts[f.severity]++;
  }
  return counts;
}

/** Escape HTML special characters */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Build the full audit report data structure.
 */
export function buildReport(
  files: FileMetadata[],
  security: SecurityFinding[],
  lint: LintSummary,
  dependencies: AuditSummary
): AuditReport {
  const secCounts = countBySeverity(security);
  return {
    timestamp: new Date().toISOString(),
    totalFiles: files.length,
    files,
    security,
    lint,
    dependencies,
    summary: {
      critical: secCounts.critical + (dependencies.vulnerabilities?.critical || 0),
      high: secCounts.high + (dependencies.vulnerabilities?.high || 0) + lint.totalErrors,
      medium: secCounts.medium + (dependencies.vulnerabilities?.moderate || 0),
      low: secCounts.low + (dependencies.vulnerabilities?.low || 0) + lint.totalWarnings,
      total: security.length + lint.totalErrors + lint.totalWarnings
        + (dependencies.vulnerabilities?.total || 0),
    },
  };
}

/**
 * Generate self-contained HTML report.
 */
export function generateHtml(report: AuditReport): string {
  const { summary, security, lint, dependencies } = report;

  const severityColor: Record<string, string> = {
    critical: '#dc2626', high: '#ea580c', medium: '#d97706', low: '#2563eb',
  };

  const securityRows = security
    .map(
      (f) => `<tr>
      <td><span class="badge" style="background:${severityColor[f.severity]}">${f.severity.toUpperCase()}</span></td>
      <td>${escapeHtml(f.filePath.split('/').slice(-3).join('/'))}</td>
      <td>${f.line}</td>
      <td>${escapeHtml(f.message)}</td>
      <td><code>${escapeHtml(f.codeSnippet.split('\n')[0].trim().slice(0, 80))}</code></td>
      <td>${escapeHtml(f.suggestedFix)}</td>
    </tr>`
    )
    .join('\n');

  const lintRows = lint.results
    .filter((r) => r.issues.length > 0)
    .flatMap((r) =>
      r.issues.map(
        (i) => `<tr>
        <td><span class="badge" style="background:${i.severity === 'error' ? '#dc2626' : '#d97706'}">${i.severity.toUpperCase()}</span></td>
        <td>${escapeHtml(r.filePath.split('/').slice(-3).join('/'))}</td>
        <td>${i.line}</td>
        <td>${escapeHtml(i.rule)}</td>
        <td>${escapeHtml(i.message)}</td>
      </tr>`
      )
    )
    .join('\n');

  const depRows = dependencies.details
    .map(
      (d) => `<tr>
      <td><span class="badge" style="background:${severityColor[d.severity] || '#6b7280'}">${d.severity.toUpperCase()}</span></td>
      <td>${escapeHtml(d.name)}</td>
      <td>${escapeHtml(d.title)}</td>
      <td>${d.fixAvailable ? '✅ ' + escapeHtml(d.patchedVersion) : '❌ No fix'}</td>
    </tr>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Algo Trader - Security &amp; Code Audit Report</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f172a;color:#e2e8f0;line-height:1.6;padding:2rem}
h1{font-size:1.8rem;margin-bottom:1rem;color:#f8fafc}
h2{font-size:1.3rem;margin:2rem 0 1rem;color:#94a3b8;border-bottom:1px solid #334155;padding-bottom:0.5rem}
.summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem;margin:1.5rem 0}
.card{background:#1e293b;border-radius:8px;padding:1.2rem;text-align:center}
.card .count{font-size:2rem;font-weight:700}
.card .label{font-size:0.85rem;color:#94a3b8}
.critical .count{color:#dc2626} .high .count{color:#ea580c}
.medium .count{color:#d97706} .low .count{color:#2563eb}
table{width:100%;border-collapse:collapse;margin:1rem 0}
th,td{padding:0.6rem 0.8rem;text-align:left;border-bottom:1px solid #334155;font-size:0.85rem}
th{background:#1e293b;color:#94a3b8;font-weight:600}
tr:hover{background:#1e293b}
.badge{padding:2px 8px;border-radius:4px;color:#fff;font-size:0.75rem;font-weight:600}
code{background:#334155;padding:2px 6px;border-radius:3px;font-size:0.8rem}
.meta{color:#64748b;font-size:0.8rem;margin-top:2rem}
</style>
</head>
<body>
<h1>🔒 Algo Trader — Security &amp; Code Audit Report</h1>
<p class="meta">Generated: ${report.timestamp} | Files scanned: ${report.totalFiles}</p>

<h2>📊 Summary</h2>
<div class="summary">
  <div class="card critical"><div class="count">${summary.critical}</div><div class="label">Critical</div></div>
  <div class="card high"><div class="count">${summary.high}</div><div class="label">High</div></div>
  <div class="card medium"><div class="count">${summary.medium}</div><div class="label">Medium</div></div>
  <div class="card low"><div class="count">${summary.low}</div><div class="label">Low</div></div>
  <div class="card"><div class="count">${summary.total}</div><div class="label">Total Issues</div></div>
</div>

<h2>🛡️ Security Findings (${security.length})</h2>
${security.length === 0 ? '<p>No security vulnerabilities detected.</p>' : `
<table><thead><tr><th>Severity</th><th>File</th><th>Line</th><th>Issue</th><th>Code</th><th>Fix</th></tr></thead>
<tbody>${securityRows}</tbody></table>`}

<h2>🔍 Code Quality (${lint.totalErrors} errors, ${lint.totalWarnings} warnings)</h2>
${lint.totalErrors + lint.totalWarnings === 0 ? '<p>No code quality issues found.</p>' : `
<table><thead><tr><th>Severity</th><th>File</th><th>Line</th><th>Rule</th><th>Message</th></tr></thead>
<tbody>${lintRows}</tbody></table>`}

<h2>📦 Dependency Vulnerabilities (${dependencies.vulnerabilities?.total || 0})</h2>
${dependencies.details.length === 0 ? '<p>No vulnerable dependencies found.</p>' : `
<table><thead><tr><th>Severity</th><th>Package</th><th>Issue</th><th>Fix</th></tr></thead>
<tbody>${depRows}</tbody></table>`}

<div class="meta">
<p>Lint rules checked: ${Object.keys(lint.issuesByRule).length} |
Top issues: ${Object.entries(lint.issuesByRule).sort(([, a], [, b]) => b - a).slice(0, 3).map(([rule, count]) => `${rule}(${count})`).join(', ')}</p>
</div>
</body></html>`;
}

/**
 * Save report to files (HTML and/or JSON).
 */
export function saveReport(
  report: AuditReport,
  outputPath: string,
  format: 'html' | 'json' | 'both' = 'html'
): string[] {
  const savedFiles: string[] = [];

  if (format === 'html' || format === 'both') {
    const htmlPath = outputPath.endsWith('.html') ? outputPath : `${outputPath}.html`;
    fs.writeFileSync(htmlPath, generateHtml(report), 'utf-8');
    savedFiles.push(htmlPath);
  }

  if (format === 'json' || format === 'both') {
    const jsonPath = outputPath.replace(/\.html$/, '.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');
    savedFiles.push(jsonPath);
  }

  return savedFiles;
}
