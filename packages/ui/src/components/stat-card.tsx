import * as React from "react";
import { cn } from "../utils";
import { formatCompact, formatCurrency, formatPercent } from "../utils";

/**
 * 🏯 AgencyOS Stat Card
 * KPI display with trend indicator
 */
export interface StatCardProps {
  title: string;
  value: number | string;
  format?: "number" | "currency" | "percent" | "compact";
  currency?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  format = "number",
  currency = "USD",
  trend,
  trendLabel,
  icon,
  className,
}: StatCardProps) {
  const formattedValue = React.useMemo(() => {
    if (typeof value === "string") return value;
    switch (format) {
      case "currency":
        return formatCurrency(value, currency);
      case "percent":
        return formatPercent(value);
      case "compact":
        return formatCompact(value);
      default:
        return value.toLocaleString();
    }
  }, [value, format, currency]);

  const trendColor =
    trend && trend > 0
      ? "text-emerald-500"
      : trend && trend < 0
        ? "text-rose-500"
        : "text-gray-500";
  const trendIcon = trend && trend > 0 ? "↑" : trend && trend < 0 ? "↓" : "→";

  return (
    <div
      className={cn(
        "rounded-2xl bg-surface p-6 shadow-lg hover:shadow-xl transition-shadow",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-on-surface-variant font-medium">{title}</p>
          <p className="mt-2 text-3xl font-bold text-on-surface">
            {formattedValue}
          </p>
          {trend !== undefined && (
            <div
              className={cn("mt-2 flex items-center gap-1 text-sm", trendColor)}
            >
              <span>{trendIcon}</span>
              <span>{Math.abs(trend)}%</span>
              {trendLabel && (
                <span className="text-on-surface-variant">vs {trendLabel}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
