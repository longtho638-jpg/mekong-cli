/**
 * Marketplace page: browse, filter, and search trading strategies.
 * GET /strategies or /marketplace/strategies
 */
import { useState, useEffect, useMemo } from 'react';
import { useApiClient } from '../hooks/use-api-client';

type StrategyType = 'trend' | 'momentum' | 'arbitrage';

interface Strategy {
  id: string;
  name: string;
  description: string;
  type: StrategyType;
  author: string;
  rating: number; // 0–5
  winRatePct: number;
  avgReturnPct: number;
}

const MOCK_STRATEGIES: Strategy[] = [
  {
    id: '1',
    name: 'BTC Arb Spread v2',
    description: 'Cross-exchange arbitrage on BTC/USDT using real-time spread detection.',
    type: 'arbitrage',
    author: 'algo-core',
    rating: 4.5,
    winRatePct: 71.2,
    avgReturnPct: 0.18,
  },
  {
    id: '2',
    name: 'ETH Momentum Rider',
    description: 'Momentum-based strategy using RSI and volume surge on ETH pairs.',
    type: 'momentum',
    author: 'quant-labs',
    rating: 3.8,
    winRatePct: 58.4,
    avgReturnPct: 0.42,
  },
  {
    id: '3',
    name: 'Trend Follow Pro',
    description: 'EMA crossover trend follower with trailing stop-loss for major pairs.',
    type: 'trend',
    author: 'trade-bot-co',
    rating: 4.1,
    winRatePct: 63.0,
    avgReturnPct: 0.31,
  },
  {
    id: '4',
    name: 'SOL/ETH Stat Arb',
    description: 'Statistical arbitrage exploiting mean-reverting spread between SOL and ETH.',
    type: 'arbitrage',
    author: 'algo-core',
    rating: 4.9,
    winRatePct: 76.8,
    avgReturnPct: 0.22,
  },
  {
    id: '5',
    name: 'MACD Momentum Scalper',
    description: 'Short-timeframe scalping using MACD divergence signals on top 10 pairs.',
    type: 'momentum',
    author: 'devtrader',
    rating: 3.2,
    winRatePct: 54.1,
    avgReturnPct: 0.09,
  },
  {
    id: '6',
    name: 'Ichimoku Trend Gate',
    description: 'Multi-signal trend confirmation using Ichimoku Cloud on 4h candles.',
    type: 'trend',
    author: 'quant-labs',
    rating: 4.3,
    winRatePct: 67.5,
    avgReturnPct: 0.38,
  },
];

const TYPE_COLORS: Record<StrategyType, string> = {
  trend: 'bg-accent/10 text-accent border-accent/30',
  momentum: 'bg-profit/10 text-profit border-profit/30',
  arbitrage: 'bg-loss/10 text-loss border-loss/30',
};

function StarRating({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <span className="text-yellow-400 text-xs font-mono" title={`${value}/5`}>
      {'★'.repeat(full)}
      {half ? '½' : ''}
      {'☆'.repeat(5 - full - (half ? 1 : 0))}
      <span className="text-muted ml-1">{value.toFixed(1)}</span>
    </span>
  );
}

type FilterType = 'all' | StrategyType;
const FILTERS: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Trend', value: 'trend' },
  { label: 'Momentum', value: 'momentum' },
  { label: 'Arbitrage', value: 'arbitrage' },
];

export function MarketplacePage() {
  const { fetchApi } = useApiClient();
  const [strategies, setStrategies] = useState<Strategy[]>(MOCK_STRATEGIES);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    fetchApi<Strategy[]>('/marketplace/strategies').then((data) => {
      if (data && data.length > 0) setStrategies(data);
    });
  }, [fetchApi]);

  const visible = useMemo(() => {
    let list = strategies;
    if (filter !== 'all') list = list.filter((s) => s.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.author.toLowerCase().includes(q),
      );
    }
    return list;
  }, [strategies, filter, search]);

  return (
    <div className="space-y-6">
      <h1 className="text-white text-2xl font-bold">Strategy Marketplace</h1>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search strategies…"
          className="flex-1 bg-bg-card border border-bg-border rounded px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-accent placeholder:text-muted"
        />
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-2 rounded text-xs font-semibold border transition-colors ${
                filter === f.value
                  ? 'bg-accent text-bg border-accent'
                  : 'bg-bg-card border-bg-border text-muted hover:border-accent hover:text-accent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Strategy grid */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-4xl mb-3">🔍</span>
          <p className="text-muted text-sm">No strategies found</p>
          <p className="text-muted text-xs mt-1">Try a different search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((s) => (
            <div
              key={s.id}
              className="bg-bg-card border border-bg-border rounded-lg p-5 flex flex-col gap-3 hover:border-accent/50 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <p className="text-white font-semibold text-sm leading-snug">{s.name}</p>
                <span
                  className={`text-xs border rounded px-2 py-0.5 font-mono shrink-0 ${TYPE_COLORS[s.type]}`}
                >
                  {s.type}
                </span>
              </div>

              {/* Description */}
              <p className="text-muted text-xs leading-relaxed">{s.description}</p>

              {/* Stats row */}
              <div className="flex gap-4 text-xs font-mono">
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted">Win Rate</span>
                  <span className="text-profit">{s.winRatePct.toFixed(1)}%</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted">Avg Return</span>
                  <span className="text-profit">+{s.avgReturnPct.toFixed(2)}%</span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-1 border-t border-bg-border">
                <StarRating value={s.rating} />
                <span className="text-muted text-xs font-mono">by {s.author}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MarketplacePage;
