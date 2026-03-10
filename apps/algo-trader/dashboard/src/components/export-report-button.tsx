/**
 * Export Report Button
 *
 * Exports analytics data to CSV format for download.
 * Includes timestamp in filename for version tracking.
 */
import { useCallback } from 'react';
import type { AnalyticsMetrics } from '../hooks/use-revenue-analytics';

interface ExportReportButtonProps {
  metrics: AnalyticsMetrics | null;
  timeRange: string;
  className?: string;
  variant?: 'primary' | 'ghost';
}

export function ExportReportButton({
  metrics,
  timeRange,
  className = '',
  variant = 'ghost',
}: ExportReportButtonProps) {
  const handleExport = useCallback(() => {
    if (!metrics) return;

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `analytics-report-${timeRange}-${timestamp}.csv`;

    // Build CSV content
    const csvRows: string[][] = [];

    // Header
    csvRows.push(['Analytics Report', `Generated: ${new Date().toLocaleString()}`]);
    csvRows.push(['Time Range', timeRange]);
    csvRows.push([]);

    // Summary Metrics
    csvRows.push(['=== SUMMARY METRICS ===']);
    csvRows.push(['Metric', 'Value', 'Change']);
    csvRows.push(['MRR (Monthly Recurring Revenue)', `$${metrics.mrr.toLocaleString()}`, `${metrics.mrrGrowth !== undefined ? (metrics.mrrGrowth >= 0 ? '+' : '') + metrics.mrrGrowth.toFixed(1) + '%' : 'N/A'}`]);
    csvRows.push(['DAL (Daily Active Licenses)', metrics.dal.toLocaleString(), 'N/A']);
    csvRows.push(['Churn Rate', `${metrics.churnRate.toFixed(2)}%`, 'N/A']);
    csvRows.push(['ARPA (Avg Revenue Per Account)', `$${metrics.arpa.toFixed(2)}`, 'N/A']);
    csvRows.push([]);

    // Revenue Trend
    csvRows.push(['=== REVENUE TREND ===']);
    csvRows.push(['Month', 'MRR (USD)', 'Growth Rate']);
    metrics.trend.forEach((point) => {
      csvRows.push([
        point.month,
        point.totalMRR.toLocaleString(),
        point.growthRate !== undefined ? `${point.growthRate >= 0 ? '+' : ''}${point.growthRate.toFixed(2)}%` : 'N/A'
      ]);
    });
    csvRows.push([]);

    // Revenue by Tier
    csvRows.push(['=== REVENUE BY TIER ===']);
    csvRows.push(['Tier', 'Revenue (USD)', 'Percentage', 'Subscriptions']);
    metrics.byTier.forEach((tier) => {
      csvRows.push([
        tier.tier,
        `$${tier.revenue.toLocaleString()}`,
        `${tier.percentage.toFixed(2)}%`,
        tier.subscriptionCount.toString()
      ]);
    });

    // Convert to CSV string
    const csvContent = csvRows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [metrics, timeRange]);

  const buttonStyles = {
    primary:
      'bg-accent text-white hover:bg-accent/80 border-transparent',
    ghost:
      'bg-transparent text-muted hover:text-white border-bg-border hover:border-bg-border/60',
  };

  return (
    <button
      onClick={handleExport}
      disabled={!metrics}
      className={`
        flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded border transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        ${buttonStyles[variant]}
        ${className}
      `}
      title="Export analytics data to CSV"
    >
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-2-2m0 0l-2 2m2-2v10" transform="translate(-4, -4)" />
      </svg>
      Export CSV
    </button>
  );
}
