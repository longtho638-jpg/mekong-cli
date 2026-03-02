/**
 * Equity curve chart: cumulative PnL over closed positions using lightweight-charts.
 * Green line when overall PnL positive, red when negative.
 */
import { useMemo } from 'react';
import type { Position } from '../stores/trading-store';
import { PriceChartLightweight } from './price-chart-lightweight';

interface EquityCurveProps {
  positions: Position[];
}

function toDateString(index: number): string {
  // Generate synthetic daily dates from today backwards for closed positions
  const d = new Date();
  d.setDate(d.getDate() - index);
  return d.toISOString().split('T')[0];
}

export function EquityCurveChart({ positions }: EquityCurveProps) {
  const { chartData, isPositive } = useMemo(() => {
    const closed = positions.filter((p) => p.status === 'closed');
    if (closed.length === 0) return { chartData: [], isPositive: true };

    let cumulative = 0;
    const data = closed.map((p, i) => {
      cumulative += p.pnl;
      return {
        time: toDateString(closed.length - 1 - i),
        value: parseFloat(cumulative.toFixed(4)),
      };
    });

    return { chartData: data, isPositive: cumulative >= 0 };
  }, [positions]);

  const lineColor = isPositive ? '#00FF41' : '#FF3366';
  const hasClosed = chartData.length > 0;

  return (
    <div className="w-full">
      {hasClosed ? (
        <PriceChartLightweight
          data={chartData}
          height={200}
          color={lineColor}
          title="Cumulative PnL"
        />
      ) : (
        <div className="flex items-center justify-center h-[200px] text-muted text-xs">
          No closed positions yet
        </div>
      )}
    </div>
  );
}
