/**
 * Horizontal scrollable strip showing real-time bid/ask prices per exchange:symbol.
 * Flashes green on price increase, red on decrease.
 */
import { useEffect, useRef, useState } from 'react';
import { useTradingStore, PriceTick } from '../stores/trading-store';

interface TickerState {
  tick: PriceTick;
  flash: 'up' | 'down' | null;
}

function formatPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(4);
  return n.toFixed(6);
}

function spreadBps(bid: number, ask: number): string {
  if (bid <= 0) return '—';
  return ((ask - bid) / bid * 10000).toFixed(1) + 'bps';
}

export function PriceTickerStrip() {
  const prices = useTradingStore((s) => s.prices);
  const prevRef = useRef<Record<string, number>>({});
  const [tickers, setTickers] = useState<Record<string, TickerState>>({});

  useEffect(() => {
    setTickers((prev) => {
      const next: Record<string, TickerState> = {};
      for (const [key, tick] of Object.entries(prices)) {
        const prevMid = prevRef.current[key];
        const mid = (tick.bid + tick.ask) / 2;
        let flash: 'up' | 'down' | null = null;
        if (prevMid !== undefined) {
          if (mid > prevMid) flash = 'up';
          else if (mid < prevMid) flash = 'down';
        }
        next[key] = { tick, flash: flash ?? prev[key]?.flash ?? null };
        prevRef.current[key] = mid;
      }
      return next;
    });

    // Clear flashes after 600ms
    const t = setTimeout(() => {
      setTickers((prev) => {
        const cleared: Record<string, TickerState> = {};
        for (const [k, v] of Object.entries(prev)) cleared[k] = { ...v, flash: null };
        return cleared;
      });
    }, 600);
    return () => clearTimeout(t);
  }, [prices]);

  const entries = Object.values(tickers);

  if (entries.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-muted text-xs font-mono">
        <span className="animate-pulse">Waiting for price data...</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <div className="flex gap-3 px-1 py-1 min-w-max">
        {entries.map(({ tick, flash }) => {
          const key = `${tick.exchange}:${tick.symbol}`;
          const flashClass =
            flash === 'up'
              ? 'bg-profit/15 border-profit/40'
              : flash === 'down'
              ? 'bg-loss/15 border-loss/40'
              : 'bg-bg-card border-bg-border';

          return (
            <div
              key={key}
              className={`
                flex flex-col gap-0.5 px-3 py-2 rounded border transition-colors duration-300
                min-w-[140px] ${flashClass}
              `}
            >
              {/* Header: exchange + symbol */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-accent text-xs font-mono font-bold truncate">
                  {tick.exchange}
                </span>
                <span className="text-white text-xs font-mono font-semibold">
                  {tick.symbol}
                </span>
              </div>

              {/* Bid / Ask */}
              <div className="flex gap-2 text-xs font-mono">
                <span className={`${flash === 'up' ? 'text-profit' : flash === 'down' ? 'text-loss' : 'text-white'} transition-colors duration-300`}>
                  B {formatPrice(tick.bid)}
                </span>
                <span className="text-muted">|</span>
                <span className={`${flash === 'up' ? 'text-profit' : flash === 'down' ? 'text-loss' : 'text-muted'} transition-colors duration-300`}>
                  A {formatPrice(tick.ask)}
                </span>
              </div>

              {/* Spread */}
              <div className="text-muted text-[10px] font-mono">
                {spreadBps(tick.bid, tick.ask)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
