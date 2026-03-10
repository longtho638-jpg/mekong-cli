/**
 * Compliance Logger — immutable audit log for live trading activities.
 * Logs encrypted locally, exportable to CSV for accounting.
 */
import { encrypt } from './account-vault';

export interface TradeLogEntry {
  timestamp: string;
  exchange: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  fee: number;
  feeCurrency: string;
  proxyUsed: string;
  fingerprintId: string;
  antiBotEvent?: string;
  orderId: string;
  canaryMode: boolean;
}

export interface ComplianceLog {
  entries: TradeLogEntry[];
  createdAt: string;
  version: string;
}

/** Creates a new empty compliance log */
export function createComplianceLog(): ComplianceLog {
  return {
    entries: [],
    createdAt: new Date().toISOString(),
    version: '1.0.0',
  };
}

/** Appends a trade entry (immutable — creates new array) */
export function appendEntry(log: ComplianceLog, entry: TradeLogEntry): ComplianceLog {
  return {
    ...log,
    entries: [...log.entries, entry],
  };
}

/** Serializes log to encrypted JSON string */
export function serializeEncrypted(log: ComplianceLog, password: string): string {
  const json = JSON.stringify(log);
  return encrypt(json, password);
}

/** Converts log entries to CSV format for accounting */
export function toCSV(log: ComplianceLog): string {
  const headers = [
    'timestamp', 'exchange', 'symbol', 'side', 'quantity', 'price',
    'fee', 'feeCurrency', 'orderId', 'proxyUsed', 'fingerprintId',
    'antiBotEvent', 'canaryMode',
  ];
  const rows = log.entries.map((e) => [
    e.timestamp, e.exchange, e.symbol, e.side,
    String(e.quantity), String(e.price), String(e.fee),
    e.feeCurrency, e.orderId, e.proxyUsed, e.fingerprintId,
    e.antiBotEvent ?? '', String(e.canaryMode),
  ].map(escapeCsvField).join(','));
  return [headers.join(','), ...rows].join('\n');
}

function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/** Filters entries by date range */
export function filterByDateRange(
  log: ComplianceLog,
  from: Date,
  to: Date
): TradeLogEntry[] {
  return log.entries.filter((e) => {
    const t = new Date(e.timestamp).getTime();
    return t >= from.getTime() && t <= to.getTime();
  });
}

/** Calculates summary stats for a log */
export function getLogSummary(log: ComplianceLog): {
  totalTrades: number;
  totalVolume: number;
  totalFees: number;
  byExchange: Record<string, number>;
  antiBotEvents: number;
} {
  const byExchange: Record<string, number> = {};
  let totalVolume = 0;
  let totalFees = 0;
  let antiBotEvents = 0;

  for (const e of log.entries) {
    totalVolume += e.quantity * e.price;
    totalFees += e.fee;
    byExchange[e.exchange] = (byExchange[e.exchange] ?? 0) + 1;
    if (e.antiBotEvent) antiBotEvents++;
  }

  return {
    totalTrades: log.entries.length,
    totalVolume,
    totalFees,
    byExchange,
    antiBotEvents,
  };
}
