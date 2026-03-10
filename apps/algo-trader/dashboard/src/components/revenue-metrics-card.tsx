/**
 * Revenue Metrics Card
 *
 * Displays a single revenue metric with value, label, and change indicator.
 * Used for MRR, DAL, Churn, and ARPA summary cards.
 */

interface RevenueMetricsCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  accent?: 'default' | 'profit' | 'loss' | 'accent' | 'warning';
  subValue?: string;
}

export function RevenueMetricsCard({
  label,
  value,
  change,
  icon,
  accent = 'default',
  subValue,
}: RevenueMetricsCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const isNegative = change !== undefined && change < 0;

  const accentClasses = {
    default: 'text-white',
    profit: 'text-profit',
    loss: 'text-loss',
    accent: 'text-accent',
    warning: 'text-warning',
  };

  const changeColorClass = isPositive
    ? 'text-profit'
    : isNegative
    ? 'text-loss'
    : 'text-muted';

  const arrowIcon = change !== undefined
    ? isPositive
      ? (
        <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 4l-8 8h6v8h4v-8h6z" transform="rotate(180 12 12)" />
        </svg>
      )
      : (
        <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 4l-8 8h6v8h4v-8h6z" />
        </svg>
      )
    : null;

  return (
    <div className="bg-bg-secondary border border-bg-border rounded-lg p-4 hover:border-bg-border/60 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-muted text-[10px] uppercase tracking-widest">{label}</span>
        {icon && <span className="text-muted flex-shrink-0">{icon}</span>}
      </div>

      {/* Value */}
      <div className={`${accentClasses[accent]} text-2xl font-bold font-mono mb-2`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>

      {/* Change indicator */}
      {change !== undefined && (
        <div className="flex items-center gap-1.5">
          <span className={`flex items-center gap-0.5 text-xs font-mono ${changeColorClass}`}>
            {arrowIcon}
            {Math.abs(change).toFixed(1)}%
          </span>
          <span className="text-muted text-xs">vs last period</span>
        </div>
      )}

      {/* Sub-value (e.g., activity rate) */}
      {subValue && (
        <div className="mt-2 text-muted text-xs font-mono">
          {subValue}
        </div>
      )}
    </div>
  );
}

/**
 * MRR Icon
 */
export function MRRIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

/**
 * DAL Icon (Daily Active Licenses)
 */
export function DALIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 9h6M9 13h6M9 17h4" strokeLinecap="round" />
      <circle cx="17" cy="7" r="1" fill="currentColor" />
    </svg>
  );
}

/**
 * Churn Icon
 */
export function ChurnIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
  );
}

/**
 * ARPA Icon (Average Revenue Per Account)
 */
export function ARPAIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}
