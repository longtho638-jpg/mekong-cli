/**
 * ArbTradeHistoryExporter — Export arbitrage trade history to CSV or JSON.
 * Supports filtering by symbol, date range.
 * Uses synchronous writes (fs.writeFileSync) — suitable for < 10k trades.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PaperTrade } from '../core/paper-trading-engine';
import { logger } from '../utils/logger';

export interface ExportOptions {
  format: 'csv' | 'json';
  outputPath: string;
  filterSymbol?: string;
  startDate?: number;
  endDate?: number;
}

export interface ExportResult {
  path: string;
  count: number;
}

const CSV_HEADER = 'id,timestamp,pair,side,amount,price,fee';

function applyFilters(trades: PaperTrade[], options: ExportOptions): PaperTrade[] {
  return trades.filter((t) => {
    if (options.filterSymbol && t.pair !== options.filterSymbol) return false;
    if (options.startDate && t.timestamp < options.startDate) return false;
    if (options.endDate && t.timestamp > options.endDate) return false;
    return true;
  });
}

function tradeToCSVRow(t: PaperTrade): string {
  return [t.id, t.timestamp, t.pair, t.side, t.amount, t.price, t.fee].join(',');
}

function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export async function exportArbHistory(
  trades: PaperTrade[],
  options: ExportOptions,
): Promise<ExportResult> {
  const filtered = applyFilters(trades, options);

  const outPath = options.outputPath.endsWith(`.${options.format}`)
    ? options.outputPath
    : `${options.outputPath}.${options.format}`;

  ensureDir(outPath);

  if (options.format === 'csv') {
    const rows = [CSV_HEADER, ...filtered.map(tradeToCSVRow)];
    fs.writeFileSync(outPath, rows.join('\n'), 'utf8');
  } else {
    fs.writeFileSync(outPath, JSON.stringify(filtered, null, 2), 'utf8');
  }

  logger.info(`[Exporter] Exported ${filtered.length} trades → ${outPath}`);
  return { path: outPath, count: filtered.length };
}
