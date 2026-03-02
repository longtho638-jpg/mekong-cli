/**
 * Reporting page: paginated trade history table with CSV export and summary stats.
 * GET /trades or /arb/positions — sortable columns, PnL coloring, 20 rows per page.
 */
import { useState, useEffect, useMemo } from 'react';
import { useApiClient } from '../hooks/use-api-client';

interface Trade {
  id: string;
  date: string;
  pair: string;
  side: 'BUY' | 'SELL';
  price: number;
  amount: number;
  fee: number;
  pnl: number;
  exchange: string;
}

type SortKey = keyof Trade;
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 20;

const MOCK_TRADES: Trade[] = Array.from({ length: 47 }, (_, i) => {
  const side: 'BUY' | 'SELL' = i % 2 === 0 ? 'BUY' : 'SELL';
  const pnl = (Math.random() - 0.45) * 200;
  return {
    id: `t${i + 1}`,
    date: new Date(Date.now() - i * 3_600_000 * 4).toISOString(),
    pair: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'][i % 4],
    side,
    price: 40000 + Math.random() * 20000,
    amount: 0.01 + Math.random() * 0.5,
    fee: Math.random() * 2,
    pnl: parseFloat(pnl.toFixed(2)),
    exchange: ['binance', 'kraken', 'coinbase', 'bybit'][i % 4],
  };
});

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function pnlClass(v: number) {
  return v > 0 ? 'text-profit' : v < 0 ? 'text-loss' : 'text-muted';
}

function exportCsv(trades: Trade[]) {
  const headers = ['Date', 'Pair', 'Side', 'Price', 'Amount', 'Fee', 'PnL', 'Exchange'];
  const rows = trades.map((t) => [
    new Date(t.date).toISOString(),
    t.pair,
    t.side,
    t.price.toFixed(2),
    t.amount.toFixed(6),
    t.fee.toFixed(4),
    t.pnl.toFixed(2),
    t.exchange,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `trades-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface SortHeaderProps {
  label: string;
  col: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (col: SortKey) => void;
}

function SortHeader({ label, col, current, dir, onSort }: SortHeaderProps) {
  const active = current === col;
  return (
    <th
      onClick={() => onSort(col)}
      className="px-3 py-2 text-left text-xs font-semibold text-muted cursor-pointer hover:text-accent select-none whitespace-nowrap"
    >
      {label}
      {active && <span className="ml-1 text-accent">{dir === 'asc' ? '▲' : '▼'}</span>}
    </th>
  );
}

export function ReportingPage() {
  const { fetchApi } = useApiClient();
  const [trades, setTrades] = useState<Trade[]>(MOCK_TRADES);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetchApi<Trade[]>('/trades').then((data) => {
      if (data && data.length > 0) setTrades(data);
    });
  }, [fetchApi]);

  function handleSort(col: SortKey) {
    if (col === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(col);
      setSortDir('desc');
    }
    setPage(0);
  }

  const sorted = useMemo(() => {
    return [...trades].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [trades, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageSlice = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const stats = useMemo(() => {
    const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
    const wins = trades.filter((t) => t.pnl > 0).length;
    const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;
    const avgSize =
      trades.length > 0
        ? trades.reduce((s, t) => s + t.price * t.amount, 0) / trades.length
        : 0;
    return { totalPnl, winRate, avgSize };
  }, [trades]);

  const COLS: { label: string; key: SortKey }[] = [
    { label: 'Date', key: 'date' },
    { label: 'Pair', key: 'pair' },
    { label: 'Side', key: 'side' },
    { label: 'Price', key: 'price' },
    { label: 'Amount', key: 'amount' },
    { label: 'Fee', key: 'fee' },
    { label: 'PnL', key: 'pnl' },
    { label: 'Exchange', key: 'exchange' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-white text-2xl font-bold">Reporting</h1>
        <button
          onClick={() => exportCsv(sorted)}
          className="text-xs bg-accent text-bg font-bold px-4 py-2 rounded hover:opacity-90 transition-opacity"
        >
          Export CSV
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Trades', value: trades.length.toString(), cls: 'text-white' },
          {
            label: 'Total PnL',
            value: `${stats.totalPnl >= 0 ? '+' : ''}$${fmt(stats.totalPnl)}`,
            cls: pnlClass(stats.totalPnl),
          },
          { label: 'Win Rate', value: `${stats.winRate.toFixed(1)}%`, cls: 'text-profit' },
          { label: 'Avg Trade Size', value: `$${fmt(stats.avgSize, 0)}`, cls: 'text-white' },
        ].map((s) => (
          <div key={s.label} className="bg-bg-card border border-bg-border rounded-lg p-4">
            <p className="text-muted text-xs mb-1">{s.label}</p>
            <p className={`font-mono text-lg font-bold ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Trade history table */}
      <div className="bg-bg-card border border-bg-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-xs font-mono">
            <thead className="border-b border-bg-border bg-bg">
              <tr>
                {COLS.map((c) => (
                  <SortHeader
                    key={c.key}
                    label={c.label}
                    col={c.key}
                    current={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {pageSlice.map((t, idx) => (
                <tr
                  key={t.id}
                  className={`border-b border-bg-border hover:bg-bg/50 transition-colors ${
                    idx % 2 === 0 ? '' : 'bg-bg/20'
                  }`}
                >
                  <td className="px-3 py-2 text-muted whitespace-nowrap">
                    {new Date(t.date).toLocaleString('en-US', {
                      month: 'short',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-3 py-2 text-white whitespace-nowrap">{t.pair}</td>
                  <td
                    className={`px-3 py-2 font-bold whitespace-nowrap ${
                      t.side === 'BUY' ? 'text-accent' : 'text-loss'
                    }`}
                  >
                    {t.side}
                  </td>
                  <td className="px-3 py-2 text-white text-right whitespace-nowrap">
                    ${fmt(t.price)}
                  </td>
                  <td className="px-3 py-2 text-white text-right whitespace-nowrap">
                    {t.amount.toFixed(4)}
                  </td>
                  <td className="px-3 py-2 text-muted text-right whitespace-nowrap">
                    ${t.fee.toFixed(4)}
                  </td>
                  <td
                    className={`px-3 py-2 font-bold text-right whitespace-nowrap ${pnlClass(t.pnl)}`}
                  >
                    {t.pnl >= 0 ? '+' : ''}${fmt(t.pnl)}
                  </td>
                  <td className="px-3 py-2 text-muted whitespace-nowrap capitalize">
                    {t.exchange}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-bg-border">
          <span className="text-muted text-xs">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of{' '}
            {sorted.length} trades
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 text-xs border border-bg-border rounded text-muted hover:border-accent hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <span className="px-3 py-1 text-xs text-muted font-mono">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 text-xs border border-bg-border rounded text-muted hover:border-accent hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportingPage;
