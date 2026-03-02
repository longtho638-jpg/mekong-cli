/**
 * ArbCliDashboard — Real-time terminal dashboard for arbitrage monitoring.
 * Renders spreads, positions, P&L, regime info, circuit breaker status.
 * Uses chalk for colored output, refreshes every 1s via setInterval.
 */

import * as chalk from 'chalk';
import { PaperPnl } from '../core/paper-trading-engine';

export interface SpreadResult {
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  spreadPct: number;
  estimatedProfitUsd: number;
  isProfitable: boolean;
}

export interface ArbPosition {
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  unrealizedPnl: number;
  pnlPct: number;
}

export interface AgiStats {
  currentRegime: string;
  regimeConfidence: number;
  kellyFraction: number;
  circuitState: string;
  totalDetections: number;
  totalExecuted: number;
  successfulExecutions: number;
}

export class ArbCliDashboard {
  private readonly refreshMs: number;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private isPaperMode = false;

  private spreads: SpreadResult[] = [];
  private positions: ArbPosition[] = [];
  private pnl: PaperPnl = { realized: 0, unrealized: 0, total: 0 };
  private engineStats: AgiStats | null = null;

  constructor(refreshMs = 1000) {
    this.refreshMs = refreshMs;
  }

  start(): void {
    this.intervalHandle = setInterval(() => this.render(), this.refreshMs);
  }

  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  updateSpreads(spreads: SpreadResult[]): void {
    this.spreads = spreads;
  }

  updatePositions(positions: ArbPosition[]): void {
    this.positions = positions;
  }

  updatePnl(pnl: PaperPnl): void {
    this.pnl = pnl;
  }

  updateEngineStats(stats: AgiStats): void {
    this.engineStats = stats;
  }

  setPaperMode(enabled: boolean): void {
    this.isPaperMode = enabled;
  }

  render(): void {
    process.stdout.write('\x1B[2J\x1B[H');

    const now = new Date().toLocaleTimeString();
    const modeTag = this.isPaperMode ? chalk.yellow('[PAPER]') : chalk.green('[LIVE]');
    const width = Math.max(process.stdout.columns ?? 80, 80);
    const border = '═'.repeat(width - 2);

    const line = (content: string): void => {
      process.stdout.write(`║ ${content.padEnd(width - 4)} ║\n`);
    };
    const divider = (): void => {
      process.stdout.write(`╠${border}╣\n`);
    };

    // Header
    process.stdout.write(`╔${border}╗\n`);
    line(`${chalk.cyan.bold('AGI ARBITRAGE DASHBOARD')}  ${modeTag}  ${chalk.grey(now)}`);
    divider();

    // Regime + engine stats
    if (this.engineStats) {
      const s = this.engineStats;
      const regimeColor = s.currentRegime === 'trending' ? chalk.green : chalk.yellow;
      const cbColor = s.circuitState === 'OPEN' ? chalk.red : chalk.green;
      line(
        `REGIME: ${regimeColor(s.currentRegime)} (${(s.regimeConfidence * 100).toFixed(0)}%)` +
        `  │  KELLY: ${(s.kellyFraction * 100).toFixed(1)}%` +
        `  │  CIRCUIT: ${cbColor(s.circuitState)}`,
      );
      line(
        `Detections: ${s.totalDetections}` +
        `  │  Executed: ${s.totalExecuted}` +
        `  │  Success: ${s.successfulExecutions}`,
      );
      divider();
    }

    // Top spreads
    line(chalk.cyan('TOP SPREADS'));
    if (this.spreads.length === 0) {
      line(chalk.grey('  No spreads detected'));
    } else {
      for (const sp of this.spreads.slice(0, 5)) {
        const profitColor = sp.isProfitable ? chalk.green : chalk.yellow;
        const tag = sp.isProfitable ? '[PROFITABLE]' : '[BELOW THRESH]';
        const route = `${sp.buyExchange}→${sp.sellExchange}`;
        line(
          `  ${sp.symbol.padEnd(12)}${route.padEnd(20)}` +
          profitColor(`+${sp.spreadPct.toFixed(3)}%  $${sp.estimatedProfitUsd.toFixed(2)}  ${tag}`),
        );
      }
    }
    divider();

    // Active positions
    line(chalk.cyan(`POSITIONS (${this.positions.length} active)`));
    if (this.positions.length === 0) {
      line(chalk.grey('  No open positions'));
    } else {
      for (let i = 0; i < Math.min(this.positions.length, 5); i++) {
        const pos = this.positions[i];
        const pnlColor = pos.unrealizedPnl >= 0 ? chalk.green : chalk.red;
        const pnlStr = `${pos.unrealizedPnl >= 0 ? '+' : ''}$${pos.unrealizedPnl.toFixed(2)}  ${pos.pnlPct.toFixed(3)}%`;
        line(
          `  #${i + 1}  ${pos.symbol}` +
          `  buy@${pos.buyExchange} sell@${pos.sellExchange}` +
          `  ${pnlColor(pnlStr)}`,
        );
      }
    }
    divider();

    // P&L summary
    const realColor = this.pnl.realized >= 0 ? chalk.green : chalk.red;
    const unrColor = this.pnl.unrealized >= 0 ? chalk.green : chalk.red;
    const totalColor = this.pnl.total >= 0 ? chalk.green : chalk.red;
    line(
      `P&L: ${realColor(`$${this.pnl.realized.toFixed(2)} realized`)}` +
      `  │  ${unrColor(`$${this.pnl.unrealized.toFixed(2)} unrealized`)}` +
      `  │  Total: ${chalk.bold(totalColor(`$${this.pnl.total.toFixed(2)}`))}`,
    );
    process.stdout.write(`╚${border}╝\n`);
  }
}
