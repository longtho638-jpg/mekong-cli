/**
 * Risk Dashboard UI — Terminal-based real-time risk monitoring display.
 *
 * Features:
 * - Bordered dashboard layout with sections
 * - Color-coded status (GREEN/YELLOW/RED)
 * - Progress bars for position limits
 * - Auto-refresh compatible (stateless render function)
 */

import * as chalk from 'chalk';

/**
 * Dashboard data input from risk modules
 */
export interface DashboardData {
  /** Total PnL across all strategies */
  totalPnl: number;
  /** Daily PnL */
  dailyPnl: number;
  /** Daily PnL percentage */
  dailyPnlPct: number;
  /** Current drawdown percentage */
  drawdownPct: number;
  /** Circuit breaker state: CLOSED, WARNING, TRIPPED */
  circuitState: 'CLOSED' | 'WARNING' | 'TRIPPED';
  /** Sharpe ratio (24h) */
  sharpe24h: number;
  /** Sortino ratio (24h) */
  sortino24h: number;
  /** Calmar ratio (24h) */
  calmar24h: number;
  /** Position limits per strategy */
  positions: Array<{
    name: string;
    current: number;
    limit: number;
    pct: number;
  }>;
  /** Recent alerts */
  alerts: Array<{
    time: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
  }>;
}

/**
 * Render progress bar with unicode blocks
 */
function renderProgressBar(pct: number, width: number = 10): string {
  const filled = Math.round((pct / 100) * width);
  const empty = width - filled;
  const filledBlocks = '█'.repeat(filled);
  const emptyBlocks = '░'.repeat(empty);

  // Color-code based on utilization
  let color: (text: string) => string = chalk.green;
  if (pct >= 90) color = chalk.red;
  else if (pct >= 70) color = chalk.yellow;

  return color(filledBlocks) + chalk.gray(emptyBlocks);
}

/**
 * Get color function for circuit state
 */
function getCircuitColor(state: string): (text: string) => string {
  switch (state) {
    case 'CLOSED': return chalk.green;
    case 'WARNING': return chalk.yellow;
    case 'TRIPPED': return chalk.red;
    default: return chalk.white;
  }
}

/**
 * Get color for PnL value
 */
function getPnlColor(value: number): (text: string) => string {
  return value >= 0 ? chalk.green : chalk.red;
}

/**
 * Get icon for circuit state
 */
function getCircuitIcon(state: string): string {
  switch (state) {
    case 'CLOSED': return '✅';
    case 'WARNING': return '⚠️';
    case 'TRIPPED': return '🛑';
    default: return '❓';
  }
}

/**
 * Render complete risk dashboard
 */
export function renderDashboard(data: DashboardData): string {
  const width = 58;
  const hLine = '═'.repeat(width);
  const dLine = '─'.repeat(width);

  const lines: string[] = [];

  // Header
  lines.push(chalk.bold.cyanBright('╔' + hLine + '╗'));
  lines.push(chalk.bold.cyanBright('║') +
    chalk.bold.white('  RISK DASHBOARD - AgencyOS Algo Trader') +
    chalk.bold.cyanBright(' '.repeat(Math.max(0, width - 38)) + '║'));

  // Top border
  lines.push(chalk.bold.cyanBright('╠' + hLine + '╣'));

  // PnL Summary
  const pnlSign = data.totalPnl >= 0 ? '+' : '';
  const dailySign = data.dailyPnl >= 0 ? '+' : '';
  const pnlColor = getPnlColor(data.totalPnl);
  const dailyColor = getPnlColor(data.dailyPnl);

  lines.push(chalk.bold.cyanBright('║') +
    `  ${chalk.white('Total PnL:')} ${pnlColor(pnlSign + '$' + Math.abs(data.totalPnl).toFixed(2))}` +
    ' '.repeat(Math.max(0, 26 - (pnlSign.length + Math.abs(data.totalPnl).toFixed(2).length))) +
    `│  ${chalk.white('Daily:')} ${dailyColor(dailySign + '$' + Math.abs(data.dailyPnl).toFixed(2))} (${dailySign + (data.dailyPnlPct * 100).toFixed(1)}%)` +
    ' '.repeat(Math.max(0, width - 54 - (dailySign.length + Math.abs(data.dailyPnl).toFixed(2).length))) +
    chalk.bold.cyanBright('║'));

  // Drawdown & Circuit
  const ddColor = data.drawdownPct <= -10 ? chalk.red : data.drawdownPct <= -5 ? chalk.yellow : chalk.white;
  const circuitColor = getCircuitColor(data.circuitState);
  const circuitIcon = getCircuitIcon(data.circuitState);

  lines.push(chalk.bold.cyanBright('║') +
    `  ${chalk.white('Drawdown:')} ${ddColor((data.drawdownPct * 100).toFixed(1) + '%')}` +
    ' '.repeat(Math.max(0, 28 - (data.drawdownPct * 100).toFixed(1).length)) +
    `│  ${chalk.white('Circuit:')} ${circuitColor(data.circuitState + ' ' + circuitIcon)}` +
    ' '.repeat(Math.max(0, width - 52 - data.circuitState.length)) +
    chalk.bold.cyanBright('║'));

  // Separator
  lines.push(chalk.bold.cyanBright('╠' + hLine + '╣'));

  // Risk Ratios
  const sharpeColor = data.sharpe24h >= 1.5 ? chalk.green : data.sharpe24h >= 1 ? chalk.yellow : chalk.white;
  const sortinoColor = data.sortino24h >= 2 ? chalk.green : data.sortino24h >= 1.5 ? chalk.yellow : chalk.white;
  const calmarColor = data.calmar24h >= 2 ? chalk.green : data.calmar24h >= 1 ? chalk.yellow : chalk.white;

  lines.push(chalk.bold.cyanBright('║') +
    `  ${chalk.white('Sharpe (24h):')} ${sharpeColor(data.sharpe24h.toFixed(2))}` +
    ' '.repeat(Math.max(0, 15 - data.sharpe24h.toFixed(2).length)) +
    `│  ${chalk.white('Sortino:')} ${sortinoColor(data.sortino24h.toFixed(2))}` +
    ' '.repeat(Math.max(0, 13 - data.sortino24h.toFixed(2).length)) +
    `│  ${chalk.white('Calmar:')} ${calmarColor(data.calmar24h.toFixed(1))}` +
    ' '.repeat(Math.max(0, width - 56 - data.calmar24h.toFixed(1).length)) +
    chalk.bold.cyanBright('║'));

  // Separator
  lines.push(chalk.bold.cyanBright('╠' + hLine + '╣'));

  // Position Limits Header
  lines.push(chalk.bold.cyanBright('║') +
    chalk.white('  Position Limits:') +
    ' '.repeat(width - 19) +
    chalk.bold.cyanBright('║'));

  // Position Limits per Strategy
  for (const pos of data.positions) {
    const bar = renderProgressBar(pos.pct, 10);
    const name = pos.name.padEnd(14);
    const currentStr = ('$' + pos.current.toFixed(0)).padStart(8);
    const limitStr = ('$' + pos.limit.toFixed(0)).padStart(8);
    const pctStr = (`${pos.pct.toFixed(0)}%`).padStart(4);

    lines.push(chalk.bold.cyanBright('║') +
      `  ${name}: ${currentStr} / ${limitStr} ${pctStr}  ${bar}` +
      ' '.repeat(Math.max(0, width - 52 - pos.name.length)) +
      chalk.bold.cyanBright('║'));
  }

  // Pad if fewer than 3 positions
  for (let i = data.positions.length; i < 3; i++) {
    lines.push(chalk.bold.cyanBright('║') +
      ' '.repeat(width - 2) +
      chalk.bold.cyanBright('║'));
  }

  // Separator
  lines.push(chalk.bold.cyanBright('╠' + hLine + '╣'));

  // Recent Alerts Header
  lines.push(chalk.bold.cyanBright('║') +
    chalk.white('  Recent Alerts:') +
    ' '.repeat(width - 17) +
    chalk.bold.cyanBright('║'));

  // Alert lines (show last 3)
  const recentAlerts = data.alerts.slice(0, 3);
  for (const alert of recentAlerts) {
    const severityColor = alert.severity === 'critical' ? chalk.red :
      alert.severity === 'warning' ? chalk.yellow : chalk.blue;
    const severityLabel = alert.severity === 'critical' ? 'CRITICAL' :
      alert.severity === 'warning' ? 'WARNING' : 'INFO';

    const alertText = `[${alert.time}] ${severityColor(severityLabel)}: ${alert.message}`;
    const truncated = alertText.length > width - 4 ? alertText.slice(0, width - 7) + '...' : alertText;

    lines.push(chalk.bold.cyanBright('║') +
      `  ${truncated}` +
      ' '.repeat(Math.max(0, width - 4 - truncated.length)) +
      chalk.bold.cyanBright('║'));
  }

  // Pad if fewer than 3 alerts
  for (let i = recentAlerts.length; i < 2; i++) {
    lines.push(chalk.bold.cyanBright('║') +
      ' '.repeat(width - 2) +
      chalk.bold.cyanBright('║'));
  }

  // Footer
  lines.push(chalk.bold.cyanBright('╚' + hLine + '╝'));

  return lines.join('\n');
}

/**
 * Render quick status snapshot (for status command)
 */
export function renderStatusSnapshot(data: DashboardData): string {
  const lines: string[] = [];

  lines.push(chalk.bold.cyan('\n=== Risk Status Snapshot ==='));
  lines.push(chalk.gray(`Time: ${new Date().toISOString()}`));
  lines.push('');

  // PnL
  const pnlColor = getPnlColor(data.totalPnl);
  lines.push(`Total PnL:    ${pnlColor((data.totalPnl >= 0 ? '+' : '') + '$' + Math.abs(data.totalPnl).toFixed(2))}`);
  lines.push(`Daily PnL:    ${getPnlColor(data.dailyPnl)((data.dailyPnl >= 0 ? '+' : '') + '$' + Math.abs(data.dailyPnl).toFixed(2))} (${(data.dailyPnlPct * 100).toFixed(2)}%)`);
  lines.push('');

  // Risk Metrics
  lines.push(`Drawdown:     ${(data.drawdownPct * 100).toFixed(2)}%`);
  const circuitColor = getCircuitColor(data.circuitState);
  lines.push(`Circuit:      ${circuitColor(data.circuitState)} ${getCircuitIcon(data.circuitState)}`);
  lines.push('');

  // Ratios
  lines.push(`Sharpe (24h): ${data.sharpe24h.toFixed(2)}`);
  lines.push(`Sortino:      ${data.sortino24h.toFixed(2)}`);
  lines.push(`Calmar:       ${data.calmar24h.toFixed(2)}`);
  lines.push('');

  // Positions
  lines.push(chalk.bold('Position Limits:'));
  for (const pos of data.positions) {
    const bar = renderProgressBar(pos.pct, 20);
    lines.push(`  ${pos.name.padEnd(14)}: $${pos.current.toFixed(0)} / $${pos.limit.toFixed(0)} (${pos.pct.toFixed(1)}%) ${bar}`);
  }
  lines.push('');

  return lines.join('\n');
}
