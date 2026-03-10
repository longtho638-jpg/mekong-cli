/**
 * Analytics Dashboard Page
 *
 * Main revenue analytics dashboard with metrics, charts, and filters.
 * Auto-refreshes every 30 seconds with live indicator.
 */
import { useState } from 'react';
import { useRevenueAnalytics, TIME_RANGES } from '../hooks/use-revenue-analytics';
import { RevenueMetricsCard, MRRIcon, DALIcon, ChurnIcon, ARPAIcon } from '../components/revenue-metrics-card';
import { RevenueTrendChart } from '../components/revenue-trend-chart';
import { RevenueByTierChart } from '../components/revenue-by-tier';
import { ExportReportButton } from '../components/export-report-button';

export function AnalyticsPage() {
  const {
    metrics,
    loading,
    error,
    timeRange,
    setTimeRange,
    lastUpdated,
    isPolling,
    togglePolling,
    reload,
  } = useRevenueAnalytics();

  const [selectedTier, setSelectedTier] = useState<string>('all');

  // Format last updated time
  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);

    if (diff < 5) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  if (loading && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted">
        <svg className="animate-spin h-10 w-10 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm font-mono">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-loss/10 border border-loss/40 rounded-lg text-loss">
        <h3 className="font-semibold mb-2">Error Loading Analytics</h3>
        <p className="text-sm mb-4">{error}</p>
        <button
          onClick={reload}
          className="px-4 py-2 bg-loss/20 hover:bg-loss/30 rounded text-xs font-mono transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Revenue Analytics</h1>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isPolling ? 'bg-profit animate-pulse' : 'bg-muted'}`} />
              <span className="text-xs text-muted font-mono">
                {isPolling ? `Live · Updated ${formatLastUpdated()}` : 'Paused'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-bg-secondary border border-bg-border rounded p-1">
            {TIME_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`
                  px-3 py-1.5 text-xs font-mono rounded transition-colors
                  ${timeRange === range.value
                    ? 'bg-accent/20 text-accent border border-accent/30'
                    : 'text-muted hover:text-white'
                  }
                `}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Polling Toggle */}
          <button
            onClick={togglePolling}
            className={`
              px-3 py-1.5 text-xs font-mono rounded border transition-colors
              ${isPolling
                ? 'border-profit/30 text-profit hover:border-profit/50'
                : 'border-bg-border text-muted hover:text-white'
              }
            `}
            title={isPolling ? 'Pause auto-refresh' : 'Resume auto-refresh'}
          >
            {isPolling ? (
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Export Button */}
          <ExportReportButton metrics={metrics} timeRange={timeRange} variant="primary" />
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <RevenueMetricsCard
          label="MRR"
          value={`$${metrics?.mrr.toLocaleString() || 0}`}
          change={metrics?.mrrGrowth}
          icon={<MRRIcon />}
          accent="accent"
        />
        <RevenueMetricsCard
          label="DAL"
          value={metrics?.dal.toLocaleString() || 0}
          subValue={`${metrics?.activityRate.toFixed(1)}% activity rate`}
          icon={<DALIcon />}
          accent="profit"
        />
        <RevenueMetricsCard
          label="Churn Rate"
          value={`${(metrics?.churnRate || 0).toFixed(2)}%`}
          icon={<ChurnIcon />}
          accent={metrics?.churnRate && metrics.churnRate > 5 ? 'loss' : 'profit'}
        />
        <RevenueMetricsCard
          label="ARPA"
          value={`$${(metrics?.arpa || 0).toFixed(2)}`}
          icon={<ARPAIcon />}
          accent="warning"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MRR Trend Chart */}
        <RevenueTrendChart
          data={metrics?.trend || []}
          height={280}
        />

        {/* Revenue by Tier Chart */}
        <RevenueByTierChart
          data={metrics?.byTier || []}
          height={280}
        />
      </div>

      {/* Additional Info Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tier Filter Info */}
        <div className="bg-bg-secondary border border-bg-border rounded-lg p-4">
          <h4 className="text-white font-semibold mb-3">Filter by Tier</h4>
          <div className="space-y-2">
            <button
              onClick={() => setSelectedTier('all')}
              className={`
                w-full px-3 py-2 text-sm text-left rounded border transition-colors
                ${selectedTier === 'all'
                  ? 'bg-accent/20 text-accent border-accent/30'
                  : 'border-bg-border text-muted hover:text-white'
                }
              `}
            >
              All Tiers
            </button>
            {metrics?.byTier.map((tier) => (
              <button
                key={tier.tier}
                onClick={() => setSelectedTier(tier.tier)}
                className={`
                  w-full px-3 py-2 text-sm text-left rounded border transition-colors flex items-center justify-between
                  ${selectedTier === tier.tier
                    ? 'bg-accent/20 text-accent border-accent/30'
                    : 'border-bg-border text-muted hover:text-white'
                }
                `}
              >
                <span>{tier.tier}</span>
                <span className="text-xs font-mono">{tier.subscriptionCount} subs</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-bg-secondary border border-bg-border rounded-lg p-4 lg:col-span-2">
          <h4 className="text-white font-semibold mb-3">Quick Stats</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-muted text-xs mb-1">Total Revenue</div>
              <div className="text-white font-bold font-mono text-lg">
                ${metrics?.trend.reduce((sum, t) => sum + t.totalMRR, 0).toLocaleString() || 0}
              </div>
            </div>
            <div>
              <div className="text-muted text-xs mb-1">Avg Growth</div>
              <div className={`font-bold font-mono text-lg ${
                (metrics?.mrrGrowth || 0) >= 0 ? 'text-profit' : 'text-loss'
              }`}>
                {(metrics?.mrrGrowth || 0) >= 0 ? '+' : ''}{metrics?.mrrGrowth?.toFixed(1) || 0}%
              </div>
            </div>
            <div>
              <div className="text-muted text-xs mb-1">Active Subscriptions</div>
              <div className="text-white font-bold font-mono text-lg">
                {metrics?.byTier.reduce((sum, t) => sum + t.subscriptionCount, 0).toLocaleString() || 0}
              </div>
            </div>
            <div>
              <div className="text-muted text-xs mb-1">Data Freshness</div>
              <div className="text-profit font-bold font-mono text-lg">
                {formatLastUpdated()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
