/**
 * Overage Revenue Card Component
 *
 * Phase 5 - Analytics Dashboard
 * Displays overage revenue from API calls exceeding tier limits.
 */

interface OverageRevenueCardProps {
  overageRevenue: number;
  overageCalls: number;
  licensesInOverage: number;
  projectedOverage: number;
}

export function OverageRevenueCard({
  overageRevenue,
  overageCalls,
  licensesInOverage,
  projectedOverage,
}: OverageRevenueCardProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
    }).format(value);

  return (
    <div className="bg-bg-card border border-warning/30 rounded-lg p-4 hover:border-warning/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-muted text-[10px] uppercase tracking-widest">
            Overage Revenue
          </span>
          <div className="text-warning text-2xl font-bold font-mono mt-1">
            {formatCurrency(overageRevenue)}
          </div>
        </div>
        <svg
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          className="text-warning"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <div className="space-y-2 pt-3 border-t border-bg-border">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted">Overage Calls</span>
          <span className="text-white font-mono">{formatNumber(overageCalls)}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted">Licenses in Overage</span>
          <span className="text-white font-mono">{licensesInOverage}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted">Projected Monthly</span>
          <span className="text-accent font-mono">{formatCurrency(projectedOverage)}</span>
        </div>
      </div>
    </div>
  );
}
