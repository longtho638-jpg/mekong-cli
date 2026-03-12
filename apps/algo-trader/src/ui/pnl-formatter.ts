/**
 * pnl-formatter — Formatting utilities for P&L display
 *
 * Features:
 * - Currency formatting with locale support
 * - P&L colorization for terminal output
 * - Percentage formatting with configurable decimals
 *
 * @module ui
 */

import * as chalk from 'chalk';
import { TerminalColor } from '../interfaces/IPnLDisplay';

/**
 * Format a number as currency (USD default)
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format P&L with color and optional prefix
 */
export function formatPnL(pnl: number, prefix?: string): string {
  const formatted = pnl >= 0 ? `+${pnl.toFixed(2)}` : pnl.toFixed(2);
  const colored = colorizePnL(pnl, formatted);
  return prefix ? `${prefix}${colored}` : colored;
}

/**
 * Format percentage with configurable decimals
 */
export function formatPercent(value: number, decimals: number = 2): string {
  const percent = (value * 100).toFixed(decimals);
  return `${percent}%`;
}

/**
 * Colorize text based on P&L value
 */
export function colorizePnL(value: number, text: string): string {
  if (value > 0) return chalk.green(text);
  if (value < 0) return chalk.red(text);
  return chalk.yellow(text);
}

/**
 * Generic colorize function for terminal text
 */
export function colorize(text: string, color: TerminalColor): string {
  switch (color) {
    case TerminalColor.Green:
      return chalk.green(text);
    case TerminalColor.Red:
      return chalk.red(text);
    case TerminalColor.Yellow:
      return chalk.yellow(text);
    case TerminalColor.Cyan:
      return chalk.cyan(text);
    case TerminalColor.Blue:
      return chalk.blue(text);
    default:
      return chalk.white(text);
  }
}

/**
 * Format a date for display (YYYY-MM-DD)
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString().split('T')[0];
}

/**
 * Format timestamp for display (HH:MM:SS)
 */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Get current UTC date string (for daily P&L reset)
 */
export function getCurrentUTCDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calculate win rate from wins and total trades
 */
export function calculateWinRate(wins: number, total: number): number {
  if (total === 0) return 0;
  return wins / total;
}
