import * as fs from 'fs';
import * as path from 'path';
import { PerformanceMetrics, TradeRecord } from './PerformanceAnalyzer';
import { logger } from '../utils/logger';

export class HtmlReporter {
  static generate(metrics: PerformanceMetrics, trades: TradeRecord[], outputPath: string = 'report.html') {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
    <title>Algo Trader Performance Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f9; color: #333; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #3498db; }
        .card h3 { margin: 0 0 10px 0; font-size: 14px; color: #7f8c8d; }
        .card .value { font-size: 24px; font-weight: bold; color: #2c3e50; }
        .win { border-left-color: #2ecc71; }
        .loss { border-left-color: #e74c3c; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        tr:hover { background-color: #f5f5f5; }
        .text-green { color: #2ecc71; font-weight: bold; }
        .text-red { color: #e74c3c; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Algo Trader Performance Report</h1>

        <div class="grid">
            <div class="card">
                <h3>Total Return</h3>
                <div class="value ${metrics.totalReturn >= 0 ? 'text-green' : 'text-red'}">${metrics.totalReturn.toFixed(2)}%</div>
            </div>
            <div class="card win">
                <h3>Win Rate</h3>
                <div class="value">${metrics.winRate.toFixed(2)}%</div>
            </div>
            <div class="card">
                <h3>Profit Factor</h3>
                <div class="value">${metrics.profitFactor.toFixed(2)}</div>
            </div>
            <div class="card loss">
                <h3>Max Drawdown</h3>
                <div class="value text-red">${metrics.maxDrawdown.toFixed(2)}%</div>
            </div>
             <div class="card">
                <h3>Total Trades</h3>
                <div class="value">${metrics.totalTrades}</div>
            </div>
            <div class="card">
                <h3>Sharpe Ratio</h3>
                <div class="value">${metrics.sharpeRatio.toFixed(3)}</div>
            </div>
        </div>

        <h2>Trade History (Last 50)</h2>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Entry Date</th>
                    <th>Exit Date</th>
                    <th>Entry Price</th>
                    <th>Exit Price</th>
                    <th>Profit</th>
                    <th>Return</th>
                </tr>
            </thead>
            <tbody>
                ${trades.slice(-50).reverse().map((t, i) => `
                <tr>
                    <td>${trades.length - i}</td>
                    <td>${new Date(t.entryTime).toLocaleString()}</td>
                    <td>${new Date(t.exitTime).toLocaleString()}</td>
                    <td>${t.entryPrice.toFixed(2)}</td>
                    <td>${t.exitPrice.toFixed(2)}</td>
                    <td class="${t.profit >= 0 ? 'text-green' : 'text-red'}">${t.profit.toFixed(2)}</td>
                    <td class="${t.profitPercent >= 0 ? 'text-green' : 'text-red'}">${t.profitPercent.toFixed(2)}%</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>
    `;

    fs.writeFileSync(path.resolve(process.cwd(), outputPath), html);
    logger.info(`Report generated at: ${outputPath}`);
  }
}
