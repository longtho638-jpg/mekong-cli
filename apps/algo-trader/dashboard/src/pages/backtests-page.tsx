/**
 * Backtests page: submit backtest jobs and view result history.
 * POST /backtest/submit, GET /backtest/results
 */
import { useState, useEffect, FormEvent } from 'react';
import { useApiClient } from '../hooks/use-api-client';

interface BacktestResult {
  id: string;
  strategyName: string;
  pair: string;
  timeframe: string;
  days: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdownPct: number;
  totalReturnPct: number;
  createdAt: string;
}

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'] as const;
const STRATEGIES = [
  'arb-spread-v1',
  'mean-reversion',
  'trend-follow',
  'stat-arb',
  'momentum',
] as const;

function SharpeChip({ value }: { value: number }) {
  const cls =
    value > 1
      ? 'text-profit border-profit'
      : value < 0
        ? 'text-loss border-loss'
        : 'text-muted border-bg-border';
  return (
    <span className={`text-xs border rounded px-1.5 py-0.5 font-mono ${cls}`}>
      {value.toFixed(2)}
    </span>
  );
}

function MetricCell({ label, value, colored }: { label: string; value: string; colored?: 'profit' | 'loss' | 'neutral' }) {
  const valueClass =
    colored === 'profit'
      ? 'text-profit'
      : colored === 'loss'
        ? 'text-loss'
        : 'text-white';
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted text-xs">{label}</span>
      <span className={`font-mono text-sm ${valueClass}`}>{value}</span>
    </div>
  );
}

const MOCK_RESULTS: BacktestResult[] = [
  {
    id: '1',
    strategyName: 'arb-spread-v1',
    pair: 'BTC/USDT',
    timeframe: '1h',
    days: 30,
    sharpeRatio: 1.82,
    sortinoRatio: 2.14,
    maxDrawdownPct: 4.3,
    totalReturnPct: 18.7,
    createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: '2',
    strategyName: 'mean-reversion',
    pair: 'ETH/USDT',
    timeframe: '4h',
    days: 60,
    sharpeRatio: 0.67,
    sortinoRatio: 0.89,
    maxDrawdownPct: 11.2,
    totalReturnPct: 6.1,
    createdAt: '2026-02-28T14:30:00Z',
  },
  {
    id: '3',
    strategyName: 'trend-follow',
    pair: 'SOL/USDT',
    timeframe: '1d',
    days: 90,
    sharpeRatio: -0.23,
    sortinoRatio: -0.31,
    maxDrawdownPct: 28.6,
    totalReturnPct: -3.4,
    createdAt: '2026-02-25T09:15:00Z',
  },
];

export function BacktestsPage() {
  const { fetchApi, loading } = useApiClient();
  const [results, setResults] = useState<BacktestResult[]>(MOCK_RESULTS);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [pair, setPair] = useState('BTC/USDT');
  const [timeframe, setTimeframe] = useState<string>('1h');
  const [strategy, setStrategy] = useState<string>(STRATEGIES[0]);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchApi<BacktestResult[]>('/backtest/results').then((data) => {
      if (data && data.length > 0) setResults(data);
    });
  }, [fetchApi]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    const res = await fetchApi<{ jobId: string }>('/backtest/submit', {
      method: 'POST',
      body: JSON.stringify({ pair, timeframe, strategyName: strategy, days }),
    });
    setSubmitting(false);
    if (res) {
      setSuccessMsg(`Job submitted: ${res.jobId ?? 'queued'}`);
    } else {
      setSuccessMsg('Submitted (backend unavailable — mock mode)');
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-white text-2xl font-bold">Backtests</h1>

      {/* Submit form */}
      <section className="bg-bg-card border border-bg-border rounded-lg p-6">
        <h2 className="text-accent text-sm font-semibold uppercase tracking-wider mb-4">
          Submit Backtest
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pair */}
          <div className="flex flex-col gap-1">
            <label className="text-muted text-xs">Pair</label>
            <input
              type="text"
              value={pair}
              onChange={(e) => setPair(e.target.value)}
              placeholder="BTC/USDT"
              className="bg-bg border border-bg-border rounded px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-accent"
              required
            />
          </div>

          {/* Timeframe */}
          <div className="flex flex-col gap-1">
            <label className="text-muted text-xs">Timeframe</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-bg border border-bg-border rounded px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-accent"
            >
              {TIMEFRAMES.map((tf) => (
                <option key={tf} value={tf}>{tf}</option>
              ))}
            </select>
          </div>

          {/* Strategy */}
          <div className="flex flex-col gap-1">
            <label className="text-muted text-xs">Strategy</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="bg-bg border border-bg-border rounded px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-accent"
            >
              {STRATEGIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Days */}
          <div className="flex flex-col gap-1">
            <label className="text-muted text-xs">Days</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              min={1}
              max={365}
              className="bg-bg border border-bg-border rounded px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-accent"
              required
            />
          </div>

          {/* Submit */}
          <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-4">
            <button
              type="submit"
              disabled={submitting || loading}
              className="bg-accent text-bg font-bold text-sm px-6 py-2 rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {submitting ? 'Submitting…' : 'Run Backtest'}
            </button>
            {successMsg && (
              <span className="text-profit text-sm font-mono">{successMsg}</span>
            )}
          </div>
        </form>
      </section>

      {/* Results list */}
      <section>
        <h2 className="text-accent text-sm font-semibold uppercase tracking-wider mb-4">
          Results ({results.length})
        </h2>
        {results.length === 0 ? (
          <p className="text-muted text-sm">No backtest results yet.</p>
        ) : (
          <div className="space-y-3">
            {results.map((r) => (
              <div
                key={r.id}
                className="bg-bg-card border border-bg-border rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 items-center"
              >
                {/* Strategy + meta */}
                <div className="col-span-2 md:col-span-1 lg:col-span-2">
                  <p className="text-white font-mono text-sm font-semibold">{r.strategyName}</p>
                  <p className="text-muted text-xs mt-0.5">
                    {r.pair} · {r.timeframe} · {r.days}d
                  </p>
                  <p className="text-muted text-xs">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>

                {/* Sharpe */}
                <div className="flex flex-col gap-1">
                  <span className="text-muted text-xs">Sharpe</span>
                  <SharpeChip value={r.sharpeRatio} />
                </div>

                {/* Sortino */}
                <MetricCell
                  label="Sortino"
                  value={r.sortinoRatio.toFixed(2)}
                  colored={r.sortinoRatio > 1 ? 'profit' : r.sortinoRatio < 0 ? 'loss' : 'neutral'}
                />

                {/* Drawdown */}
                <MetricCell
                  label="Max DD"
                  value={`-${r.maxDrawdownPct.toFixed(1)}%`}
                  colored="loss"
                />

                {/* Return */}
                <MetricCell
                  label="Return"
                  value={`${r.totalReturnPct >= 0 ? '+' : ''}${r.totalReturnPct.toFixed(1)}%`}
                  colored={r.totalReturnPct >= 0 ? 'profit' : 'loss'}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default BacktestsPage;
