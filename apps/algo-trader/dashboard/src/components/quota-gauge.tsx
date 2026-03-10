/**
 * Quota Gauge Component
 *
 * Displays usage vs quota with color-coded progress bar.
 * Color coding: green (<50%), yellow (50-80%), red (>80%)
 */

interface QuotaGaugeProps {
  label: string;
  used: number;
  limit: number;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function QuotaGauge({ label, used, limit, unit = '', size = 'md' }: QuotaGaugeProps) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  const colorClass = percentage >= 80
    ? 'bg-loss'
    : percentage >= 50
      ? 'bg-warning'
      : 'bg-profit';

  const textColorClass = percentage >= 80
    ? 'text-loss'
    : percentage >= 50
      ? 'text-warning'
      : 'text-profit';

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const valueSizeClasses = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className={`text-muted ${labelSizeClasses[size]}`}>{label}</span>
        <span className={`text-white font-mono ${valueSizeClasses[size]}`}>
          {used.toLocaleString()} / {limit.toLocaleString()} {unit}
        </span>
      </div>
      <div className={`w-full bg-bg-border rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`h-full ${colorClass} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className={`text-right ${textColorClass} ${valueSizeClasses[size]} font-mono`}>
        {percentage.toFixed(1)}% used
      </div>
    </div>
  );
}

/**
 * Circular Gauge Component
 *
 * Alternative circular progress indicator for quota display.
 */
interface CircularGaugeProps {
  value: number;
  max: number;
  label: string;
  subLabel?: string;
  size?: number;
  strokeWidth?: number;
}

export function CircularGauge({
  value,
  max,
  label,
  subLabel,
  size = 120,
  strokeWidth = 8
}: CircularGaugeProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const colorClass = percentage >= 80
    ? 'text-loss'
    : percentage >= 50
      ? 'text-warning'
      : 'text-profit';

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative"
        style={{ width: size, height: size }}
      >
        {/* Background circle */}
        <svg
          className="transform -rotate-90 w-full h-full"
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            className="text-bg-border"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Progress circle */}
          <circle
            className={`${colorClass} transition-all duration-500 ease-out`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold text-white font-mono`}>
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <div className="text-white text-sm font-semibold">{label}</div>
        {subLabel && <div className="text-muted text-xs font-mono">{subLabel}</div>}
      </div>
    </div>
  );
}
