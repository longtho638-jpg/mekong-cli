/**
 * Report Generator for Historical Backtesting
 * Produces HTML, JSON, or CSV reports with equity curve, drawdown, and trade list
 */

import { Trade } from '../../backtest/backtest-types';
import { BacktestMetricsReport } from './metrics-collector';
import { EquityPoint } from './state-manager';
import { BacktestConfig } from './backtest-config-types';

export class ReportGenerator {
  constructor(private outputFormat: 'html' | 'json' | 'csv') {}

  async generateReport(
    metrics: BacktestMetricsReport,
    trades: Trade[],
    equityCurve: EquityPoint[],
    _config: BacktestConfig,
  ): Promise<string> {
    switch (this.outputFormat) {
      case 'html': return this.generateHtml(metrics, trades, equityCurve);
      case 'json': return this.generateJson(metrics, trades);
      case 'csv':  return this.generateCsv(trades);
    }
  }

  private generateHtml(
    metrics: BacktestMetricsReport,
    trades: Trade[],
    equityCurve: EquityPoint[],
  ): string {
    const fmt = (n: number, d = 2) => isFinite(n) ? n.toFixed(d) : '0.00';
    const pct = (n: number) => `${fmt(n * 100)}%`;

    const equityRows = equityCurve.slice(-100).map(p =>
      `[${p.timestamp}, ${p.equity.toFixed(2)}]`
    ).join(',');

    const monthlyRows = Array.from(metrics.monthlyReturns.entries())
      .map(([month, ret]) => `<tr><td>${month}</td><td class="${ret >= 0 ? 'pos' : 'neg'}">${pct(ret)}</td></tr>`)
      .join('');

    const tradeRows = trades.slice(-50).map(t =>
      `<tr>
        <td>${new Date(t.entryTime).toISOString().slice(0, 16)}</td>
        <td>${new Date(t.exitTime).toISOString().slice(0, 16)}</td>
        <td>${fmt(t.entryPrice)}</td>
        <td>${fmt(t.exitPrice)}</td>
        <td class="${t.profit >= 0 ? 'pos' : 'neg'}">${fmt(t.profit)}</td>
        <td class="${t.profit >= 0 ? 'pos' : 'neg'}">${pct(t.profitPercent)}</td>
      </tr>`
    ).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Backtest Report</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #0f172a; color: #e2e8f0; }
  h1 { color: #38bdf8; } h2 { color: #7dd3fc; border-bottom: 1px solid #334155; padding-bottom: 8px; }
  .cards { display: flex; flex-wrap: wrap; gap: 12px; margin: 20px 0; }
  .card { background: #1e293b; border-radius: 8px; padding: 16px 24px; min-width: 160px; }
  .card .label { font-size: 12px; color: #94a3b8; } .card .value { font-size: 24px; font-weight: 700; }
  .pos { color: #4ade80; } .neg { color: #f87171; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #334155; font-size: 13px; }
  th { background: #1e293b; color: #94a3b8; }
  canvas { max-height: 300px; }
  .chart-container { background: #1e293b; border-radius: 8px; padding: 16px; margin: 20px 0; }
</style>
</head>
<body>
<h1>Backtest Report</h1>
<div class="cards">
  <div class="card"><div class="label">Total PnL</div><div class="value ${metrics.totalPnl >= 0 ? 'pos' : 'neg'}">$${fmt(metrics.totalPnl)}</div></div>
  <div class="card"><div class="label">Sharpe Ratio</div><div class="value">${fmt(metrics.sharpeRatio)}</div></div>
  <div class="card"><div class="label">Sortino Ratio</div><div class="value">${fmt(metrics.sortinoRatio)}</div></div>
  <div class="card"><div class="label">Max Drawdown</div><div class="value neg">${pct(metrics.maxDrawdown)}</div></div>
  <div class="card"><div class="label">Win Rate</div><div class="value">${pct(metrics.winRate)}</div></div>
  <div class="card"><div class="label">Profit Factor</div><div class="value">${isFinite(metrics.profitFactor) ? fmt(metrics.profitFactor) : '∞'}</div></div>
  <div class="card"><div class="label">Total Trades</div><div class="value">${metrics.totalTrades}</div></div>
  <div class="card"><div class="label">Calmar Ratio</div><div class="value">${fmt(metrics.calmarRatio)}</div></div>
</div>
<div class="chart-container">
  <h2>Equity Curve</h2>
  <canvas id="equityChart"></canvas>
</div>
<h2>Monthly Returns</h2>
<table><thead><tr><th>Month</th><th>Return</th></tr></thead><tbody>${monthlyRows}</tbody></table>
<h2>Recent Trades (last 50)</h2>
<table><thead><tr><th>Entry Time</th><th>Exit Time</th><th>Entry $</th><th>Exit $</th><th>PnL $</th><th>PnL %</th></tr></thead><tbody>${tradeRows}</tbody></table>
<script>
const ctx = document.getElementById('equityChart').getContext('2d');
const data = [${equityRows}];
new Chart(ctx, { type: 'line', data: { labels: data.map(d => new Date(d[0]).toLocaleDateString()), datasets: [{ label: 'Equity', data: data.map(d => d[1]), borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.1)', fill: true, tension: 0.2, pointRadius: 0 }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }, y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } } } } });
</script>
</body></html>`;
  }

  private generateJson(metrics: BacktestMetricsReport, trades: Trade[]): string {
    return JSON.stringify({
      metrics: {
        ...metrics,
        dailyReturns: Object.fromEntries(metrics.dailyReturns),
        monthlyReturns: Object.fromEntries(metrics.monthlyReturns),
        exposureByAsset: Object.fromEntries(metrics.exposureByAsset),
        exposureByExchange: Object.fromEntries(metrics.exposureByExchange),
      },
      trades,
    }, null, 2);
  }

  private generateCsv(trades: Trade[]): string {
    const header = 'entryTime,exitTime,entryPrice,exitPrice,profit,profitPercent,positionSize,fees';
    const rows = trades.map(t =>
      `${t.entryTime},${t.exitTime},${t.entryPrice},${t.exitPrice},${t.profit},${t.profitPercent},${t.positionSize},${t.fees}`
    );
    return [header, ...rows].join('\n');
  }
}
