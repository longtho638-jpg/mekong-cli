/**
 * Main dashboard page: connection status, price ticker strip, positions table,
 * spread opportunity cards, and aggregate stats summary.
 */
import { useState, useEffect } from 'react';
import { useTradingStore } from '../stores/trading-store';
import { useWebSocketPriceFeed } from '../hooks/use-websocket-price-feed';
import { PriceTickerStrip } from '../components/price-ticker-strip';
import { PositionsTableSortable } from '../components/positions-table-sortable';
import { SpreadOpportunitiesCardGrid } from '../components/spread-opportunities-card-grid';
import { EquityCurveChart } from '../components/equity-curve-pnl-chart';

function formatUsd(n: number): string {
  const abs = Math.abs(n);
  const s = abs >= 1000
    ? abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : abs.toFixed(2);
  return (n < 0 ? '-' : '') + '$' + s;
}

function useNow(): string {
  const [now, setNow] = useState(() => new Date().toLocaleTimeString('en-US', { hour12: false }));
  useEffect(() => {
    const id = setInterval(() => setNow(new Date().toLocaleTimeString('en-US', { hour12: false })), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function DashboardPage() {
  useWebSocketPriceFeed();
  const connected = useTradingStore((s) => s.connected);
  const positions = useTradingStore((s) => s.positions);
  const spreads = useTradingStore((s) => s.spreads);
  const lastUpdate = useNow();

  const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0);
  const openCount = positions.filter((p) => p.status === 'open').length;
  const bestSpread = spreads.length > 0
    ? Math.max(...spreads.map((s) => s.spreadPct))
    : null;

  return (
    <div className="space-y-6 font-mono">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white text-lg font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted text-xs mt-0.5">Real-time arbitrage monitor</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted text-xs">Updated {lastUpdate}</span>
          <div className={`
            flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold
            ${connected
              ? 'border-profit/40 bg-profit/10 text-profit'
              : 'border-loss/40 bg-loss/10 text-loss'
            }
          `}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-profit animate-pulse' : 'bg-loss'}`} />
            {connected ? 'Live' : 'Offline'}
          </div>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-bg-card border border-bg-border rounded-lg p-4">
          <p className="text-muted text-[10px] uppercase tracking-widest mb-1">Total PnL</p>
          <p className={`text-xl font-bold ${totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
            {formatUsd(totalPnl)}
          </p>
        </div>
        <div className="bg-bg-card border border-bg-border rounded-lg p-4">
          <p className="text-muted text-[10px] uppercase tracking-widest mb-1">Open Positions</p>
          <p className="text-xl font-bold text-white">{openCount}</p>
        </div>
        <div className="bg-bg-card border border-bg-border rounded-lg p-4">
          <p className="text-muted text-[10px] uppercase tracking-widest mb-1">Best Spread</p>
          <p className="text-xl font-bold text-accent">
            {bestSpread !== null ? bestSpread.toFixed(3) + '%' : '—'}
          </p>
        </div>
      </div>

      {/* Equity curve */}
      <section>
        <h3 className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
          <span className="w-1 h-4 bg-accent rounded-full inline-block" />
          Equity Curve
        </h3>
        <div className="bg-bg-card border border-bg-border rounded-lg p-3">
          <EquityCurveChart positions={positions} />
        </div>
      </section>

      {/* Price ticker strip */}
      <section>
        <h3 className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
          <span className="w-1 h-4 bg-accent rounded-full inline-block" />
          Live Prices
        </h3>
        <div className="bg-bg-card border border-bg-border rounded-lg overflow-hidden">
          <PriceTickerStrip />
        </div>
      </section>

      {/* Spread opportunities */}
      <section>
        <h3 className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
          <span className="w-1 h-4 bg-profit rounded-full inline-block" />
          Spread Opportunities
          {spreads.length > 0 && (
            <span className="text-[10px] text-muted bg-bg-border px-1.5 py-0.5 rounded">
              {spreads.length}
            </span>
          )}
        </h3>
        <SpreadOpportunitiesCardGrid spreads={spreads} />
      </section>

      {/* Positions table */}
      <section>
        <h3 className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
          <span className="w-1 h-4 bg-muted rounded-full inline-block" />
          Positions
          {positions.length > 0 && (
            <span className="text-[10px] text-muted bg-bg-border px-1.5 py-0.5 rounded">
              {positions.length}
            </span>
          )}
        </h3>
        <div className="bg-bg-card border border-bg-border rounded-lg overflow-hidden">
          <PositionsTableSortable positions={positions} />
        </div>
      </section>
    </div>
  );
}
