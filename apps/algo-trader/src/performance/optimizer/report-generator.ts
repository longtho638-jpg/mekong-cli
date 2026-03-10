/**
 * Report Generator — produces HTML report with before/after metrics,
 * bottlenecks found, and tuning actions taken.
 */
import { ProfilingResult, ProfilingSummary } from './profiler';
import { Bottleneck } from './bottleneck-detector';
import { AutoTuneResult, TuneIteration } from './auto-tuner';

export interface ReportData {
  timestamp: string;
  profilingResult: ProfilingResult;
  bottlenecks: Bottleneck[];
  tuneResult: AutoTuneResult;
}

/** Generates an HTML report string */
export function generateHtmlReport(data: ReportData): string {
  const { profilingResult, bottlenecks, tuneResult, timestamp } = data;
  const s = profilingResult.summary;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Performance Tuning Report — ${timestamp}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; background: #0d1117; color: #c9d1d9; }
  h1 { color: #58a6ff; border-bottom: 1px solid #30363d; padding-bottom: 8px; }
  h2 { color: #79c0ff; margin-top: 32px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { padding: 8px 12px; text-align: left; border: 1px solid #30363d; }
  th { background: #161b22; color: #58a6ff; }
  tr:nth-child(even) { background: #161b22; }
  .critical { color: #f85149; font-weight: bold; }
  .high { color: #d29922; font-weight: bold; }
  .medium { color: #58a6ff; }
  .low { color: #8b949e; }
  .accepted { color: #3fb950; }
  .rejected { color: #f85149; }
  .metric-card { display: inline-block; background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 16px; margin: 8px; min-width: 180px; }
  .metric-value { font-size: 24px; font-weight: bold; color: #58a6ff; }
  .metric-label { font-size: 12px; color: #8b949e; margin-top: 4px; }
  .summary-grid { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
</head>
<body>
<h1>Performance Tuning Report</h1>
<p>Generated: ${timestamp} | Duration: ${(profilingResult.durationMs / 1000).toFixed(1)}s | Samples: ${profilingResult.samples.length}</p>

<h2>Profiling Summary</h2>
<div class="summary-grid">
${metricCard('Avg Event Loop Lag', `${s.avgEventLoopLagMs.toFixed(2)} ms`)}
${metricCard('Max Event Loop Lag', `${s.maxEventLoopLagMs.toFixed(2)} ms`)}
${metricCard('Avg CPU User', `${s.avgCpuUserPercent.toFixed(1)}%`)}
${metricCard('Avg Heap Memory', `${s.avgMemoryHeapMB.toFixed(1)} MB`)}
${metricCard('Peak Heap Memory', `${s.peakMemoryHeapMB.toFixed(1)} MB`)}
${metricCard('Total GC Pause', `${s.totalGcPauseMs.toFixed(1)} ms`)}
${metricCard('Avg Network Latency', s.avgNetworkLatencyMs >= 0 ? `${s.avgNetworkLatencyMs.toFixed(1)} ms` : 'N/A')}
${metricCard('Avg Order Throughput', `${s.avgOrderThroughput.toFixed(1)} ops/s`)}
</div>

<h2>Bottlenecks Detected (${bottlenecks.length})</h2>
${bottlenecks.length > 0 ? bottleneckTable(bottlenecks) : '<p>No bottlenecks detected.</p>'}

<h2>Auto-Tuning Results</h2>
<p>Total improvement: <strong>${tuneResult.totalImprovementPercent.toFixed(1)}%</strong> | Accepted: ${tuneResult.acceptedChanges.length} | Rejected: ${tuneResult.rejectedChanges.length}</p>
${tuneResult.iterations.length > 0 ? iterationTable(tuneResult.iterations) : '<p>No tuning iterations performed.</p>'}

<h2>Accepted Changes</h2>
${tuneResult.acceptedChanges.length > 0 ? changesTable(tuneResult.acceptedChanges) : '<p>No changes accepted.</p>'}

</body>
</html>`;
}

function metricCard(label: string, value: string): string {
  return `<div class="metric-card"><div class="metric-value">${value}</div><div class="metric-label">${label}</div></div>`;
}

function bottleneckTable(bottlenecks: Bottleneck[]): string {
  const rows = bottlenecks.map((bn) =>
    `<tr><td class="${bn.severity}">${bn.severity.toUpperCase()}</td><td>${bn.id}</td><td>${bn.description}</td><td>${bn.impactPercent.toFixed(1)}%</td><td>${bn.suggestion}</td></tr>`
  ).join('\n');
  return `<table><tr><th>Severity</th><th>ID</th><th>Description</th><th>Impact</th><th>Suggestion</th></tr>${rows}</table>`;
}

function iterationTable(iterations: TuneIteration[]): string {
  const rows = iterations.map((it) =>
    `<tr><td>${it.iteration}</td><td>${it.mutation.bottleneckId}</td><td>${it.baselineScore.toFixed(1)}</td><td>${it.tunedScore.toFixed(1)}</td><td>${it.improvementPercent.toFixed(1)}%</td><td class="${it.accepted ? 'accepted' : 'rejected'}">${it.accepted ? 'ACCEPTED' : 'REJECTED'}</td></tr>`
  ).join('\n');
  return `<table><tr><th>#</th><th>Target</th><th>Before</th><th>After</th><th>Improvement</th><th>Status</th></tr>${rows}</table>`;
}

function changesTable(mutations: { bottleneckId: string; params: { path: string; currentValue: number; suggestedValue: number; unit: string; reason: string }[] }[]): string {
  const rows: string[] = [];
  for (const m of mutations) {
    for (const p of m.params) {
      rows.push(`<tr><td>${m.bottleneckId}</td><td>${p.path}</td><td>${p.currentValue} ${p.unit}</td><td>${p.suggestedValue} ${p.unit}</td><td>${p.reason}</td></tr>`);
    }
  }
  return `<table><tr><th>Bottleneck</th><th>Config Path</th><th>Before</th><th>After</th><th>Reason</th></tr>${rows.join('\n')}</table>`;
}
