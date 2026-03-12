/**
 * ROI Metrics Overview Component
 *
 * Phase 5 - Analytics Dashboard
 * Shows comprehensive ROI metrics including:
 * - MRR, ARR, Total Revenue
 * - Overage Revenue
 * - Customer LTV
 * - Churn Rate
 * - License Health Score
 */

interface RoiMetricsOverviewProps {
  mrr: number;
  arr: number;
  totalRevenue: number;
  overageRevenue: number;
  ltv: number;
  churnRate: number;
  healthScore: number;
}

export function RoiMetricsOverview({
  mrr,
  arr,
  totalRevenue,
  overageRevenue,
  ltv,
  churnRate,
  healthScore,
}: RoiMetricsOverviewProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const formatPercent = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    }).format(value / 100);

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-profit';
    if (score >= 60) return 'text-warning';
    return 'text-loss';
  };

  const getChurnColor = (rate: number) => {
    if (rate <= 3) return 'text-profit';
    if (rate <= 7) return 'text-warning';
    return 'text-loss';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* MRR + ARR Card */}
      <div className="bg-bg-card border border-bg-border rounded-lg p-4 hover:border-bg-border/60 transition-colors">
        <div className="flex items-start justify-between mb-2">
          <span className="text-muted text-[10px] uppercase tracking-widest">
            MRR / ARR
          </span>
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className="text-muted"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="text-accent text-xl font-bold font-mono mb-1">
          {formatCurrency(mrr)}
        </div>
        <div className="text-muted text-xs font-mono">
          ARR: {formatCurrency(arr)}
        </div>
      </div>

      {/* Total Revenue + Overage Card */}
      <div className="bg-bg-card border border-bg-border rounded-lg p-4 hover:border-bg-border/60 transition-colors">
        <div className="flex items-start justify-between mb-2">
          <span className="text-muted text-[10px] uppercase tracking-widest">
            Revenue
          </span>
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className="text-muted"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <div className="text-white text-xl font-bold font-mono mb-1">
          {formatCurrency(totalRevenue)}
        </div>
        {overageRevenue > 0 && (
          <div className="text-warning text-xs font-mono">
            +{formatCurrency(overageRevenue)} overage
          </div>
        )}
      </div>

      {/* LTV + Churn Card */}
      <div className="bg-bg-card border border-bg-border rounded-lg p-4 hover:border-bg-border/60 transition-colors">
        <div className="flex items-start justify-between mb-2">
          <span className="text-muted text-[10px] uppercase tracking-widest">
            Customer Value
          </span>
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className="text-muted"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <div className="text-white text-xl font-bold font-mono mb-1">
          LTV: {formatCurrency(ltv)}
        </div>
        <div
          className={`text-xs font-mono ${getChurnColor(churnRate)}`}
        >
          Churn: {formatPercent(churnRate)}
        </div>
      </div>

      {/* Health Score Card */}
      <div className="bg-bg-card border border-bg-border rounded-lg p-4 hover:border-bg-border/60 transition-colors">
        <div className="flex items-start justify-between mb-2">
          <span className="text-muted text-[10px] uppercase tracking-widest">
            License Health
          </span>
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            className="text-muted"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div
          className={`${getHealthColor(healthScore)} text-xl font-bold font-mono mb-1`}
        >
          {healthScore}/100
        </div>
        <div className="text-muted text-xs font-mono">
          Overall health score
        </div>
      </div>
    </div>
  );
}
