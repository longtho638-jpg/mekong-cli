/**
 * Chaos Report Generator - Produces HTML/JSON reports from chaos test results.
 * Shows timeline, failures, recovery metrics, and pass/fail per scenario.
 */
import * as fs from 'fs';
import { ScenarioResult } from './scenario-scheduler';
import { LatencyHistogram } from './monitor-aggregator';

export interface ChaosReport {
  timestamp: string;
  totalScenarios: number;
  passed: number;
  failed: number;
  results: ScenarioResult[];
  latency: LatencyHistogram;
}

/** Escape HTML chars */
function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Build chaos report data structure.
 */
export function buildChaosReport(
  results: ScenarioResult[],
  latency: LatencyHistogram
): ChaosReport {
  return {
    timestamp: new Date().toISOString(),
    totalScenarios: results.length,
    passed: results.filter((r) => r.status === 'passed').length,
    failed: results.filter((r) => r.status === 'failed').length,
    results,
    latency,
  };
}

/**
 * Generate HTML report for chaos test results.
 */
export function generateChaosHtml(report: ChaosReport): string {
  const scenarioRows = report.results
    .map((r) => {
      const statusIcon = r.status === 'passed' ? '✅' : '❌';
      const statusColor = r.status === 'passed' ? '#22c55e' : '#ef4444';
      const assertionDetails = r.assertions
        .map((a) => `${a.passed ? '✓' : '✗'} ${esc(a.name)}: expected ${esc(a.expected)}, got ${esc(a.actual)}`)
        .join('<br>');

      return `<tr>
        <td>${statusIcon} <span style="color:${statusColor}">${r.status.toUpperCase()}</span></td>
        <td>${esc(r.scenario.name)}</td>
        <td>${esc(r.scenario.failure.type)}</td>
        <td>${esc(r.scenario.failure.target)}</td>
        <td>${r.scenario.failure.duration}s</td>
        <td>${r.actualRecoveryTimeSec.toFixed(3)}s</td>
        <td>${assertionDetails}</td>
      </tr>`;
    })
    .join('\n');

  const { latency } = report;

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Chaos Test Report</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;color:#e2e8f0;padding:2rem;line-height:1.6}
h1{font-size:1.8rem;margin-bottom:1rem}
h2{font-size:1.3rem;margin:2rem 0 1rem;color:#94a3b8;border-bottom:1px solid #334155;padding-bottom:0.5rem}
.summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:1rem;margin:1.5rem 0}
.card{background:#1e293b;border-radius:8px;padding:1.2rem;text-align:center}
.card .count{font-size:2rem;font-weight:700}
.card .label{font-size:0.85rem;color:#94a3b8}
.pass .count{color:#22c55e} .fail .count{color:#ef4444}
table{width:100%;border-collapse:collapse;margin:1rem 0}
th,td{padding:0.6rem 0.8rem;text-align:left;border-bottom:1px solid #334155;font-size:0.85rem}
th{background:#1e293b;color:#94a3b8;font-weight:600}
.meta{color:#64748b;font-size:0.8rem;margin-top:2rem}
</style></head><body>
<h1>🔥 Chaos Test Report</h1>
<p class="meta">Generated: ${report.timestamp}</p>

<h2>📊 Summary</h2>
<div class="summary">
  <div class="card"><div class="count">${report.totalScenarios}</div><div class="label">Total</div></div>
  <div class="card pass"><div class="count">${report.passed}</div><div class="label">Passed</div></div>
  <div class="card fail"><div class="count">${report.failed}</div><div class="label">Failed</div></div>
</div>

<h2>⏱️ Latency</h2>
<div class="summary">
  <div class="card"><div class="count">${latency.min.toFixed(0)}</div><div class="label">Min (ms)</div></div>
  <div class="card"><div class="count">${latency.avg.toFixed(0)}</div><div class="label">Avg (ms)</div></div>
  <div class="card"><div class="count">${latency.p95.toFixed(0)}</div><div class="label">P95 (ms)</div></div>
  <div class="card"><div class="count">${latency.max.toFixed(0)}</div><div class="label">Max (ms)</div></div>
</div>

<h2>🧪 Scenario Results</h2>
<table><thead><tr><th>Status</th><th>Name</th><th>Type</th><th>Target</th><th>Duration</th><th>Recovery</th><th>Assertions</th></tr></thead>
<tbody>${scenarioRows}</tbody></table>

</body></html>`;
}

/**
 * Save chaos report to file.
 */
export function saveChaosReport(
  report: ChaosReport,
  outputPath: string
): string[] {
  const saved: string[] = [];
  const htmlPath = outputPath.endsWith('.html') ? outputPath : `${outputPath}.html`;
  fs.writeFileSync(htmlPath, generateChaosHtml(report), 'utf-8');
  saved.push(htmlPath);

  const jsonPath = htmlPath.replace(/\.html$/, '.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');
  saved.push(jsonPath);

  return saved;
}
