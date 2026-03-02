/**
 * Sortable table displaying open/closed arbitrage positions with PnL coloring.
 * Columns: Symbol, Buy Exchange, Sell Exchange, Amount, Buy Price, Sell Price, PnL, Status.
 */
import { useState } from 'react';
import { Position } from '../stores/trading-store';

type SortKey = keyof Pick<Position, 'symbol' | 'buyExchange' | 'sellExchange' | 'amount' | 'buyPrice' | 'sellPrice' | 'pnl' | 'status'>;
type SortDir = 'asc' | 'desc';

interface PositionsTableSortableProps {
  positions: Position[];
}

function formatUsd(n: number): string {
  const abs = Math.abs(n);
  const formatted = abs >= 1000
    ? abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : abs.toFixed(4);
  return (n < 0 ? '-' : '') + '$' + formatted;
}

function formatPrice(n: number): string {
  if (n >= 1000) return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1) return '$' + n.toFixed(4);
  return '$' + n.toFixed(6);
}

function SortIcon({ dir }: { dir: SortDir | null }) {
  if (!dir) {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className="text-muted/40">
        <path d="M5 1L8 4H2L5 1ZM5 9L2 6H8L5 9Z" />
      </svg>
    );
  }
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className="text-accent">
      {dir === 'asc'
        ? <path d="M5 1L8 5H2L5 1Z" />
        : <path d="M5 9L2 5H8L5 9Z" />}
    </svg>
  );
}

const COLUMNS: { key: SortKey; label: string; align?: 'right' }[] = [
  { key: 'symbol', label: 'Symbol' },
  { key: 'buyExchange', label: 'Buy Exchange' },
  { key: 'sellExchange', label: 'Sell Exchange' },
  { key: 'amount', label: 'Amount', align: 'right' },
  { key: 'buyPrice', label: 'Buy Price', align: 'right' },
  { key: 'sellPrice', label: 'Sell Price', align: 'right' },
  { key: 'pnl', label: 'PnL', align: 'right' },
  { key: 'status', label: 'Status' },
];

export function PositionsTableSortable({ positions }: PositionsTableSortableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('pnl');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const sorted = [...positions].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    const cmp = typeof av === 'number' && typeof bv === 'number'
      ? av - bv
      : String(av).localeCompare(String(bv));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted font-mono">
        <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24" className="mb-3 opacity-30">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="9" y1="9" x2="9" y2="21" />
        </svg>
        <p className="text-sm">No positions open</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-xs font-mono border-collapse">
        <thead>
          <tr className="border-b border-bg-border">
            {COLUMNS.map(({ key, label, align }) => (
              <th
                key={key}
                onClick={() => handleSort(key)}
                className={`
                  px-3 py-2 text-muted cursor-pointer select-none
                  hover:text-white transition-colors whitespace-nowrap
                  ${align === 'right' ? 'text-right' : 'text-left'}
                `}
              >
                <span className="inline-flex items-center gap-1">
                  {label}
                  <SortIcon dir={sortKey === key ? sortDir : null} />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((pos) => (
            <tr
              key={pos.id}
              className="border-b border-bg-border/50 hover:bg-bg-card/60 transition-colors"
            >
              <td className="px-3 py-2 text-white font-semibold">{pos.symbol}</td>
              <td className="px-3 py-2 text-muted">{pos.buyExchange}</td>
              <td className="px-3 py-2 text-muted">{pos.sellExchange}</td>
              <td className="px-3 py-2 text-right text-white">{pos.amount.toFixed(4)}</td>
              <td className="px-3 py-2 text-right text-muted">{formatPrice(pos.buyPrice)}</td>
              <td className="px-3 py-2 text-right text-muted">{formatPrice(pos.sellPrice)}</td>
              <td className={`px-3 py-2 text-right font-semibold ${pos.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                {formatUsd(pos.pnl)}
              </td>
              <td className="px-3 py-2">
                <span className={`
                  inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide
                  ${pos.status === 'open'
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'bg-muted/10 text-muted border border-muted/20'
                  }
                `}>
                  {pos.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
